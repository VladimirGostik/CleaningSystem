// src/components/ExpenseTable.js

import React from 'react';
import PropTypes from 'prop-types';

const ExpenseTable = ({ expenses, onEdit, onDelete }) => {
  return (
    <table className="min-w-full leading-normal">
      <thead>
        <tr>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Firma
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Názov
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Popis
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Cena (€)
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Deductibility (%)
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Final Price (€)
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Typ
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Start Date
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            End Date
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Akcie
          </th>
        </tr>
      </thead>
      <tbody>
        {expenses.length > 0 ? (
          expenses.map(expense => (
            <tr key={expense.id}>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                {expense.Company ? expense.Company.name : 'N/A'}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                {expense.name}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                {expense.description}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                {expense.price.toFixed(2)}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                {expense.deductibility}%
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                {expense.final_price.toFixed(2)}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center capitalize">
                {expense.type}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                {new Date(expense.start_date).toLocaleDateString('sk-SK')}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                {expense.end_date ? new Date(expense.end_date).toLocaleDateString('sk-SK') : 'N/A'}
              </td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded-md mr-2 hover:bg-blue-600 transition duration-300"
                  onClick={() => onEdit(expense)}
                >
                  Upraviť
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition duration-300"
                  onClick={() => onDelete(expense.id)}
                >
                  Vymazať
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="10" className="px-5 py-5 bg-white text-sm text-center">
              Žiadne výdavky neboli nájdené.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

ExpenseTable.propTypes = {
  expenses: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ExpenseTable;
