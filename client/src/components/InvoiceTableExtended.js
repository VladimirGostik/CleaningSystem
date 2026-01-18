// src/components/InvoiceTableExtended.js

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MarkAsPaidModal from '../modals/MarkAsPaidModal';
import { PDFViewer } from '@react-pdf/renderer';
import InvoiceExtendedPdf from './InvoiceExtendedPdf';
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

  const handlePdfView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPdfModal(true);
  };

  return (
    <>
      <table className="w-full border-collapse">
        <thead>
          <tr>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAllInvoices(e.target.checked)}
            />
          </th>
            <th
              className="border p-2 text-left cursor-pointer"
              onClick={() => requestSort('invoice_number')}
            >
              Číslo faktúry
            </th>
            <th
              className="border p-2 text-left cursor-pointer"
              onClick={() => requestSort('issue_date')}
            >
              Dátum vystavenia
            </th>
            <th
              className="border p-2 text-left cursor-pointer"
              onClick={() => requestSort('company_name')}
            >
              Spoločnosť
            </th>
            <th
              className="border p-2 text-left cursor-pointer"
              onClick={() => requestSort('residential_company_name')}
            >
              Bytový podnik
            </th>
            <th
              className="border p-2 text-left cursor-pointer"
              onClick={() => requestSort('total_price')}
            >
              Celková cena
            </th>
            <th
              className="border p-2 text-left cursor-pointer"
              onClick={() => requestSort('status')}
            >
              Status
            </th>
            <th className="border p-2 text-left">Akcie</th>
          </tr>
        </thead>
        <tbody>
          {sortedInvoices.map((invoice) => (
            <tr key={invoice.id} className="border-b hover:bg-gray-100">
               <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <input
                  type="checkbox"
                  checked={selectedInvoiceIds.includes(invoice.id)}
                  onChange={(e) => onSelectInvoice(invoice.id, e.target.checked)}
                />
              </td>
              <td className="p-2">{invoice.invoice_number}</td>
              <td className="p-2">{formatDate(invoice.issue_date)}</td>
              <td className="p-2">{invoice.company_name}</td>
              <td className="p-2">{residentialCompaniesMap[invoice.id_residential_company] || 'N/A'}</td>
              <td className="p-2">
                {invoice.total_price !== undefined
                  ? invoice.total_price.toFixed(2)
                  : 'N/A'}{' '}
                €
              </td>
              <td className="p-2">
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
              <td className="p-2">
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
                        PDF
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
              <button
                type="button"
                className="bg-gray-300 text-black py-1 px-3 rounded-md hover:bg-gray-400 transition duration-300"
                onClick={() => setShowPdfModal(false)}
              >
                Zavrieť
              </button>
            </div>
            <PDFViewer style={{ width: '100%', height: '80vh' }}>
              <InvoiceExtendedPdf invoice={selectedInvoice} />
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
