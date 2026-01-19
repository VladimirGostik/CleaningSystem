// src/components/CompanyBox.js
import React, { useEffect, useState, useRef } from 'react';

const CompanyBox = ({ company, invoices, expenses, monthlyInvoices, fromDate, toDate, onEdit, onDelete }) => {
  const [invoiceStatusTotals, setInvoiceStatusTotals] = useState({});
  const [expenseTypeTotals, setExpenseTypeTotals] = useState({});
  const [monthlyInvoiceStats, setMonthlyInvoiceStats] = useState({ total: 0, count: 0 });
  const [profit, setProfit] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Pomocná funkcia na formátovanie čísla na dve desatinné miesta
  const formatNumber = (num) => (parseFloat(num) || 0).toFixed(2);

  useEffect(() => {
    // Prepočet total_price pre každú faktúru (ak obsahuje pole "services")
    const computedInvoices = invoices.map((invoice) => {
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
  
    const invoiceTotals = computedInvoices.reduce((acc, inv) => {
      const status = inv.status || 'unknown';
      const amount = parseFloat(inv.total_price) || 0;
      acc[status] = (acc[status] || 0) + amount;
      acc.total = (acc.total || 0) + amount;
      return acc;
    }, {});
  
    // Pre výdavky definujeme filtrované obdobie
    const filterStart = new Date(fromDate);
    const filterEnd = new Date(toDate);
  
    // Výpočet súčtov výdavkov
    const expenseTotals = expenses.reduce((acc, exp) => {
      let effectiveAmount = 0;
      const expenseDate = new Date(exp.start_date);
  
      // Mesačné výdavky
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
      }
      // Jednorazové výdavky
      else if (exp.type === 'jednorazova') {
        if (expenseDate >= filterStart && expenseDate <= filterEnd) {
          effectiveAmount = parseFloat(exp.price) || 0;
        }
      }
      // Ak je effectiveAmount > 0, pridaj do súčtov
      if (effectiveAmount > 0) {
        const type = exp.type;
        acc[type] = (acc[type] || 0) + effectiveAmount;
        acc.total = (acc.total || 0) + effectiveAmount;
      }
      return acc;
    }, {});
  
    // Výpočet súčtu a počtu monthly invoices
    const monthlyTotal = monthlyInvoices.reduce((acc, mi) => {
      const totalPrice = (mi.services_planned || []).reduce((sum, service) => {
        return sum + (parseFloat(service.price) || 0) * (parseInt(service.quantity, 10) || 0);
      }, 0);
      return acc + totalPrice;
    }, 0);
    
    const monthlyCount = monthlyInvoices.length;
    setMonthlyInvoiceStats({ total: monthlyTotal, count: monthlyCount });
  
    const paidInvoiceTotal = invoiceTotals.paid || 0;
    const expenseTotal = expenseTotals.total || 0;
    setProfit(paidInvoiceTotal - expenseTotal);
    setInvoiceStatusTotals(invoiceTotals);
    setExpenseTypeTotals(expenseTotals);
  }, [invoices, expenses, monthlyInvoices, fromDate, toDate]);

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) onEdit(company.id);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (onDelete) onDelete(company.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 relative">
      {/* Menu button */}
      <div className="absolute top-4 right-4" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
            <button
              onClick={handleEdit}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Upraviť
            </button>
            <button
              onClick={handleDelete}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Vymazať
            </button>
          </div>
        )}
      </div>

      {/* Company Name */}
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-3">
        {company.company_name}
      </h3>

      {/* Monthly Invoices Section */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Mesačné faktúry</h4>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Počet:</span>
          <span className="text-blue-700 font-bold">{monthlyInvoiceStats.count}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-gray-600 text-sm">Súčet:</span>
          <span className="text-blue-700 font-bold text-lg">{formatNumber(monthlyInvoiceStats.total)} €</span>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">Faktúry podľa stavu</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Vytvorené:</span>
            <span className="font-medium">{formatNumber(invoiceStatusTotals.created)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Odovzdané:</span>
            <span className="font-medium">{formatNumber(invoiceStatusTotals.sent)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Vypršané:</span>
            <span className="font-medium text-orange-600">{formatNumber(invoiceStatusTotals.expired)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Zaplatené:</span>
            <span className="font-medium text-green-600">{formatNumber(invoiceStatusTotals.paid)} €</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-700">Celkom:</span>
            <span className="font-bold text-gray-800">{formatNumber(invoiceStatusTotals.total)} €</span>
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">Výdavky podľa typu</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Mesačné:</span>
            <span className="font-medium">{formatNumber(expenseTypeTotals.mesacna)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Jednorazové:</span>
            <span className="font-medium">{formatNumber(expenseTypeTotals.jednorazova)} €</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-700">Celkom:</span>
            <span className="font-bold text-gray-800">{formatNumber(expenseTypeTotals.total)} €</span>
          </div>
        </div>
      </div>

      {/* Profit Section */}
      <div className="mt-6 pt-4 border-t-2 border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Zisk:</span>
          <span className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatNumber(profit)} €
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompanyBox;
