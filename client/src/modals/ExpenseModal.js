import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  getCompanies,
  getCompanyById,
  getResidentialCompanies,
  getResidentialCompanyById,
} from '../services/companyService';

import { toast } from 'react-toastify';

const ExpenseModal = ({ onClose, onSave, expense }) => {
  const isEditMode = Boolean(expense);
  const [id_company, setIdCompany] = useState(expense ? expense.id_company : '');
  const [name, setName] = useState(expense ? expense.name : '');
  const [description, setDescription] = useState(expense ? expense.description : '');
  const [price, setPrice] = useState(expense ? expense.price : 0);
  const [deductibility, setDeductibility] = useState(expense ? expense.deductibility : 0);
  const [expenseType, setExpenseType] = useState(expense ? expense.type : 'jednorazova');
  const [startDate, setStartDate] = useState(expense ? new Date(expense.start_date) : new Date());
  const [durationMonths, setDurationMonths] = useState(expense?.type === 'mesacna' ? calculateDuration(expense) : 1);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanies();
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Chyba pri načítaní firiem');
      }
    };

    fetchCompanies();
  }, []);

  function calculateDuration(expense) {
    if (!expense.end_date) return 1;
    const start = new Date(expense.start_date);
    const end = new Date(expense.end_date);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return months > 0 ? months : 1;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!id_company || !name || !price || !deductibility || !expenseType || !startDate) {
      toast.error('Vyplňte všetky povinné polia.');
      return;
    }

    const expenseData = {
      id_company,
      name,
      description,
      price: parseFloat(price),
      deductibility: parseFloat(deductibility),
      type: expenseType,
      start_date: startDate.toISOString().split('T')[0],
    };

    if (expenseType === 'mesacna') {
      expenseData.duration_months = parseInt(durationMonths, 10);
    }

    if (isEditMode) {
      expenseData.id = expense.id;
    }

    onSave(expenseData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{isEditMode ? 'Upraviť Výdavok' : 'Pridať Výdavok'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Firma */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Firma</label>
            <select
              value={id_company}
              onChange={(e) => setIdCompany(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2"
              required
            >
              <option value="">Vyberte firmu</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.company_name}</option>
              ))}
            </select>
          </div>

          {/* Názov a Cena vedľa seba */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Názov</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2"
                required
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700">Cena (€)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Popis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              rows="3"
            />
          </div>

          {/* Deductibility a Typ vedľa seba */}
          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">Deductibility (%)</label>
              <input
                type="number"
                value={deductibility}
                onChange={(e) => setDeductibility(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2"
                min="0"
                max="100"
                step="1"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">Typ Výdavku</label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2"
                required
              >
                <option value="jednorazova">Jednorazový</option>
                <option value="mesacna">Mesačný</option>
              </select>
            </div>
          </div>

          {/* Dátum a Trvanie */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Dátum začiatku</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd.MM.yyyy"
              className="mt-1 block w-full border rounded-md p-2"
              required
            />
          </div>

          {expenseType === 'mesacna' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Trvanie (mesiace)</label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2"
                min="1"
                required
              />
            </div>
          )}

          {/* Tlačidlá */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-300"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
            >
              {isEditMode ? 'Uložiť Zmeny' : 'Pridať Výdavok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ExpenseModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  expense: PropTypes.object,
};

export default ExpenseModal;
