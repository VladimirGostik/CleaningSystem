import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { importExpenses, checkImportDuplicates } from '../services/expansesService';

// Pomocné polia, ktoré si držíme len v UI - do backendu ich neposielame
const stripUiFields = (record) => {
  const { _duplicate, _duplicateInFile, _matchedBy, _existing, _import, ...rest } = record;
  return rest;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('sk-SK');
};

const ImportExpenseRecordsModal = ({ onClose, onSubmit, companies }) => {
  const [loading, setLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Overí na backende, ktoré záznamy už boli naimportované, a výsledok zapíše
  // priamo do záznamov. Duplicity sa štandardne na import neoznačia.
  const runDuplicateCheck = useCallback(async (records) => {
    if (!records || records.length === 0) return records || [];
    setCheckingDuplicates(true);
    try {
      const response = await checkImportDuplicates(records.map(stripUiFields));
      const results = response?.data?.results || [];
      return records.map((record, index) => {
        const result = results[index] || {};
        return {
          ...record,
          _duplicate: Boolean(result.duplicate),
          _duplicateInFile: Boolean(result.duplicateInFile),
          _matchedBy: result.matchedBy || null,
          _existing: result.existing || null,
          _import: !result.duplicate,
        };
      });
    } catch (error) {
      console.error('Chyba pri kontrole duplicít:', error);
      toast.error('Nepodarilo sa overiť duplicity. Kontrola prebehne až pri samotnom importe.');
      // Bez kontroly necháme všetko označené - backend duplicity aj tak zachytí
      return records.map((record) => ({ ...record, _import: record._import !== false }));
    } finally {
      setCheckingDuplicates(false);
    }
  }, []);

  // Načítanie z cache pri otvorení modálu
  useEffect(() => {
    const cached = localStorage.getItem('importedExpenseRecords');
    if (cached && cached !== 'undefined') {
      try {
        const parsed = JSON.parse(cached);
        setExpenseRecords(parsed);
        setLoadedFromCache(true);
        // Aj pri načítaní z cache overíme duplicity - medzitým sa mohlo importovať
        runDuplicateCheck(parsed).then(setExpenseRecords);
      } catch (error) {
        console.error('Chyba pri parsovaní cache:', error);
        setExpenseRecords([]);
      }
    }
  }, [runDuplicateCheck]);

  const parseExpenseRecord = (ntry, ns, companies) => {
    const cdtDbtInd = ntry.getElementsByTagNameNS(ns, 'CdtDbtInd')[0]?.textContent;
    if (cdtDbtInd !== 'DBIT') return null;

    const ntry_ref = ntry.getElementsByTagNameNS(ns, 'NtryRef')[0]?.textContent?.trim() || null;
    const amount = ntry.getElementsByTagNameNS(ns, 'Amt')[0]?.textContent;
    const paymentDate = ntry.getElementsByTagNameNS(ns, 'BookgDt')[0]
      ?.getElementsByTagNameNS(ns, 'Dt')[0]
      ?.textContent;

    const txDtls = ntry.getElementsByTagNameNS(ns, 'TxDtls')[0];
    let name = '', description = '';
    if (txDtls) {
      const Cdtr = txDtls.getElementsByTagNameNS(ns, 'Cdtr')[0];
      if (Cdtr) {
        name = Cdtr.getElementsByTagNameNS(ns, 'Nm')[0]?.textContent || '';
        description = Cdtr.getElementsByTagNameNS(ns, 'StrtNm')[0]?.textContent || '';
      }
    }

    if (!description || description.trim() === '') {
      const rmtInf = ntry.getElementsByTagNameNS(ns, 'RmtInf')[0];
      if (rmtInf) {
        const ustrd = rmtInf.getElementsByTagNameNS(ns, 'Ustrd')[0]?.textContent;
        if (ustrd) {
          if (ustrd.includes('S6AV062V')) {
            description = 'Výber z bankomatu';
          } else {
            description = ustrd;
          }
        }
      }
    }

    let iban = '';
    if (txDtls) {
      const dbtrAcct = txDtls.getElementsByTagNameNS(ns, 'DbtrAcct')[0]?.getElementsByTagNameNS(ns, 'Id')[0]?.getElementsByTagNameNS(ns, 'IBAN')[0]?.textContent;;
      if (dbtrAcct) {
        iban = txDtls.getElementsByTagNameNS(ns, 'DbtrAcct')[0]?.getElementsByTagNameNS(ns, 'Id')[0]?.getElementsByTagNameNS(ns, 'IBAN')[0]?.textContent;
      }
    }
    let id_company = '';
    if (iban && companies && companies.length) {
      // Odstráni medzery z IBANu z XML
      const xmlIban = iban.replace(/\s+/g, '');
      // Pridá medzeru za každé štyri znaky, aby zodpovedal formátu v companies
      const formattedXmlIban = xmlIban.replace(/(.{4})/g, '$1 ').trim();
    
      const company = companies.find(c => {
        // Predpokladáme, že IBAN v companies už má správny formát, napr. "SK02 0200 0000 0050 4715 7358"
        return (c.company_iban || '').trim() === formattedXmlIban;
      });

      if (company) {
        id_company = company.id;
      }
    }

    return {
      id_company,
      name,
      description,
      price: amount,
      type: "jednorazova",
      deductibility: 100,
      start_date: paymentDate,
      ntry_ref,
      // IBAN posielame kvôli rozpoznaniu duplicity pri výpisoch bez NtryRef
      iban,
    };
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleLoadFromFile = () => {
    if (!selectedFile) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const xmlText = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const ns = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02';
      const parsedRecords = Array.from(xmlDoc.getElementsByTagNameNS(ns, 'Ntry'))
        .map(ntry => parseExpenseRecord(ntry, ns, companies))
        .filter(Boolean);

      // Hneď po načítaní súboru zistíme, ktoré záznamy už v systéme sú
      const checked = await runDuplicateCheck(parsedRecords);
      localStorage.setItem('importedExpenseRecords', JSON.stringify(checked));
      setExpenseRecords(checked);
      setLoadedFromCache(false);
      setLoading(false);

      const duplicates = checked.filter(r => r._duplicate).length;
      if (duplicates > 0) {
        toast.info(`Načítaných ${checked.length} záznamov, z toho ${duplicates} už bolo naimportovaných - tie sú odznačené.`);
      }
    };
    reader.onerror = (e) => {
      console.error('Chyba pri načítaní súboru:', e);
      setLoading(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleRemoveRecord = (indexToRemove) => {
    const newRecords = expenseRecords.filter((_, index) => index !== indexToRemove);
    setExpenseRecords(newRecords);
    localStorage.setItem('importedExpenseRecords', JSON.stringify(newRecords));
  };

  const handleEditRecord = (index, field, value) => {
    const updatedRecords = expenseRecords.map((record, i) => {
      if (i === index) {
        return { ...record, [field]: value };
      }
      return record;
    });
    setExpenseRecords(updatedRecords);
    localStorage.setItem('importedExpenseRecords', JSON.stringify(updatedRecords));
  };

  // Prepnutie, či sa daný riadok má importovať (duplicitu vie používateľ potvrdiť ručne)
  const handleToggleImport = (indexToToggle) => {
    const updated = expenseRecords.map((record, index) =>
      index === indexToToggle ? { ...record, _import: !record._import } : record
    );
    setExpenseRecords(updated);
    localStorage.setItem('importedExpenseRecords', JSON.stringify(updated));
  };

  const handleImportClick = async () => {
    const toImport = expenseRecords.filter(record => record._import !== false);
    if (toImport.length === 0) {
      toast.warn('Nie je označený žiadny výdavok na import.');
      return;
    }

    setLoading(true);
    try {
      const payload = toImport.map(record => ({
        ...stripUiFields(record),
        // Označená duplicita = používateľ ju vedome potvrdil, backend ju nemá preskočiť
        force: Boolean(record._duplicate),
      }));
      const response = await importExpenses(payload);
      const data = response?.data || {};
      const imported = data.importedCount ?? (data.expenses || []).length;
      const skipped = data.skippedDuplicates ?? 0;

      toast.success(
        skipped > 0
          ? `Naimportovaných ${imported} výdavkov, preskočených ${skipped} duplicít.`
          : `Naimportovaných ${imported} výdavkov.`
      );

      if (onSubmit) {
        onSubmit(data.expenses || []);
      }
      localStorage.removeItem('importedExpenseRecords');
    } catch (error) {
      console.error('Chyba pri importe výdavkov:', error);
      toast.error('Import výdavkov zlyhal.');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const duplicateCount = expenseRecords.filter(record => record._duplicate).length;
  const selectedCount = expenseRecords.filter(record => record._import !== false).length;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={headerStyle}>
          Importované výdavky
          {loadedFromCache && <span style={cacheLabelStyle}> (z cache: nepriradené výdavky)</span>}
        </h3>
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <input type="file" accept=".xml" onChange={handleFileSelect} style={fileInputStyle} />
          <button onClick={handleLoadFromFile} style={sortButtonStyle} disabled={!selectedFile}>
            Načítať výdavky zo súboru
          </button>
        </div>
        {expenseRecords.length > 0 && (
          <div style={summaryStyle}>
            {checkingDuplicates ? (
              <span>Kontrolujem duplicity…</span>
            ) : (
              <>
                <span>Načítaných: <strong>{expenseRecords.length}</strong></span>
                <span style={{ color: duplicateCount > 0 ? '#c0392b' : '#27ae60' }}>
                  Duplicít: <strong>{duplicateCount}</strong>
                </span>
                <span>Na import označených: <strong>{selectedCount}</strong></span>
              </>
            )}
          </div>
        )}
        {loading ? (
          <div style={loadingStyle}>Načítavam...</div>
        ) : expenseRecords.length > 0 ? (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead style={theadStyle}>
                <tr>
                  <th style={{ ...thStyle, width: '4%' }} title="Importovať tento záznam">Imp.</th>
                  <th style={{ ...thStyle, width: '17%' }}>Názov</th>
                  <th style={{ ...thStyle, width: '23%' }}>Popis</th>
                  <th style={{ ...thStyle, width: '10%' }}>Suma (€)</th>
                  <th style={{ ...thStyle, width: '7%' }}>Odpočítateľnosť</th>
                  <th style={{ ...thStyle, width: '10%' }}>Dátum začiatku</th>
                  <th style={{ ...thStyle, width: '19%' }}>Stav</th>
                  <th style={{ ...thStyle, width: '10%' }}>Akcia</th>
                </tr>
              </thead>
              <tbody style={tbodyStyle}>
                {expenseRecords.map((record, index) => (
                  <tr
                    key={index}
                    style={{
                      ...trStyle,
                      // Duplicity vizuálne odlíšime, nech ich používateľ hneď vidí
                      backgroundColor: record._duplicate ? '#fdecea' : undefined,
                      opacity: record._import === false ? 0.65 : 1,
                    }}
                  >
                    <td style={{ ...tdStyle, width: '4%', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={record._import !== false}
                        onChange={() => handleToggleImport(index)}
                        title={record._duplicate
                          ? 'Duplicita - zaškrtnutím ju naimportuješ napriek tomu'
                          : 'Importovať tento záznam'}
                      />
                    </td>
                    <td style={{ ...tdStyle, width: '17%' }}>
                      <input
                        type="text"
                        value={record.name || ''}
                        onChange={(e) => handleEditRecord(index, 'name', e.target.value)}
                        style={inputStyle}
                        placeholder="Zadaj názov"
                      />
                    </td>
                    <td style={{ ...tdStyle, width: '23%' }}>
                      <input
                        type="text"
                        value={record.description || ''}
                        onChange={(e) => handleEditRecord(index, 'description', e.target.value)}
                        style={inputStyle}
                        placeholder="Zadaj popis"
                      />
                    </td>
                    <td style={{ ...tdStyle, width: '10%' }}>{record.price} €</td>
                    <td style={{ ...tdStyle, width: '7%' }}>
                      <input
                        type="number"
                        value={record.deductibility || 100}
                        onChange={(e) => handleEditRecord(index, 'deductibility', e.target.value)}
                        style={{ ...inputStyle, width: '50px', textAlign: 'right', fontSize: '0.75rem' }}
                        placeholder="100"
                      />
                    </td>
                    <td style={{ ...tdStyle, width: '10%', fontSize: '0.75rem' }}>{record.start_date}</td>
                    <td style={{ ...tdStyle, width: '19%', fontSize: '0.75rem' }}>
                      {record._duplicate ? (
                        <span style={duplicateBadgeStyle}>
                          {record._duplicateInFile
                            ? 'Duplicita v súbore'
                            : `Už importované${record._existing?.imported_at ? ` ${formatDate(record._existing.imported_at)}` : ''}`}
                          <span style={matchedByStyle}>
                            {record._matchedBy === 'ntry_ref' ? ' (podľa NtryRef)' : ' (podľa odtlačku)'}
                          </span>
                        </span>
                      ) : (
                        <span style={newBadgeStyle}>Nový</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, width: '10%' }}>
                      <button
                        style={deleteButtonStyle}
                        onClick={() => handleRemoveRecord(index)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c0392b')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e74c3c')}
                      >
                        Vymazať
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && <p style={emptyStateStyle}>Žiadne výdavky nenájdené.</p>
        )}
        <div style={buttonContainerStyle}>
          <button
            onClick={handleImportClick}
            style={importButtonStyle}
            disabled={loading || checkingDuplicates || selectedCount === 0}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ecc71')}
          >
            {selectedCount > 0 ? `Importovať (${selectedCount})` : 'Importovať'}
          </button>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c0392b')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e63946')}
          >
            Zatvoriť
          </button>
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalContentStyle = {
  backgroundColor: '#ffffff',
  padding: '2rem',
  borderRadius: '16px',
  maxWidth: '1400px',
  width: '100%',
  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  maxHeight: '98vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontFamily: "'Arial', sans-serif",
};

const headerStyle = {
  marginBottom: '1rem',
  textAlign: 'center',
  fontSize: '1.3rem',
  fontWeight: '600',
  color: '#333',
};

const summaryStyle = {
  display: 'flex',
  gap: '1.5rem',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '0.8rem',
  fontSize: '0.9rem',
  color: '#444',
};

const duplicateBadgeStyle = {
  display: 'inline-block',
  color: '#c0392b',
  fontWeight: 600,
};

const matchedByStyle = {
  display: 'block',
  color: '#8e6b6b',
  fontWeight: 400,
  fontSize: '0.7rem',
};

const newBadgeStyle = {
  color: '#27ae60',
  fontWeight: 600,
};

const cacheLabelStyle = {
  color: '#e63946',
  fontSize: '0.85rem',
  fontStyle: 'italic',
  marginLeft: '0.3rem',
};

const fileInputStyle = {
  display: 'block',
  margin: '0 auto 0.5rem',
  padding: '0.4rem',
  fontSize: '0.9rem',
  borderRadius: '6px',
  border: '1px solid #ddd',
  cursor: 'pointer',
};

const sortButtonStyle = {
  padding: '0.5rem 1.2rem',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  transition: 'background-color 0.3s',
  marginLeft: '0.5rem',
};

const loadingStyle = {
  textAlign: 'center',
  padding: '1rem',
  fontSize: '1rem',
  color: '#666',
  fontStyle: 'italic',
};

const tableContainerStyle = {
  maxHeight: '80vh',
  overflowY: 'auto',
  width: '100%',
  marginBottom: '1.2rem',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 0.5rem',
  fontSize: '0.85rem',
  color: '#444',
};

const theadStyle = {
  backgroundColor: '#f8f9fa',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const thStyle = {
  padding: '0.6rem',
  borderBottom: '2px solid #e0e0e0',
  fontWeight: '600',
  color: '#222',
  textTransform: 'uppercase',
  fontSize: '0.8rem',
  textAlign: 'left',
};

const tbodyStyle = {
  backgroundColor: '#fff',
};

const trStyle = {
  transition: 'background-color 0.2s',
  backgroundColor: '#fafafa',
};

const tdStyle = {
  padding: '0.6rem',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '0.85rem',
};

const inputStyle = {
  width: '100%',
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '0.3rem',
  fontSize: '0.85rem',
  backgroundColor: '#f9f9f9',
  transition: 'border-color 0.3s',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '1.5rem',
  fontSize: '1rem',
  color: '#888',
};

const buttonContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
};

const importButtonStyle = {
  padding: '0.5rem 1.2rem',
  backgroundColor: '#2ecc71',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  transition: 'background-color 0.3s',
};

const closeButtonStyle = {
  padding: '0.5rem 1.2rem',
  backgroundColor: '#e63946',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  transition: 'background-color 0.3s',
};

const deleteButtonStyle = {
  padding: '0.3rem 0.6rem',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  transition: 'background-color 0.3s',
};

export default ImportExpenseRecordsModal;