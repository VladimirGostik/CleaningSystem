// src/pages/CompanyDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { getCompanies, deleteCompany } from '../services/companyService';
import { getInvoices, getInvoiceStatistics } from '../services/invoices';
import { getExpensesAll } from '../services/expansesService';
import { getMonthlyInvoices } from '../services/monthlyInvoiceService';
import AddCompanyModal from '../modals/AddCompanyModal';
import EditCompanyModal from '../modals/EditCompanyModal';
import { toast } from 'react-toastify';

const CompanyDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRevenue: '0.00',
    totalInvoicesCount: 0,
    unpaidInvoicesCount: 0,
    monthlyRevenue: '0.00',
  });
  // Predvolená časová perióda – uprav si podľa potreby
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState('2025-12-31');

  // Stav pre zobrazenie modálu pre pridanie novej firmy
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  // Stav pre vybranú firmu a zobrazenie modálu pre úpravu firmy
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await getInvoiceStatistics(fromDate, toDate);
      setStatistics({
        totalRevenue: stats?.totalRevenue ?? '0.00',
        totalInvoicesCount: stats?.totalInvoicesCount ?? 0,
        unpaidInvoicesCount: stats?.unpaidInvoicesCount ?? 0,
        monthlyRevenue: stats?.monthlyRevenue ?? '0.00',
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics({
        totalRevenue: '0.00',
        totalInvoicesCount: 0,
        unpaidInvoicesCount: 0,
        monthlyRevenue: '0.00',
      });
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchCompanies();
    fetchInvoices();
    fetchExpenses();
    fetchMonthlyInvoices();
    fetchStatistics();
  }, [fromDate, toDate, fetchStatistics]);

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

  const fetchMonthlyInvoices = async () => {
    try {
      const res = await getMonthlyInvoices();
      setMonthlyInvoices(res || []);
    } catch (error) {
      console.error('Error fetching monthly invoices:', error);
    }
  };

  // Filtrovanie faktúr podľa vybraného časového obdobia (issue_date)
  const filteredInvoices = invoices.filter(inv => {
    const issueDate = new Date(inv.issue_date);
    return issueDate >= new Date(fromDate) && issueDate <= new Date(toDate);
  });

  // Calculate company statistics
  const getCompanyStats = (companyId) => {
    const companyInvoices = filteredInvoices.filter(inv => inv.id_company === companyId);
    const companyExpenses = expenses.filter(exp => exp.id_company === companyId);
    const companyMonthlyInvoices = monthlyInvoices.filter(mi => mi.id_company === companyId);

    // Calculate invoice totals
    const invoiceTotals = companyInvoices.reduce((acc, inv) => {
      const totalPrice = (inv.services || []).reduce((sum, service) => {
        return sum + (parseFloat(service.price) || 0) * (parseInt(service.quantity, 10) || 0);
      }, 0);
      
      const status = inv.status || 'unknown';
      acc[status] = (acc[status] || 0) + totalPrice;
      acc.total = (acc.total || 0) + totalPrice;
      if (status === 'paid') {
        acc.paidTotal = (acc.paidTotal || 0) + totalPrice;
      }
      return acc;
    }, { paidTotal: 0 });

    // Calculate expense totals
    const filterStart = new Date(fromDate);
    const filterEnd = new Date(toDate);
    const expenseTotals = companyExpenses.reduce((acc, exp) => {
      let effectiveAmount = 0;
      const expenseDate = new Date(exp.start_date);

      if (exp.type === 'mesacna') {
        const expenseStart = expenseDate;
        const expenseEnd = exp.end_date ? new Date(exp.end_date) : filterEnd;
        const activeStart = expenseStart > filterStart ? expenseStart : filterStart;
        const activeEnd = expenseEnd < filterEnd ? expenseEnd : filterEnd;
        if (activeStart <= activeEnd) {
          const monthDiff =
            (activeEnd.getFullYear() - activeStart.getFullYear()) * 12 +
            (activeEnd.getMonth() - activeStart.getMonth()) +
            1;
          effectiveAmount = (parseFloat(exp.price) || 0) * monthDiff;
        }
      } else if (exp.type === 'jednorazova') {
        if (expenseDate >= filterStart && expenseDate <= filterEnd) {
          effectiveAmount = parseFloat(exp.price) || 0;
        }
      }

      if (effectiveAmount > 0) {
        acc.total = (acc.total || 0) + effectiveAmount;
      }
      return acc;
    }, { total: 0 });

    // Calculate monthly invoices stats
    const monthlyTotal = companyMonthlyInvoices.reduce((acc, mi) => {
      // Check if services_planned is an array and has data
      const services = Array.isArray(mi.services_planned) ? mi.services_planned : [];
      
      if (services.length === 0) {
        // If no services_planned, return 0 (monthly invoices should always have services_planned)
        return acc;
      }
      
      const totalPrice = services.reduce((sum, service) => {
        // Ensure service has price and quantity
        if (!service) return sum;
        const price = parseFloat(service.price) || 0;
        const quantity = parseInt(service.quantity, 10) || 0;
        return sum + (price * quantity);
      }, 0);
      
      return acc + totalPrice;
    }, 0);

    const profit = invoiceTotals.paidTotal - expenseTotals.total;

    return {
      invoiceTotal: invoiceTotals.total || 0,
      paidTotal: invoiceTotals.paidTotal || 0,
      expenseTotal: expenseTotals.total || 0,
      monthlyTotal,
      monthlyCount: companyMonthlyInvoices.length,
      profit,
      invoiceCount: companyInvoices.length,
    };
  };

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
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Prehľad firiem</h1>
          <button
            className="bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 shadow-md hover:shadow-lg"
            onClick={() => setShowAddCompanyModal(true)}
          >
            + Pridať firmu
          </button>
        </div>

        {/* Výber časového obdobia */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Od:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Do:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Obrat za obdobie</p>
                <p className="text-3xl font-bold">{(parseFloat(statistics.totalRevenue) || 0).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Počet vystavených faktúr</p>
                <p className="text-3xl font-bold">{statistics.totalInvoicesCount ?? 0}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">Počet neuhradených faktúr</p>
                <p className="text-3xl font-bold">{statistics.unpaidInvoicesCount ?? 0}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Mesačný obrat</p>
                <p className="text-3xl font-bold">{(parseFloat(statistics.monthlyRevenue) || 0).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Statistics Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Štatistiky firiem</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Firma</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Počet faktúr</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Obrat</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Zaplatené</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Výdavky</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Mesačné faktúry</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Mesačný obrat</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Zisk</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Akcie</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => {
                  const stats = getCompanyStats(company.id);
                  return (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                        {stats.invoiceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {stats.invoiceTotal.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        {stats.paidTotal.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-700">
                        {stats.expenseTotal.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">{stats.monthlyCount}</span>
                          <span className="text-xs text-gray-500">({stats.monthlyTotal.toFixed(2)} €)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-600">
                        {stats.monthlyTotal.toFixed(2)} €
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.profit.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditCompany(company.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Upraviť
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDeleteCompany(company.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Vymazať
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <AddCompanyModal
          closeModal={() => setShowAddCompanyModal(false)}
          fetchCompanies={fetchCompanies}
        />
      )}

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
