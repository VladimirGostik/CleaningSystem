// src/components/ExpenseModals.js
import React, { useState, useEffect } from 'react';

export const OneTimeExpenseModal = ({ isOpen, onClose, onSubmit, companies }) => {
  const [formData, setFormData] = useState({
    id_company: '',
    name: '',
    description: '',
    price: '',
    deductibility: '',
    start_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Nastavíme typ pre jednorazový výdavok
    const expenseData = { ...formData, type: 'jednorazova' };
    onSubmit(expenseData);
    setFormData({
      id_company: '',
      name: '',
      description: '',
      price: '',
      deductibility: '',
      start_date: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-xl font-semibold mb-4">Pridať jednorazový výdavok</h3>
        <form onSubmit={handleSubmit}>
          {/* Výber firmy */}
          <div className="mb-4">
            <label className="block text-gray-700">Firma</label>
            <select
              value={formData.id_company}
              onChange={(e) =>
                setFormData({ ...formData, id_company: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            >
              <option value="">Vyberte firmu</option>
              {(companies || []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
          {/* Názov výdavku */}
          <div className="mb-4">
            <label className="block text-gray-700">Názov výdavku</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Popis */}
          <div className="mb-4">
            <label className="block text-gray-700">Popis</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          {/* Cena */}
          <div className="mb-4">
            <label className="block text-gray-700">Suma</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Odpočítateľnosť */}
          <div className="mb-4">
            <label className="block text-gray-700">Odpočítateľnosť (%)</label>
            <input
              type="number"
              value={formData.deductibility}
              onChange={(e) =>
                setFormData({ ...formData, deductibility: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Dátum */}
          <div className="mb-4">
            <label className="block text-gray-700">Dátum</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Akcie */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border rounded-md"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-3 py-1 rounded-md"
            >
              Pridať
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MonthlyExpenseModal = ({ isOpen, onClose, onSubmit, companies }) => {
  const [formData, setFormData] = useState({
    id_company: '',
    name: '',
    description: '',
    price: '',
    deductibility: '',
    start_date: '',
    end_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const expenseData = { ...formData, type: 'mesacna' };
    onSubmit(expenseData);
    setFormData({
      id_company: '',
      name: '',
      description: '',
      price: '',
      deductibility: '',
      start_date: '',
      end_date: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-xl font-semibold mb-4">Pridať mesačný výdavok</h3>
        <form onSubmit={handleSubmit}>
          {/* Výber firmy */}
          <div className="mb-4">
            <label className="block text-gray-700">Firma</label>
            <select
              value={formData.id_company}
              onChange={(e) =>
                setFormData({ ...formData, id_company: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            >
              <option value="">Vyberte firmu</option>
              {(companies || []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
          {/* Názov výdavku */}
          <div className="mb-4">
            <label className="block text-gray-700">Názov výdavku</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Popis */}
          <div className="mb-4">
            <label className="block text-gray-700">Popis</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          {/* Cena */}
          <div className="mb-4">
            <label className="block text-gray-700">Suma</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Odpočítateľnosť */}
          <div className="mb-4">
            <label className="block text-gray-700">Odpočítateľnosť (%)</label>
            <input
              type="number"
              value={formData.deductibility}
              onChange={(e) =>
                setFormData({ ...formData, deductibility: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Dátum začiatku */}
          <div className="mb-4">
            <label className="block text-gray-700">Dátum začiatku</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Dátum ukonćenia</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Akcie */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border rounded-md"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-3 py-1 rounded-md"
            >
              Pridať
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditExpenseModal = ({ isOpen, onClose, onSubmit, companies, expense }) => {
  const [formData, setFormData] = useState({
    id_company: expense ? expense.id_company : '',
    name: expense ? expense.name : '',
    description: expense ? expense.description : '',
    price: expense ? expense.price : '',
    deductibility: expense ? expense.deductibility : '',
    start_date: expense ? expense.start_date : '',
    end_date: expense ? expense.end_date : '',
    type: expense ? expense.type : 'jednorazova',
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        id_company: expense.id_company,
        name: expense.name,
        description: expense.description,
        price: expense.price,
        deductibility: expense.deductibility,
        start_date: expense.start_date,
        end_date: expense.end_date,
        type: expense.type,
      });
    }
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-xl font-semibold mb-4">Upraviť výdavok</h3>
        <form onSubmit={handleSubmit}>
          {/* Výber firmy */}
          <div className="mb-4">
            <label className="block text-gray-700">Firma</label>
            <select
              value={formData.id_company}
              onChange={(e) =>
                setFormData({ ...formData, id_company: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            >
              <option value="">Vyberte firmu</option>
              {(companies || []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
          {/* Názov výdavku */}
          <div className="mb-4">
            <label className="block text-gray-700">Názov výdavku</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Popis */}
          <div className="mb-4">
            <label className="block text-gray-700">Popis</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          {/* Cena */}
          <div className="mb-4">
            <label className="block text-gray-700">Suma</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Odpočítateľnosť */}
          <div className="mb-4">
            <label className="block text-gray-700">Odpočítateľnosť (%)</label>
            <input
              type="number"
              value={formData.deductibility}
              onChange={(e) =>
                setFormData({ ...formData, deductibility: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Dátum */}
          <div className="mb-4">
            <label className="block text-gray-700">Dátum začatia</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Dátum ukončenia</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          {/* Akcie */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border rounded-md"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-3 py-1 rounded-md"
            >
              Uložiť
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
