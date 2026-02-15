import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AddMonthlyInvoice from '../modals/AddMonthlyInvoice';
import { addMonthlyInvoice, getMonthlyInvoices, deleteMonthlyInvoice } from '../services/monthlyInvoiceService';
import InvoiceTable from '../components/InvoiceTable';
import FilterInput from '../components/FilterInput';
import { textContains } from '../utils/textUtils';

const MonthlyInvoices = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [currentFilters, setCurrentFilters] = useState(null); // Store current filters

  // Helper function to apply filters
  const applyFilters = (invoicesToFilter, filters) => {
    if (!filters) {
      return invoicesToFilter;
    }
    
    let filtered = invoicesToFilter;
    if (filters.invoiceName) {
      filtered = filtered.filter(invoice => textContains(invoice.invoice_name, filters.invoiceName));
    }
    if (filters.companies && filters.companies.length > 0) {
      filtered = filtered.filter(invoice => filters.companies.includes(invoice.company_name));
    }
    if (filters.residentialCompanies && filters.residentialCompanies.length > 0) {
      filtered = filtered.filter(invoice => filters.residentialCompanies.includes(invoice.residential_company_name));
    }
    return filtered;
  };

  const fetchInvoices = useCallback(async () => {
    try {
      const invoicesData = await getMonthlyInvoices();
      
      // Calculate total_price for each invoice
      const invoicesWithTotal = invoicesData.map((invoice) => {
        const totalPrice = (invoice.services_planned || []).reduce((acc, service) => {
          const price = parseFloat(service.price) || 0;
          const quantity = parseInt(service.quantity, 10) || 0;
          return acc + price * quantity;
        }, 0);

        return {
          ...invoice,
          total_price: totalPrice,
        };
      });
      
      setInvoices(invoicesWithTotal);
      
      // Reapply filters if they exist, otherwise show all invoices
      if (currentFilters) {
        const filtered = applyFilters(invoicesWithTotal, currentFilters);
        setFilteredInvoices(filtered);
      } else {
        setFilteredInvoices(invoicesWithTotal);
      }
    } catch (error) {
      console.error('Error fetching monthly invoices:', error);
    }
  }, [currentFilters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Restore filters from location state when navigating back
  // Filters are automatically restored by FilterInput component
  useEffect(() => {
    if (location.state) {
      // FilterInput component will automatically load and apply filters
      // No additional action needed here
    }
  }, [location.state]);

  const handleAddInvoice = async ({ invoiceData, servicesData }) => {
    try {
      await addMonthlyInvoice({ invoiceData, servicesData });
      setShowModal(false);
      fetchInvoices(); // Refresh the invoices list after successful addition
    } catch (error) {
      console.error('Error adding monthly invoice:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteMonthlyInvoice(invoiceId);
      fetchInvoices(); // Refresh the invoices list after successful deletion
    } catch (error) {
      console.error('Error deleting monthly invoice:', error);
    }
  };

  const handleFilter = (filters) => {
    // Check if any filter is active
    const hasActiveFilters = 
      (filters.invoiceName && filters.invoiceName.trim()) ||
      (filters.companies && filters.companies.length > 0) ||
      (filters.residentialCompanies && filters.residentialCompanies.length > 0);
    
    // Store current filters if any are active
    if (hasActiveFilters) {
      setCurrentFilters(filters);
    } else {
      setCurrentFilters(null);
    }
    
    // Apply filters
    const filtered = applyFilters(invoices, filters);
    setFilteredInvoices(filtered);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-2">
        <div className='flex items-center gap-2'>
          <img
            src="/images/monthly-bill.png"
            alt="monthly-bill"
            className="w-6 h-6 rounded-full"
          />
          <h1 className='text-grey-600 text-2xl font-bold'>Mesačné faktúry</h1>
        </div>
        <button
          className='bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300'
          onClick={() => setShowModal(true)}
        >
          + Pridať mesačnú faktúru
        </button>
      </div>

      <div className='bg-white w-full min-h-screen p-4 shadow-xl rounded-2xl'>
        <FilterInput onFilter={handleFilter} />
        <InvoiceTable invoices={filteredInvoices} onDelete={handleDeleteInvoice} fetchInvoices={fetchInvoices}/>
      </div>

      {showModal && (
        <AddMonthlyInvoice closeModal={() => setShowModal(false)} onSubmit={handleAddInvoice} />
      )}
    </AdminLayout>
  );
};

export default MonthlyInvoices;