// src/components/InvoiceTableExtended.js

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MarkAsPaidModal from '../modals/MarkAsPaidModal';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import InvoiceExtendedPdf from './InvoiceExtendedPdf';
import QRCode from 'qrcode';
import { encode, PaymentOptions, CurrencyCode } from 'bysquare'; // Import BySquare library
import { getResidentialCompanies } from '../services/companyService';

const InvoiceTableExtended = ({
  invoices,
  onEdit,
  onMarkAsSent,
  onMarkAsPaid,
  onDelete,
  selectedInvoiceIds,
  onSelectInvoice,
  onSelectAllInvoices,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [showActions, setShowActions] = useState(null);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceWithQR, setInvoiceWithQR] = useState(null);
  const allSelected = invoices.length > 0 && invoices.every(invoice => selectedInvoiceIds.includes(invoice.id));
  const [residentialCompaniesMap, setResidentialCompaniesMap] = useState({}); // Map of residential companies by ID
  const actionsRef = useRef(null);

  useEffect(() => {
    const fetchResidentialCompanies = async () => {
      try {
        const companies = await getResidentialCompanies();
        // Create a map of id -> company_name for quick lookup
        const companiesMap = companies.reduce((acc, company) => {
          acc[company.id] = company.company_name;
          return acc;
        }, {});
        setResidentialCompaniesMap(companiesMap);
      } catch (error) {
        console.error('Chyba pri načítaní bytových podnikov:', error);
      }
    };

    fetchResidentialCompanies();
  }, []); // Only fetch once when component mounts

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(null);
      }
    };

    if (showActions !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  // Formatting date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Sorting invoices function
  const sortedInvoices = React.useMemo(() => {
    let sortableInvoices = [...invoices];
    if (sortConfig.key !== '') {
      sortableInvoices.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // If sorting by date
        if (sortConfig.key === 'issue_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        // If sorting by total price
        if (sortConfig.key === 'total_price') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableInvoices;
  }, [invoices, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleActions = (invoiceId) => {
    setShowActions((prev) => (prev === invoiceId ? null : invoiceId));
  };

  // Funkcia na konverziu formátu čísla faktúry pre variabilný symbol
  // Konvertuje "00185/2025" na "202500185" (rok + číslo s leading zeros)
  const formatInvoiceNumberForVariableSymbol = (invoiceNumber) => {
    if (!invoiceNumber) return '';
    
    // Odstránime medzery
    const cleanNumber = invoiceNumber.replace(/\s+/g, '');
    
    // Skontrolujeme, či je v starom formáte "číslo/rok"
    const match = cleanNumber.match(/^(\d+)\/(\d{4})$/);
    if (match) {
      const numberPart = match[1]; // napr. "00185"
      const yearPart = match[2]; // napr. "2025"
      // Zachováme leading zeros v čísle a spojíme rok + číslo
      return yearPart + numberPart; // "2025" + "00185" = "202500185"
    }
    
    // Ak nie je v starom formáte, vrátime pôvodné číslo
    return cleanNumber;
  };

  const handlePdfView = async (invoice) => {
    setSelectedInvoice(invoice);
    
    // Generujeme QR kód pre faktúru pomocou Pay by Square
    let qrCode = null;
    if (invoice.company_iban) {
      try {
        const cleanIban = invoice.company_iban.replace(/\s+/g, '');
        const services = invoice.services || [];
        const totalPrice = services.reduce((acc, service) => {
          const price = parseFloat(service.price) || 0;
          const quantity = parseInt(service.quantity, 10) || 0;
          return acc + (price * quantity);
        }, 0);
        const amount = parseFloat(totalPrice.toFixed(2));
        const variableSymbol = formatInvoiceNumberForVariableSymbol(invoice.invoice_number);
        const recipientName = (invoice.company_name || '').substring(0, 70); // Názov príjemcu = company_name
        const message = (invoice.invoice_name || '').substring(0, 140); // Informácia pre príjemcu = invoice_name
        
        // Pay by Square formát - slovenský štandard
        const qrString = encode({
          payments: [
            {
              type: PaymentOptions.PaymentOrder,
              amount: amount,
              variableSymbol: variableSymbol || undefined,
              currencyCode: CurrencyCode.EUR,
              bankAccounts: [
                { iban: cleanIban }
              ],
              paymentNote: message || undefined, // Informácia pre príjemcu = invoice_name (max 140 znakov)
              beneficiary: recipientName ? {
                name: recipientName // Názov príjemcu = company_name (max 70 znakov)
              } : undefined,
            },
          ],
        });
        
        qrCode = await QRCode.toDataURL(qrString, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          width: 200
        });
      } catch (qrError) {
        console.error('Error generating Pay by Square QR code:', qrError);
      }
    }
    
    setInvoiceWithQR({ ...invoice, qrCode });
    setShowPdfModal(true);
  };

  return (
    <>
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
          <th className="w-12 px-1 py-1 border-b-2 border-gray-200 bg-gray-100">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAllInvoices(e.target.checked)}
            />
          </th>
            <th
              className="border px-1.5 py-1 text-xs text-left cursor-pointer bg-gray-100 w-24"
              onClick={() => requestSort('invoice_number')}
            >
              Číslo faktúry
            </th>
            <th
              className="border px-1.5 py-1 text-xs text-left cursor-pointer bg-gray-100 w-28"
              onClick={() => requestSort('issue_date')}
            >
              Dátum vystavenia
            </th>
            <th
              className="border px-1.5 py-1 text-xs text-left cursor-pointer bg-gray-100"
              onClick={() => requestSort('company_name')}
            >
              Spoločnosť
            </th>
            <th
              className="border px-1.5 py-1 text-xs text-left cursor-pointer bg-gray-100"
              onClick={() => requestSort('invoice_name')}
            >
              Názov faktúry
            </th>
            <th
              className="border px-1.5 py-1 text-xs text-left cursor-pointer bg-gray-100"
              onClick={() => requestSort('residential_company_name')}
            >
              Bytový podnik
            </th>
            <th
              className="border px-1.5 py-1 text-xs text-left cursor-pointer bg-gray-100 w-24"
              onClick={() => requestSort('total_price')}
            >
              Celková cena
            </th>
            <th
              className="border px-1.5 py-1 text-xs text-left cursor-pointer bg-gray-100 w-28"
              onClick={() => requestSort('status')}
            >
              Status
            </th>
            <th className="border px-1.5 py-1 text-xs text-left bg-gray-100 w-20">Akcie</th>
          </tr>
        </thead>
        <tbody>
          {sortedInvoices.map((invoice) => (
            <tr key={invoice.id} className="border-b hover:bg-gray-100">
               <td className="w-12 px-1 py-1 border-b border-gray-200 bg-white text-sm">
                <input
                  type="checkbox"
                  checked={selectedInvoiceIds.includes(invoice.id)}
                  onChange={(e) => onSelectInvoice(invoice.id, e.target.checked)}
                />
              </td>
              <td className="w-24 px-1.5 py-1 text-sm">{invoice.invoice_number}</td>
              <td className="w-28 px-1.5 py-1 text-sm">{formatDate(invoice.issue_date)}</td>
              <td className="px-1.5 py-1 text-sm">{invoice.company_name}</td>
              <td className="px-1.5 py-1 text-sm" title={invoice.invoice_name || 'N/A'}>
                {invoice.invoice_name || 'N/A'}
              </td>
              <td className="px-1.5 py-1 text-sm" title={invoice.residential_company_name || residentialCompaniesMap[invoice.id_residential_company] || 'N/A'}>
                <span className="truncate block max-w-[250px]" title={invoice.residential_company_name || residentialCompaniesMap[invoice.id_residential_company] || 'N/A'}>
                  {invoice.residential_company_name || residentialCompaniesMap[invoice.id_residential_company] || 'N/A'}
                </span>
              </td>
              <td className="px-1.5 py-1 text-sm">
                {invoice.total_price !== undefined
                  ? invoice.total_price.toFixed(2)
                  : 'N/A'}{' '}
                €
              </td>
              <td className="px-1.5 py-1 text-sm">
                {invoice.status === 'paid' && (
                  <span className="text-green-600 font-semibold">Zaplatená</span>
                )}
                {invoice.status === 'created' && (
                  <span className="text-blue-600 font-semibold">Vytvorená</span>
                )}
                {invoice.status === 'expired' && (
                  <span className="text-red-600 font-semibold">Po splatnosti</span>
                )}
                {invoice.status === 'sent' && (
                  <span className="text-orange-600 font-semibold">Odoslaná</span>
                )}
              </td>
              <td className="px-1.5 py-1">
                <div className="relative" ref={showActions === invoice.id ? actionsRef : null}>
                  <button
                    onClick={() => toggleActions(invoice.id)}
                    className="bg-gray-300 text-black py-1 px-4 rounded-md hover:bg-gray-400"
                  >
                    Akcie
                  </button>
                  {showActions === invoice.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 transition-all duration-300 ease-in-out transform origin-top-right z-50">
                      <button
                        className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => {
                          onEdit(invoice.id);
                          setShowActions(null);
                        }}
                      >
                        Upraviť
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => {
                          handlePdfView(invoice);
                          setShowActions(null);
                        }}
                      >
                        Náhľad PDF
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                        onClick={() => {
                          onMarkAsSent(invoice.id);
                          setShowActions(null);
                        }}
                      >
                        Označiť ako odoslaná
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-green-600 hover:bg-green-100 transition-colors duration-200"
                        onClick={() => {
                          setSelectedInvoiceId(invoice.id);
                          setShowMarkAsPaidModal(true);
                          setShowActions(null);
                        }}
                      >
                        Označiť ako zaplatená
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 transition-colors duration-200"
                        onClick={() => {
                          onDelete(invoice.id);
                          setShowActions(null);
                        }}
                      >
                        Vymazať
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MarkAsPaidModal */}
      {showMarkAsPaidModal && (
        <MarkAsPaidModal
          closeModal={() => {
            setShowMarkAsPaidModal(false);
            setSelectedInvoiceId(null);
          }}
          onSubmit={(paymentDate) => {
            onMarkAsPaid(selectedInvoiceId, paymentDate);
            setShowMarkAsPaidModal(false);
            setSelectedInvoiceId(null);
          }}
        />
      )}

      {/* PDF Modal */}
      {showPdfModal && selectedInvoice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-600">Faktúra v PDF</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 transition duration-300"
                  onClick={async () => {
                    try {
                      // Generujeme QR kód pre faktúru pomocou Pay by Square
                      let qrCode = null;
                      if (selectedInvoice.company_iban) {
                        try {
                          const cleanIban = selectedInvoice.company_iban.replace(/\s+/g, '');
                          const services = selectedInvoice.services || [];
                          const totalPrice = services.reduce((acc, service) => {
                            const price = parseFloat(service.price) || 0;
                            const quantity = parseInt(service.quantity, 10) || 0;
                            return acc + (price * quantity);
                          }, 0);
                          const amount = parseFloat(totalPrice.toFixed(2));
                          const variableSymbol = formatInvoiceNumberForVariableSymbol(selectedInvoice.invoice_number);
                          const recipientName = (selectedInvoice.company_name || '').substring(0, 70); // Názov príjemcu = company_name
                          const message = (selectedInvoice.invoice_name || '').substring(0, 140); // Informácia pre príjemcu = invoice_name
                          
                          // Pay by Square formát - slovenský štandard
                          const qrString = encode({
                            payments: [
                              {
                                type: PaymentOptions.PaymentOrder,
                                amount: amount,
                                variableSymbol: variableSymbol || undefined,
                                currencyCode: CurrencyCode.EUR,
                                bankAccounts: [
                                  { iban: cleanIban }
                                ],
                                paymentNote: message || undefined, // Informácia pre príjemcu = invoice_name (max 140 znakov)
                                beneficiary: recipientName ? {
                                  name: recipientName // Názov príjemcu = company_name (max 70 znakov)
                                } : undefined,
                              },
                            ],
                          });
                          
                          qrCode = await QRCode.toDataURL(qrString, {
                            errorCorrectionLevel: 'H',
                            type: 'image/png',
                            quality: 0.92,
                            margin: 1,
                            width: 200
                          });
                        } catch (qrError) {
                          console.error('Error generating Pay by Square QR code:', qrError);
                        }
                      }
                      
                      const invoiceWithQR = { ...selectedInvoice, qrCode };
                      const blob = await pdf(<InvoiceExtendedPdf invoice={invoiceWithQR} />).toBlob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      
                      // Vytvoriť názov súboru podľa firmy, mesiac a rok
                      const companyName = selectedInvoice.company_name || 'Faktura';
                      const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
                      
                      let month = '';
                      let year = '';
                      if (selectedInvoice.billing_month) {
                        const billingMonth = parseInt(selectedInvoice.billing_month);
                        if (!isNaN(billingMonth) && billingMonth >= 1 && billingMonth <= 12) {
                          month = billingMonth.toString();
                        }
                      }
                      if (selectedInvoice.issue_date) {
                        const date = new Date(selectedInvoice.issue_date);
                        if (!month) {
                          month = (date.getMonth() + 1).toString();
                        }
                        year = date.getFullYear().toString();
                      }
                      
                      const fileName = month && year 
                        ? `${sanitizedCompanyName}_${month}_${year}.pdf`
                        : `${sanitizedCompanyName}.pdf`;
                      
                      link.setAttribute('download', fileName);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Error downloading PDF:', error);
                    }
                  }}
                >
                  Stiahnuť PDF
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-black py-1 px-3 rounded-md hover:bg-gray-400 transition duration-300"
                  onClick={() => setShowPdfModal(false)}
                >
                  Zavrieť
                </button>
              </div>
            </div>
            <PDFViewer style={{ width: '100%', height: '80vh' }}>
              <InvoiceExtendedPdf invoice={invoiceWithQR || selectedInvoice} />
            </PDFViewer>
          </div>
        </div>
      )}
    </>
  );
};

InvoiceTableExtended.propTypes = {
  invoices: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onMarkAsSent: PropTypes.func.isRequired,
  onMarkAsPaid: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  selectedInvoiceIds: PropTypes.array.isRequired,
  onSelectInvoice: PropTypes.func.isRequired,
  onSelectAllInvoices: PropTypes.func.isRequired,
};

export default InvoiceTableExtended;
