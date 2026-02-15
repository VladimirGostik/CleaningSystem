// src/components/ExpensesTable.js
import React from 'react';

const ExpensesTable = ({ expenses, onEdit, onDelete }) => {
  return (
    <div className="bg-white w-full p-4 shadow-xl rounded-2xl overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>            
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Firma</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Názov</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Popis</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Suma</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Odpočítateľnosť</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Faktúra</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Akcie</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {expense.Company ? expense.Company.name : 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {expense.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {expense.description}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {expense.price} €
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {expense.deductibility}%
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {expense.invoice?.invoice_number || expense.id_invoice ? `#${expense.id_invoice}` : '–'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  <button onClick={() => onEdit(expense)} className="text-blue-500 hover:underline mr-2">
                    Upraviť
                  </button>
                  <button onClick={() => onDelete(expense.id)} className="text-red-500 hover:underline">
                    Vymazať
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-4 text-gray-600">
                Žiadne výdavky
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpensesTable;
