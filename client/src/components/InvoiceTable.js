import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EditMonthlyInvoice from '../modals/EditMonthlyInvoice';
import ViewMonthlyInvoice from '../modals/ViewMonthlyInvoice';
import InvoicePdf from './InvoicePDF';
import { PDFViewer } from '@react-pdf/renderer';
import { updateMonthlyInvoice } from '../services/monthlyInvoiceService';
import { getResidentialCompanies } from '../services/companyService';

const InvoiceTable = ({ invoices, onDelete, fetchInvoices }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showActions, setShowActions] = useState(null);
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

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handlePdfView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPdfModal(true);
  };

  const toggleActions = (invoiceId) => {
    setShowActions((prev) => (prev === invoiceId ? null : invoiceId));
  };

  const handleUpdateInvoice = async ({ invoiceData, servicesData }) => {
    try {
      await updateMonthlyInvoice(selectedInvoice.id, { invoiceData, servicesData });
      setShowEditModal(false);
      fetchInvoices();
      toast.success('Faktúra úspešne aktualizovaná');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Chyba pri aktualizácii faktúry');
    }
  };

  return (
    <div className="mt-4">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Názov faktúry</th>
            <th className="border p-2 text-left">Spoločnosť</th>
            <th className="border p-2 text-left">Bytový podnik</th>
            <th className="border p-2 text-right">Celková cena</th>
            <th className="border p-2 text-left">Akcie</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border">
              <td className="p-2 text-green-700 font-bold">{invoice.invoice_name}</td>
              <td className="p-2">{invoice.company_name || 'N/A'}</td>
              <td className="p-2">
                {residentialCompaniesMap[invoice.id_residential_company] || 'N/A'}
              </td>
              <td className="p-2 text-right font-semibold">
                {invoice.total_price ? `${invoice.total_price.toFixed(2)} €` : '0.00 €'}
              </td>
              <td className="p-2">
                <div className="relative" ref={showActions === invoice.id ? actionsRef : null}>
                  <button
                    className="bg-gray-300 text-black py-1 px-4 rounded-md hover:bg-gray-400"
                    onClick={() => toggleActions(invoice.id)}
                  >
                    Akcie
                  </button>
                  {showActions === invoice.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-2 transition-all duration-300 ease-in-out transform origin-top-right z-50">
                      <button
                        className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => {
                          handleView(invoice);
                          setShowActions(null);
                        }}
                      >
                        Zobraziť
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => {
                          handleEdit(invoice);
                          setShowActions(null);
                        }}
                      >
                        Upraviť
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                        onClick={() => {
                          handlePdfView(invoice);
                          setShowActions(null);
                        }}
                      >
                        PDF
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

      {/* EditMonthlyInvoice Modal */}
      {showEditModal && selectedInvoice && (
        <EditMonthlyInvoice
          closeModal={() => setShowEditModal(false)}
          onSubmit={handleUpdateInvoice}
          invoice={selectedInvoice}
        />
      )}

      {/* ViewMonthlyInvoice Modal */}
      {showViewModal && selectedInvoice && (
        <ViewMonthlyInvoice
          closeModal={() => setShowViewModal(false)}
          invoice={selectedInvoice}
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
              <InvoicePdf invoice={selectedInvoice} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
};

InvoiceTable.propTypes = {
  invoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      invoice_name: PropTypes.string,
      company_name: PropTypes.string,
      services_planned: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          quantity: PropTypes.number,
          price: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
  fetchInvoices: PropTypes.func.isRequired,
};

export default InvoiceTable;
