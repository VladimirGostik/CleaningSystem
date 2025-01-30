// src/pages/Invoices.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../layouts/AdminLayout';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InvoiceTableExtended from '../components/InvoiceTableExtended';
import AddInvoiceModal from '../modals/AddInvoiceModal'; // Import the modal component
import EditInvoiceModal from '../modals/EditInvoiceModal';
import AddMonthlyInvoicesModal from '../modals/AddMonthlyInvoicesModal';
import InvoiceFilter from '../components/InvoiceFilter'; // Import the filter component
import MarkAsPaidModal from '../modals/MarkAsPaidModal'; // Import the MarkAsPaidModal
import BulkInvoiceDocument from '../components/BulkInvoiceDocument'; // Importujte BulkInvoiceDocument
import { pdf } from '@react-pdf/renderer'; // Importujte funkciu pdf
import { getInvoices, addInvoice, generateMonthlyInvoices, updateInvoice, InvoicesMarkAsSent, InvoicesMarkAsPaid, deleteInvoice, InvoicesBulkMarkAsSent, InvoicesBulkMarkAsPaid, InvoicesBulkDelete} from '../services/invoices';


const Invoices = () => {
  const [allInvoices, setAllInvoices] = useState([]); // All fetched invoices
  const [filteredInvoices, setFilteredInvoices] = useState([]); // Invoices after filtering
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false); // Add Invoice Modal
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false); // Edit Invoice Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); // Selected Invoice ID for editing
  const [showAddMonthlyInvoicesModal, setShowAddMonthlyInvoicesModal] = useState(false); // Add Monthly Invoices Modal
  const [showBulkMarkAsPaidModal, setShowBulkMarkAsPaidModal] = useState(false); // State to control bulk MarkAsPaidModal
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Bulk Actions State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]); // IDs of selected invoices
  const [showBulkActions, setShowBulkActions] = useState(false); // Toggle visibility of bulk actions

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 10; // Môžete upraviť podľa potreby

  // Fetch invoices from the backend API
  const fetchInvoices = useCallback(async () => {
    try {
      const response = await getInvoices();
      const invoicesData = response;

      // Handle cases where services might be undefined
      const invoicesWithTotal = invoicesData.map((invoice) => {
        const totalPrice = (invoice.services || []).reduce((acc, service) => {
          const price = parseFloat(service.price) || 0;
          const quantity = parseInt(service.quantity, 10) || 0;
          return acc + price * quantity;
        }, 0);

        return {
          ...invoice,
          total_price: totalPrice,
        };
      });

      setAllInvoices(invoicesWithTotal);
      setFilteredInvoices(invoicesWithTotal); // Initially, no filters applied
      setSelectedInvoiceIds([]); // Reset selection
      setShowBulkActions(false); // Hide bulk actions
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Chyba pri načítaní faktúr');
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handlers for actions
  const handleEdit = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowEditInvoiceModal(true);
  };

  const handleMarkAsSent = async (invoiceId) => {
    try {
      await InvoicesMarkAsSent(invoiceId);
      fetchInvoices();
      toast.success('Faktúra označená ako odoslaná');
    } catch (error) {
      console.error('Error marking invoice as sent:', error);
      toast.error('Chyba pri označovaní faktúry ako odoslanej');
    }
  };

  const handleMarkAsPaid = async (invoiceId, paymentDate) => {
    try {
      await InvoicesMarkAsPaid(invoiceId, paymentDate)
      fetchInvoices();
      toast.success('Faktúra označená ako zaplatená');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Chyba pri označovaní faktúry ako zaplatenej');
    }
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Ste si istý, že chcete vymazať túto faktúru?')) {
      try {
        await deleteInvoice(invoiceId);
        fetchInvoices();
        toast.success('Faktúra úspešne vymazaná');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Chyba pri vymazávaní faktúry');
      }
    }
  };

  const handleUpdateInvoice = async (invoiceId, data) => {
    try {
      // Send PUT request to update the invoice
      await updateInvoice(invoiceId, data);
      setShowEditInvoiceModal(false);
      setSelectedInvoiceId(null);
      fetchInvoices();
      toast.success('Faktúra úspešne upravená');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Chyba pri úprave faktúry');
    }
  };

  // Handler for adding a new invoice
  const handleAddInvoice = async ({ invoiceData, servicesData }) => {
    try {
      await addInvoice(invoiceData, servicesData);
      setShowAddInvoiceModal(false);
      fetchInvoices();
      toast.success('Faktúra úspešne pridaná');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handler for adding monthly invoices
  const handleAddMonthlyInvoices = async (data) => {
    try {
      await generateMonthlyInvoices(data);
      setShowAddMonthlyInvoicesModal(false);
      fetchInvoices();
      toast.success('Mesačné faktúry úspešne vytvorené');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handler for filter changes
  const handleFilterChange = useCallback((filters) => {
    const {
      invoice_number,
      company_ids,
      residential_company_ids,
      status,
      total_price_from,
      total_price_to,
      issue_date_from,
      issue_date_to,
    } = filters;

    const filtered = allInvoices.filter((invoice) => {
      // Filter by invoice number
      if (
        invoice_number &&
        !invoice.invoice_number.toLowerCase().includes(invoice_number.toLowerCase())
      ) {
        return false;
      }

      // Filter by company IDs
      if (
        company_ids.length > 0 &&
        (!invoice.id_company || !company_ids.includes(invoice.id_company))
      ) {
        return false;
      }

      // Filter by residential company IDs
      if (
        residential_company_ids.length > 0 &&
        (!invoice.id_residential_company || !residential_company_ids.includes(invoice.id_residential_company))
      ) {
        return false;
      }

      // Filter by status
      if (status && invoice.status !== status) {
        return false;
      }

      // Filter by total price range
      if (total_price_from) {
        if (invoice.total_price < parseFloat(total_price_from)) {
          return false;
        }
      }
      if (total_price_to) {
        if (invoice.total_price > parseFloat(total_price_to)) {
          return false;
        }
      }

      // Filter by issue date range
      const issueDate = new Date(invoice.issue_date);
      if (issue_date_from) {
        const fromDate = new Date(issue_date_from);
        if (issueDate < fromDate) {
          return false;
        }
      }
      if (issue_date_to) {
        const toDate = new Date(issue_date_to);
        if (issueDate > toDate) {
          return false;
        }
      }

      return true;
    });

    setFilteredInvoices(filtered);
    setSelectedInvoiceIds([]); // Reset selection after filter
    setShowBulkActions(false); // Hide bulk actions after filter
  }, [allInvoices]);

  // Handlers for Bulk Actions
  const handleSelectInvoice = (invoiceId, isSelected) => {
    if (isSelected) {
      setSelectedInvoiceIds(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds(prev => prev.filter(id => id !== invoiceId));
    }
  };


  const handleBulkMarkAsSent = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na označenie');
      return;
    }
  
    try {
      await InvoicesBulkMarkAsSent(selectedInvoiceIds);
      fetchInvoices();
      toast.success('Vybrané faktúry označené ako odoslané');
    } catch (error) {
      console.error('Error marking invoices as sent:', error);
      toast.error('Chyba pri označovaní faktúr ako odoslaných');
    }
  };

  const handleBulkMarkAsPaid = () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na označenie');
      return;
    }
  
    // Otvorenie modálu
    setShowBulkMarkAsPaidModal(true);
  };

  const handleBulkMarkAsPaidSubmit = async (paymentDate) => {
    try {
      await InvoicesBulkMarkAsPaid(selectedInvoiceIds, paymentDate);
      fetchInvoices();
      toast.success('Vybrané faktúry označené ako zaplatené');
      setShowBulkMarkAsPaidModal(false);
    } catch (error) {
      console.error('Error marking invoices as paid:', error);
      toast.error('Chyba pri označovaní faktúr ako zaplatených');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na vymazanie');
      return;
    }
  
    if (!window.confirm('Ste si istý, že chcete vymazať vybrané faktúry?')) {
      return;
    }
  
    try {
      await InvoicesBulkDelete(selectedInvoiceIds);
      fetchInvoices();
      toast.success('Vybrané faktúry úspešne vymazané');
    } catch (error) {
      console.error('Error deleting invoices:', error);
      toast.error('Chyba pri vymazávaní faktúr');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na stiahnutie');
      return;
    }
  
    try {
      setIsGeneratingPDF(true); // Začiatok načítavania
  
      // Získanie vybraných faktúr
      const selectedInvoices = allInvoices.filter(invoice => selectedInvoiceIds.includes(invoice.id));
  
      // Generovanie PDF dokumentu
      const blob = await pdf(<BulkInvoiceDocument invoices={selectedInvoices} />).toBlob();
  
      // Vytvorenie URL pre blob a stiahnutie PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk_invoices.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
  
      toast.success('Bulk PDF úspešne stiahnutý');
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      toast.error('Chyba pri generovaní PDF');
    } finally {
      setIsGeneratingPDF(false); // Koniec načítavania
    }
  };
  

  // Pagination Logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  const getCurrentPageInvoices = () => currentInvoices;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedInvoiceIds([]); // Reset selection when page changes
    setShowBulkActions(false); // Hide bulk actions
  };

  // Handler for selecting/deselecting all invoices on current page
  const handleSelectAllInvoices = (isSelected) => {
    if (isSelected) {
      const currentPageInvoices = getCurrentPageInvoices();
      const newSelectedIds = [
        ...new Set([...selectedInvoiceIds, ...currentPageInvoices.map(invoice => invoice.id)]),
      ];
      setSelectedInvoiceIds(newSelectedIds);
    } else {
      const currentPageInvoices = getCurrentPageInvoices();
      const newSelectedIds = selectedInvoiceIds.filter(id => !currentPageInvoices.some(invoice => invoice.id === id));
      setSelectedInvoiceIds(newSelectedIds);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <img
            src="/images/checklist.png"
            alt="checklist"
            className="w-6 h-6 rounded-full"
          />
          <h1 className="text-gray-600 text-2xl font-bold">Faktúry</h1>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
            onClick={() => setShowAddInvoiceModal(true)} // Show the modal when clicked
          >
            + Pridať faktúru
          </button>
          <button
            className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
            onClick={() => setShowAddMonthlyInvoicesModal(true)}
          >
            + Pridať mesačné faktúry
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white w-full p-4 shadow-xl rounded-2xl">
        <InvoiceFilter invoices={allInvoices} onFilter={handleFilterChange} />
        {selectedInvoiceIds.length > 0 && (
        <div className="mb-4">
          <button
            className="bg-gray-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-gray-700 transition duration-300"
            onClick={() => setShowBulkActions(prev => !prev)}
          >
          Akcie ({selectedInvoiceIds.length})
          </button>

          {showBulkActions && (
            <div className="mt-2 flex gap-2">
              <button
                className="bg-blue-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-blue-700 transition duration-300"
                onClick={handleBulkMarkAsSent}
              >
                Označiť ako odoslané
              </button>
              <button
                className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
                onClick={handleBulkMarkAsPaid}
              >
                Označiť ako zaplatené
              </button>
              <button
                className="bg-purple-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-purple-700 transition duration-300"
                onClick={handleBulkDownload}
              >
                Stiahnuť PDF
              </button>
              <button
                className="bg-red-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-red-700 transition duration-300"
                onClick={handleBulkDelete}
              >
                Vymazať
              </button>
            </div>
          )}
        </div>
      )}
        <InvoiceTableExtended
          invoices={currentInvoices}
          onEdit={handleEdit}
          onMarkAsSent={handleMarkAsSent}
          onMarkAsPaid={handleMarkAsPaid}
          onDelete={handleDelete}
          selectedInvoiceIds={selectedInvoiceIds}
          onSelectInvoice={handleSelectInvoice}
          onSelectAllInvoices={handleSelectAllInvoices}
        />
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
          <button
            key={pageNumber}
            className={`mx-1 px-3 py-1 rounded ${
              currentPage === pageNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handlePageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      {/* Modals */}
      {showAddInvoiceModal && (
        <AddInvoiceModal
          closeModal={() => setShowAddInvoiceModal(false)}
          onSubmit={handleAddInvoice}
        />
      )}
      {showEditInvoiceModal && (
        <EditInvoiceModal
          closeModal={() => {
            setShowEditInvoiceModal(false);
            setSelectedInvoiceId(null);
          }}
          onSubmit={handleUpdateInvoice}
          invoiceId={selectedInvoiceId}
        />
      )}
      {showAddMonthlyInvoicesModal && (
        <AddMonthlyInvoicesModal
          closeModal={() => setShowAddMonthlyInvoicesModal(false)}
          onSubmit={handleAddMonthlyInvoices}
        />
      )}
      {showBulkMarkAsPaidModal && (
        <MarkAsPaidModal
          closeModal={() => setShowBulkMarkAsPaidModal(false)}
          onSubmit={handleBulkMarkAsPaidSubmit}
        />
      )}
      {isGeneratingPDF && (
        <div className="flex justify-center items-center">
          <div className="loader">Generovanie PDF...</div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Invoices;
