// src/pages/ExpensesPage.js
import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import ExpensesTable from '../components/ExpensesTable';
import {
  OneTimeExpenseModal,
  MonthlyExpenseModal,
  EditExpenseModal,
} from '../modals/ExpenseModals';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expansesService';
import { getCompanies } from '../services/companyService';
import ImportExpenseRecords from '../modals/ImportExpenseRecords';

const Expenses = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showOneTimeModal, setShowOneTimeModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  // Nové stavy pre filtre:
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [currentMonth]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchExpenses = async () => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    try {
      const res = await getExpenses(month, year);
      setExpenses(res.data);
    } catch (err) {
      console.error('Chyba pri načítaní výdavkov:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await getCompanies();
      // Ak API vracia dáta vo formáte res.data, použite setCompanies(res.data);
      setCompanies(res.data || res);
    } catch (err) {
      console.error('Chyba pri načítaní firiem:', err);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const handleOneTimeSubmit = async (expenseData) => {
    try {
      await createExpense(expenseData);
      setShowOneTimeModal(false);
      fetchExpenses();
    } catch (err) {
      console.error('Chyba pri vytváraní jednorazového výdavku:', err);
    }
  };

  const handleMonthlySubmit = async (expenseData) => {
    try {
      await createExpense(expenseData);
      setShowMonthlyModal(false);
      fetchExpenses();
    } catch (err) {
      console.error('Chyba pri vytváraní mesačného výdavku:', err);
    }
  };

  const handleEditSubmit = async (updatedData) => {
    try {
      await updateExpense(editingExpense.id, updatedData);
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error('Chyba pri aktualizácii výdavku:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      fetchExpenses();
    } catch (err) {
      console.error('Chyba pri mazaní výdavku:', err);
    }
  };

  const handleImportSubmit = async (importedExpenses) => {
    // Predpokladáme, že importedExpenses je pole objektov s údajmi z parsovaného súboru
    try {
      // Môžete vytvoriť dávkové volanie backendu alebo iterovať a volať createExpense pre každý výdavok
      for (const expenseData of importedExpenses) {
        await createExpense(expenseData);
      }
      setShowImportModal(false);
      fetchExpenses();
    } catch (err) {
      console.error('Chyba pri importovaní výdavkov:', err);
    }
  };

  // Filterovanie výdavkov podľa vybranej firmy a vyhľadávacieho termínu v názve
  const filteredExpenses = expenses.filter(expense => {
    const matchesCompany = selectedCompany
      ? expense.id_company === parseInt(selectedCompany, 10)
      : true;
    const matchesSearch = searchTerm
      ? expense.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCompany && matchesSearch;
  });

  // Výpočet celkovej sumy z filtrovaných výdavkov (predpokladáme, že pole "price" obsahuje sumu)
  const totalSum = filteredExpenses.reduce((acc, expense) => acc + Number(expense.price || 0), 0);

  return (
    <AdminLayout>
      {/* Hlavička */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <img src="/images/money.png" alt="výdavky" className="w-6 h-6 rounded-full" />
          <h1 className="text-gray-600 text-2xl font-bold">Výdavky</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOneTimeModal(true)}
            className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
          >
            + Pridať jednorazový výdavok
          </button>
          <button
            onClick={() => setShowMonthlyModal(true)}
            className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
          >
            + Pridať mesačný výdavok
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-blue-700 transition duration-300"
          >
            + Importovať výdavky
          </button>
        </div>
      </div>

      {/* Navigácia medzi mesiacmi */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="text-gray-600 text-xl">
          &lt;
        </button>
        <h2 className="text-xl font-semibold">
          {currentMonth.toLocaleString('sk-SK', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={handleNextMonth} className="text-gray-600 text-xl">
          &gt;
        </button>
      </div>

      {/* Filtre */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="mb-2 md:mb-0">
          <label className="mr-2 font-semibold">Firma:</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="border rounded px-4 py-2 text-lg"
          >
            <option value="">Všetky firmy</option>
            {(companies || []).map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Vyhľadať výdavok:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Názov výdavku"
            className="border rounded px-4 py-2 text-lg"
          />
        </div>
      </div>

      {/* Tabuľka */}
      <ExpensesTable
        expenses={filteredExpenses}
        onEdit={(expense) => setEditingExpense(expense)}
        onDelete={handleDelete}
      />

      {/* Súčet výdavkov */}
      <div className="mt-4 text-right">
        <span className="font-bold">Celková suma: </span>
        <span>{totalSum.toFixed(2)} €</span>
      </div>

      {/* Modály pre vytvorenie */}
      <OneTimeExpenseModal
        isOpen={showOneTimeModal}
        onClose={() => setShowOneTimeModal(false)}
        onSubmit={handleOneTimeSubmit}
        companies={companies}
      />
      <MonthlyExpenseModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
        onSubmit={handleMonthlySubmit}
        companies={companies}
      />

      {/* Modál pre úpravu */}
      {editingExpense && (
        <EditExpenseModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onSubmit={handleEditSubmit}
          companies={companies}
          expense={editingExpense}
        />
      )}

      {showImportModal && (
        <ImportExpenseRecords
          onClose={() => setShowImportModal(false)}
          onSubmit={handleImportSubmit}
          companies={companies}
        />
        )}
    </AdminLayout>
  );
};

export default Expenses;
