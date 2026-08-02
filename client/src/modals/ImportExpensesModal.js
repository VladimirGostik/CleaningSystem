// src/modals/ImportExpensesModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { sendTransactionsToBackend, InvoicesMarkAsPaid, checkTransactionDuplicates } from '../services/invoices';
import { toast } from 'react-toastify';

// Pomocné polia, ktoré si držíme len v UI - do backendu ich neposielame
const stripUiFields = (tx) => {
  const { _duplicate, _duplicateInFile, _matchedBy, _existing, _import, ...rest } = tx;
  return rest;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('sk-SK');
};

const ImportExpensesModal = ({ closeModal, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [wrongPrice, setWrongPrice] = useState([]);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Overí na backende, ktoré transakcie sme už raz spracovali.
  // Duplicity sa štandardne na spracovanie neoznačia.
  const runDuplicateCheck = useCallback(async (txs) => {
    if (!txs || txs.length === 0) return txs || [];
    setCheckingDuplicates(true);
    try {
      const data = await checkTransactionDuplicates(txs.map(stripUiFields));
      const results = data?.results || [];
      if (!data) {
        // Kontrola nedostupná - necháme všetko označené, backend duplicity aj tak zachytí
        return txs.map(tx => ({ ...tx, _import: tx._import !== false }));
      }
      return txs.map((tx, index) => {
        const result = results[index] || {};
        return {
          ...tx,
          _duplicate: Boolean(result.duplicate),
          _duplicateInFile: Boolean(result.duplicateInFile),
          _matchedBy: result.matchedBy || null,
          _existing: result.existing || null,
          _import: !result.duplicate,
        };
      });
    } finally {
      setCheckingDuplicates(false);
    }
  }, []);

  // Načítanie dát z cache pri otvorení modalu
  useEffect(() => {
    const cached = localStorage.getItem('importedTransactions');
    const cachedWrong = localStorage.getItem('wrongPriceTransactions');
    if (cached && cached !== 'undefined') {
      try {
        const parsed = JSON.parse(cached);
        setTransactions(parsed);
        setLoadedFromCache(true);
        // Aj pri načítaní z cache overíme duplicity - medzitým sa mohlo importovať
        runDuplicateCheck(parsed).then(setTransactions);
      } catch (err) {
        console.error('Chyba pri parsovaní cache (importedTransactions):', err);
        setTransactions([]);
      }
    }
    if (cachedWrong && cachedWrong !== 'undefined') {
      try {
        setWrongPrice(JSON.parse(cachedWrong));
      } catch (err) {
        console.error('Chyba pri parsovaní cache (wrongPriceTransactions):', err);
        setWrongPrice([]);
      }
    }
  }, [runDuplicateCheck]);

  const parseTransaction = (ntry, ns) => {
    const cdtDbtInd = ntry.getElementsByTagNameNS(ns, 'CdtDbtInd')[0]?.textContent;
    if (cdtDbtInd !== 'CRDT') return null;
    const ntryRef = ntry.getElementsByTagNameNS(ns, 'NtryRef')[0]?.textContent?.trim() || null;
    const amount = ntry.getElementsByTagNameNS(ns, 'Amt')[0]?.textContent;
    const paymentDate = ntry.getElementsByTagNameNS(ns, 'BookgDt')[0]
      ?.getElementsByTagNameNS(ns, 'Dt')[0]?.textContent;
    const txDtls = ntry.getElementsByTagNameNS(ns, 'TxDtls')[0];
    let vs = null, senderName = null, description = null, debtorAcct = null, creditorAcct = null;
    if (txDtls) {
      const endToEndId = txDtls.getElementsByTagNameNS(ns, 'EndToEndId')[0]?.textContent;
      if (endToEndId) {
        const match = endToEndId.match(/\/VS(\d+)/);
        if (match) {
          const rawVS = match[1];
          // Nový formát: YYYYNNNN alebo YYYYNNNNN (rok + číslo), napr. 20250185 alebo 202500185
          const isNewFormat = /^\d{8,9}$/.test(rawVS) && /^20[2-3]\d/.test(rawVS);
          if (isNewFormat) {
            vs = rawVS;
          } else {
            // Starý formát: číslo + rok (posledné 4 = rok), napr. 001852025 -> 00185/2025
            const yearPart = rawVS.slice(-4);
            const numberPart = rawVS.slice(0, -4) || '0';
            const paddedNumber = numberPart.padStart(5, '0');
            vs = `${paddedNumber}/${yearPart}`;
          }
        } else {
          vs = endToEndId;
        }
      }
      const dbtr = txDtls.getElementsByTagNameNS(ns, 'Dbtr')[0];
      if (dbtr) {
        senderName = dbtr.getElementsByTagNameNS(ns, 'Nm')[0]?.textContent;
        description = dbtr.getElementsByTagNameNS(ns, 'StrtNm')[0]?.textContent;
      }
      debtorAcct = txDtls.getElementsByTagNameNS(ns, 'DbtrAcct')[0]
        ?.getElementsByTagNameNS(ns, 'Id')[0]
        ?.getElementsByTagNameNS(ns, 'IBAN')[0]?.textContent;
      creditorAcct = txDtls.getElementsByTagNameNS(ns, 'CdtrAcct')[0]
        ?.getElementsByTagNameNS(ns, 'Id')[0]
        ?.getElementsByTagNameNS(ns, 'IBAN')[0]?.textContent;
    }
    return { amount, debtorAcct, creditorAcct, vs, paymentDate, senderName, description, ntryRef };
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleLoadFromFile = () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const xmlText = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const ns = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02';
      const parsedTransactions = Array.from(xmlDoc.getElementsByTagNameNS(ns, 'Ntry'))
        .map((ntry) => parseTransaction(ntry, ns))
        .filter(Boolean);

      // Hneď po načítaní súboru zistíme, ktoré transakcie sme už spracovali
      const checked = await runDuplicateCheck(parsedTransactions);
      // Uloženie importovaných transakcií do cache
      localStorage.setItem('importedTransactions', JSON.stringify(checked));
      setTransactions(checked);
      setLoadedFromCache(false);
      setLoading(false);

      const duplicates = checked.filter(tx => tx._duplicate).length;
      if (duplicates > 0) {
        toast.info(`Načítaných ${checked.length} transakcií, z toho ${duplicates} už bolo spracovaných - tie sú odznačené.`);
      }
    };
    reader.onerror = (e) => {
      console.error('Chyba pri načítaní súboru:', e);
      setError('Nepodarilo sa načítať súbor.');
      setLoading(false);
    };
    reader.readAsText(selectedFile);
  };

  // Odstránenie nepriradenej transakcie
  const handleRemoveTransaction = (indexToRemove) => {
    if (window.confirm('Naozaj chcete vymazať túto transakciu?')) {
      const newTransactions = transactions.filter((_, index) => index !== indexToRemove);
      setTransactions(newTransactions);
      localStorage.setItem('importedTransactions', JSON.stringify(newTransactions));
    }
  };

  // Odstránenie transakcie s nesúladom ceny
  const handleRemoveWrongPrice = (indexToRemove) => {
    if (window.confirm('Naozaj chcete vymazať tento záznam?')) {
      const newRecords = wrongPrice.filter((_, index) => index !== indexToRemove);
      setWrongPrice(newRecords);
      localStorage.setItem('wrongPriceTransactions', JSON.stringify(newRecords));
    }
  };

  // Ignorovanie nesúladu ceny – zavolá endpoint na označenie faktúry ako zaplatené
  const handleIgnoreWrongPrice = async (indexToIgnore) => {
    const tx = wrongPrice[indexToIgnore];
    if (!tx || !tx.invoice_id || !tx.paymentDate) return;
    try {
      await InvoicesMarkAsPaid(tx.invoice_id, tx.paymentDate);
      const newRecords = wrongPrice.filter((_, i) => i !== indexToIgnore);
      setWrongPrice(newRecords);
      localStorage.setItem('wrongPriceTransactions', JSON.stringify(newRecords));
      toast.success(`Faktúra ${tx.vs} bola ignorovaná a nastavená ako zaplatená.`);
    } catch (error) {
      console.error('Chyba pri ignorovaní transakcie:', error);
      toast.error('Nepodarilo sa ignorovať transakciu.');
    }
  };

  // Prepnutie, či sa daná transakcia má spracovať (duplicitu vie používateľ potvrdiť ručne)
  const handleToggleImport = (indexToToggle) => {
    const updated = transactions.map((tx, index) =>
      index === indexToToggle ? { ...tx, _import: !tx._import } : tx
    );
    setTransactions(updated);
    localStorage.setItem('importedTransactions', JSON.stringify(updated));
  };

  const handleImportClick = async () => {
    const toImport = transactions.filter(tx => tx._import !== false);
    if (toImport.length === 0) {
      toast.warn('Nie je označená žiadna transakcia na spracovanie.');
      return;
    }
    setLoading(true);
    try {
      const payload = toImport.map(tx => ({
        ...stripUiFields(tx),
        // Označená duplicita = používateľ ju vedome potvrdil
        force: Boolean(tx._duplicate),
      }));
      const response = await sendTransactionsToBackend(payload);
      const unlinked = response?.unlinkedTransactions || [];
      const wrong = response?.wrongPriceTransactions || [];
      const skipped = response?.skippedDuplicates || [];
      const updatedCount = (response?.updatedInvoices || []).length;

      toast.success(
        skipped.length > 0
          ? `Spracovaných ${updatedCount} platieb, preskočených ${skipped.length} už spracovaných transakcií.`
          : `Spracovaných ${updatedCount} platieb.`
      );
      localStorage.setItem('importedTransactions', JSON.stringify(unlinked));
      localStorage.setItem('wrongPriceTransactions', JSON.stringify(wrong));
      setTransactions(unlinked);
      setWrongPrice(wrong);
      onImport({ unlinked, wrong });
    } catch (error) {
      console.error('Chyba pri importe transakcií:', error);
      setError('Chyba pri importe transakcií.');
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  const duplicateCount = transactions.filter(tx => tx._duplicate).length;
  const selectedCount = transactions.filter(tx => tx._import !== false).length;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        {/* Close button v pravom hornom rohu modalu */}
        <button style={closeIconStyle} onClick={closeModal}>×</button>
        <h3 style={headerStyle}>
          Importované transakcie
          {loadedFromCache && <span style={cacheLabelStyle}> (z cache: nepriradené transakcie!)</span>}
        </h3>
        <div style={fileInputContainerStyle}>
          <input type="file" accept=".xml" onChange={handleFileSelect} style={fileInputStyle} />
          <button
            onClick={handleLoadFromFile}
            style={sortButtonStyle}
            disabled={!selectedFile}
          >
            Vysortovať tranzakcie zo súboru
          </button>
        </div>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        {loading ? (
          <div style={loadingStyle}>Načítavam...</div>
        ) : (
          <>
            {transactions.length > 0 && (
              <div style={{ marginBottom: '1rem', width: '100%' }}>
                <h4 style={{ textAlign: 'center' }}>
                  Nepriradené transakcie ({transactions.length})
                  {checkingDuplicates && <span style={cacheLabelStyle}> kontrolujem duplicity…</span>}
                  {!checkingDuplicates && duplicateCount > 0 && (
                    <span style={cacheLabelStyle}> z toho {duplicateCount} už spracovaných</span>
                  )}
                </h4>
                <div style={tableContainerStyle}>
                  <table style={tableStyle}>
                    <thead style={theadStyle}>
                      <tr>
                        <th style={thStyle} title="Spracovať túto transakciu">Imp.</th>
                        <th style={thStyle}>Meno</th>
                        <th style={thStyle}>Popis</th>
                        <th style={thStyle}>Suma (€)</th>
                        <th style={thStyle}>VS</th>
                        <th style={thStyle}>Dátum</th>
                        <th style={thStyle}>Stav</th>
                        <th style={thStyle}>Akcia</th>
                      </tr>
                    </thead>
                    <tbody style={tbodyStyle}>
                      {transactions.map((tx, index) => (
                        <tr
                          key={index}
                          style={{
                            ...trStyle,
                            // Duplicity vizuálne odlíšime, nech ich používateľ hneď vidí
                            backgroundColor: tx._duplicate ? '#fdecea' : undefined,
                            opacity: tx._import === false ? 0.65 : 1,
                          }}
                        >
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={tx._import !== false}
                              onChange={() => handleToggleImport(index)}
                              title={tx._duplicate
                                ? 'Duplicita - zaškrtnutím ju spracuješ napriek tomu'
                                : 'Spracovať túto transakciu'}
                            />
                          </td>
                          <td style={tdStyle}>{tx.senderName || '-'}</td>
                          <td style={tdStyle}>{tx.description || '-'}</td>
                          <td style={tdStyle}>{tx.amount} €</td>
                          <td style={tdStyle}>{tx.vs || '-'}</td>
                          <td style={tdStyle}>{tx.paymentDate}</td>
                          <td style={{ ...tdStyle, fontSize: '0.8rem' }}>
                            {tx._duplicate ? (
                              <span style={duplicateBadgeStyle}>
                                {tx._duplicateInFile
                                  ? 'Duplicita v súbore'
                                  : `Už spracované${tx._existing?.imported_at ? ` ${formatDate(tx._existing.imported_at)}` : ''}`}
                                <span style={matchedByStyle}>
                                  {tx._matchedBy === 'ntry_ref' ? ' (podľa NtryRef)' : ' (podľa odtlačku)'}
                                </span>
                              </span>
                            ) : (
                              <span style={newBadgeStyle}>Nová</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <button
                              style={deleteButtonStyle}
                              onClick={() => handleRemoveTransaction(index)}
                            >
                              Vymazať
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {wrongPrice.length > 0 && (
              <div style={{ marginBottom: '1rem', width: '100%' }}>
                <h4 style={{ textAlign: 'center', color: '#e74c3c' }}>
                  Transakcie s nesúladom ceny ({wrongPrice.length})
                </h4>
                <div style={tableContainerStyle}>
                  <table style={tableStyle}>
                    <thead style={theadStyle}>
                      <tr>
                        <th style={thStyle}>Meno</th>
                        <th style={thStyle}>Popis</th>
                        <th style={thStyle}>Uhradená (€)</th>
                        <th style={thStyle}>Na fakture (€)</th>
                        <th style={thStyle}>VS</th>
                        <th style={thStyle}>Dátum</th>
                        <th style={thStyle}>Akcia</th>
                      </tr>
                    </thead>
                    <tbody style={tbodyStyle}>
                      {wrongPrice.map((tx, index) => (
                        <tr key={index} style={trStyle}>
                          <td style={tdStyle}>{tx.senderName || '-'}</td>
                          <td style={tdStyle}>{tx.description || '-'}</td>
                          <td style={tdStyle}>{tx.amount} €</td>
                          <td style={tdStyle}>{tx.computedSum} €</td>
                          <td style={tdStyle}>{tx.vs || '-'}</td>
                          <td style={tdStyle}>{tx.paymentDate}</td>
                          <td style={tdStyle}>
                            <button
                              style={deleteButtonStyle}
                              onClick={() => handleRemoveWrongPrice(index)}
                            >
                              Vymazať
                            </button>
                            <button
                              style={ignoreButtonStyle}
                              onClick={() => handleIgnoreWrongPrice(index)}
                            >
                              Ignorovať
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {transactions.length === 0 && wrongPrice.length === 0 && (
              <p style={emptyStateStyle}>Žiadne transakcie nenájdené.</p>
            )}
          </>
        )}
        <div style={buttonContainerStyle}>
          <button
            onClick={handleImportClick}
            style={importButtonStyle}
            disabled={loading || checkingDuplicates || selectedCount === 0}
          >
            {selectedCount > 0 ? `Importovať (${selectedCount})` : 'Importovať'}
          </button>
          <button onClick={closeModal} style={closeButtonStyle}>
            Zatvoriť
          </button>
        </div>
      </div>
    </div>
  );
};

// Štýly
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
  position: 'relative', // Umožní absolútne pozicovanie vnútorných prvkov (napr. close button)
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

const closeIconStyle = {
  position: 'absolute',
  top: '10px',
  right: '30px',
  background: 'transparent',
  border: 'none',
  fontSize: '2.5rem',
  cursor: 'pointer',
};

const headerStyle = {
  marginBottom: '1rem',
  textAlign: 'center',
  fontSize: '1.3rem',
  fontWeight: '600',
  color: '#333',
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

const fileInputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  padding: '1.5rem',
  fontSize: '1.1rem',
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
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
  color: '#444',
};

const theadStyle = {
  backgroundColor: '#f8f9fa',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const thStyle = {
  padding: '0.8rem',
  borderBottom: '1px solid #e0e0e0',
  fontWeight: '600',
  color: '#222',
  textTransform: 'uppercase',
  fontSize: '0.85rem',
};

const tbodyStyle = {
  backgroundColor: '#fff',
};

const trStyle = {
  transition: 'background-color 0.2s',
};

const tdStyle = {
  padding: '0.8rem',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '0.9rem',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '2rem',
  fontSize: '1.1rem',
  color: '#888',
};

const buttonContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1.5rem',
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
  padding: '0.4rem 0.8rem',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  transition: 'background-color 0.3s',
};

const ignoreButtonStyle = {
  padding: '0.4rem 0.8rem',
  backgroundColor: '#f1c40f',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  transition: 'background-color 0.3s',
  marginLeft: '0.5rem',
};

export default ImportExpensesModal;
