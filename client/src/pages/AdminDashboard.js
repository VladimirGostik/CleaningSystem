// src/pages/CompanyDashboard.js
import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { getCompanies, deleteCompany } from '../services/companyService';
import { getInvoices } from '../services/invoices';
import { getExpensesAll } from '../services/expansesService';
import CompanyBox from '../components/CompanyBox';
import EditCompanyModal from '../modals/EditCompanyModal';
import { toast } from 'react-toastify';

const CompanyDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  // Predvolená časová perióda – uprav si podľa potreby
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState('2025-12-31');

  // Stav pre vybranú firmu a zobrazenie modálu pre úpravu firmy
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);

  useEffect(() => {
    fetchCompanies();
    fetchInvoices();
    fetchExpenses();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await getCompanies();
      setCompanies(res.data || res);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await getInvoices();
      setInvoices(res);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await getExpensesAll();
      console.log(res.data);
      setExpenses(res.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Filtrovanie faktúr podľa vybraného časového obdobia (issue_date)
  const filteredInvoices = invoices.filter(inv => {
    const issueDate = new Date(inv.issue_date);
    return issueDate >= new Date(fromDate) && issueDate <= new Date(toDate);
  });

  // Callback pre otvorenie modálu pre úpravu firmy
  const handleEditCompany = (companyId) => {
    const companyToEdit = companies.find(c => c.id === companyId);
    if (companyToEdit) {
      setSelectedCompany(companyToEdit);
      setShowEditCompanyModal(true);
    }
  };

  // Callback pre vymazanie firmy
  const handleDeleteCompany = async (companyId) => {
    if (window.confirm('Ste si istý, že chcete vymazať túto firmu?')) {
      try {
        await deleteCompany(companyId);
        toast.success('Firma bola úspešne vymazaná');
        fetchCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
        toast.error('Chyba pri vymazávaní firmy');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Prehľad firiem</h1>

        {/* Výber časového obdobia */}
        <div className="mb-4 flex items-center gap-4">
          <div>
            <label className="mr-2 font-semibold">Od:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="mr-2 font-semibold">Do:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>

        {/* Zobrazenie firiem – v mriežke */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(company => (
            <CompanyBox
              key={company.id}
              company={company}
              invoices={filteredInvoices.filter(inv => inv.id_company === company.id)}
              expenses={expenses.filter(exp => exp.id_company === company.id)}
              fromDate={fromDate}
              toDate={toDate}
              onEdit={handleEditCompany}
              onDelete={handleDeleteCompany}
            />
          ))}
        </div>
      </div>

      {/* Edit Company Modal */}
      {showEditCompanyModal && selectedCompany && (
        <EditCompanyModal
          closeModal={() => {
            setShowEditCompanyModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          fetchCompanies={fetchCompanies}
        />
      )}
    </AdminLayout>
  );
};

export default CompanyDashboard;
