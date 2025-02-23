import React, { useState, useEffect } from 'react';
import { importExpenses } from '../services/expansesService';

const ImportExpenseRecordsModal = ({ onClose, onSubmit, companies }) => {
  const [loading, setLoading] = useState(false);
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Načítanie z cache pri otvorení modálu
  useEffect(() => {
    const cached = localStorage.getItem('importedExpenseRecords');
    if (cached && cached !== 'undefined') {
      try {
        setExpenseRecords(JSON.parse(cached));
        setLoadedFromCache(true);
      } catch (error) {
        console.error('Chyba pri parsovaní cache:', error);
        setExpenseRecords([]);
      }
    }
  }, []);

  const parseExpenseRecord = (ntry, ns, companies) => {
    const cdtDbtInd = ntry.getElementsByTagNameNS(ns, 'CdtDbtInd')[0]?.textContent;
    if (cdtDbtInd !== 'DBIT') return null;

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
      console.log(formattedXmlIban + " z companies "+ company.company_iban);
      
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
      start_date: paymentDate
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
    reader.onload = (e) => {
      const xmlText = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const ns = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02';
      const parsedRecords = Array.from(xmlDoc.getElementsByTagNameNS(ns, 'Ntry'))
        .map(ntry => parseExpenseRecord(ntry, ns, companies))
        .filter(Boolean);
      localStorage.setItem('importedExpenseRecords', JSON.stringify(parsedRecords));
      setExpenseRecords(parsedRecords);
      setLoadedFromCache(false);
      setLoading(false);
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

  const handleImportClick = async () => {
    if (expenseRecords.length === 0) return;
    setLoading(true);
    try {
      console.log(expenseRecords);
      const response = await importExpenses(expenseRecords);
      if (onSubmit) {
        onSubmit(response.expenses || []);
      }
      localStorage.removeItem('importedExpenseRecords');
    } catch (error) {
      console.error('Chyba pri importe výdavkov:', error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

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
        {loading ? (
          <div style={loadingStyle}>Načítavam...</div>
        ) : expenseRecords.length > 0 ? (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead style={theadStyle}>
                <tr>
                  <th style={{ ...thStyle, width: '20%' }}>Názov</th>
                  <th style={{ ...thStyle, width: '30%' }}>Popis</th>
                  <th style={{ ...thStyle, width: '15%' }}>Suma (€)</th>
                  <th style={{ ...thStyle, width: '8%' }}>Odpočítateľnosť</th>
                  <th style={{ ...thStyle, width: '12%' }}>Dátum začiatku</th>
                  <th style={{ ...thStyle, width: '10%' }}>Akcia</th>
                </tr>
              </thead>
              <tbody style={tbodyStyle}>
                {expenseRecords.map((record, index) => (
                  <tr
                    key={index}
                    style={trStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f1f1')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                  >
                    <td style={{ ...tdStyle, width: '20%' }}>
                      <input
                        type="text"
                        value={record.name || ''}
                        onChange={(e) => handleEditRecord(index, 'name', e.target.value)}
                        style={inputStyle}
                        placeholder="Zadaj názov"
                      />
                    </td>
                    <td style={{ ...tdStyle, width: '30%' }}>
                      <input
                        type="text"
                        value={record.description || ''}
                        onChange={(e) => handleEditRecord(index, 'description', e.target.value)}
                        style={inputStyle}
                        placeholder="Zadaj popis"
                      />
                    </td>
                    <td style={{ ...tdStyle, width: '15%' }}>{record.price} €</td>
                    <td style={{ ...tdStyle, width: '8%' }}>
                      <input
                        type="number"
                        value={record.deductibility || 100}
                        onChange={(e) => handleEditRecord(index, 'deductibility', e.target.value)}
                        style={{ ...inputStyle, width: '50px', textAlign: 'right', fontSize: '0.75rem' }}
                        placeholder="100"
                      />
                    </td>
                    <td style={{ ...tdStyle, width: '12%', fontSize: '0.75rem' }}>{record.start_date}</td>
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ecc71')}
          >
            Importovať
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