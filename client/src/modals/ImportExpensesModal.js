// src/modals/ImportExpensesModal.js
import React, { useState, useEffect } from 'react';
import { sendTransactionsToBackend, InvoicesMarkAsPaid } from '../services/invoices';
import { toast } from 'react-toastify';

const ImportExpensesModal = ({ closeModal, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [wrongPrice, setWrongPrice] = useState([]);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Načítanie dát z cache pri otvorení modalu
  useEffect(() => {
    const cached = localStorage.getItem('importedTransactions');
    const cachedWrong = localStorage.getItem('wrongPriceTransactions');
    if (cached && cached !== 'undefined') {
      try {
        setTransactions(JSON.parse(cached));
        setLoadedFromCache(true);
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
  }, []);

  const parseTransaction = (ntry, ns) => {
    const cdtDbtInd = ntry.getElementsByTagNameNS(ns, 'CdtDbtInd')[0]?.textContent;
    if (cdtDbtInd !== 'CRDT') return null;
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
          const yearPart = rawVS.slice(-4);
          const numberPart = rawVS.slice(0, -4) || '0';
          const paddedNumber = numberPart.padStart(5, '0');
          vs = `${paddedNumber}/${yearPart}`;
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
    return { amount, debtorAcct, creditorAcct, vs, paymentDate, senderName, description };
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
    reader.onload = (e) => {
      const xmlText = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const ns = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02';
      const parsedTransactions = Array.from(xmlDoc.getElementsByTagNameNS(ns, 'Ntry'))
        .map((ntry) => parseTransaction(ntry, ns))
        .filter(Boolean);
      // Uloženie importovaných transakcií do cache
      localStorage.setItem('importedTransactions', JSON.stringify(parsedTransactions));
      setTransactions(parsedTransactions);
      setLoadedFromCache(false);
      setLoading(false);
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

  const handleImportClick = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      const response = await sendTransactionsToBackend(transactions);
      const unlinked = response?.unlinkedTransactions || [];
      const wrong = response?.wrongPriceTransactions || [];
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
                </h4>
                <div style={tableContainerStyle}>
                  <table style={tableStyle}>
                    <thead style={theadStyle}>
                      <tr>
                        <th style={thStyle}>Meno</th>
                        <th style={thStyle}>Popis</th>
                        <th style={thStyle}>Suma (€)</th>
                        <th style={thStyle}>VS</th>
                        <th style={thStyle}>Dátum</th>
                        <th style={thStyle}>Akcia</th>
                      </tr>
                    </thead>
                    <tbody style={tbodyStyle}>
                      {transactions.map((tx, index) => (
                        <tr key={index} style={trStyle}>
                          <td style={tdStyle}>{tx.senderName || '-'}</td>
                          <td style={tdStyle}>{tx.description || '-'}</td>
                          <td style={tdStyle}>{tx.amount} €</td>
                          <td style={tdStyle}>{tx.vs || '-'}</td>
                          <td style={tdStyle}>{tx.paymentDate}</td>
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
          <button onClick={handleImportClick} style={importButtonStyle}>
            Importovať
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
