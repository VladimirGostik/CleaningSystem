import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import AddMonthlyInvoice from '../modals/AddMonthlyInvoice';
import { addMonthlyInvoice, getMonthlyInvoices, deleteMonthlyInvoice } from '../services/monthlyInvoiceService';
import InvoiceTable from '../components/InvoiceTable';
import FilterInput from '../components/FilterInput';

const MonthlyInvoices = () => {
  const [showModal, setShowModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);

  const fetchInvoices = async () => {
    try {
      const invoicesData = await getMonthlyInvoices();
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData); // Set initial filtered invoices to all invoices
    } catch (error) {
      console.error('Error fetching monthly invoices:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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
    let filtered = invoices;
    if (filters.invoiceName) {
      filtered = filtered.filter(invoice => invoice.invoice_name.toLowerCase().includes(filters.invoiceName.toLowerCase()));
    }
    if (filters.companies && filters.companies.length > 0) {
      filtered = filtered.filter(invoice => filters.companies.includes(invoice.company_name));
    }
    if (filters.residentialCompanies && filters.residentialCompanies.length > 0) {
      filtered = filtered.filter(invoice => filters.residentialCompanies.includes(invoice.residential_company_name));
    }
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