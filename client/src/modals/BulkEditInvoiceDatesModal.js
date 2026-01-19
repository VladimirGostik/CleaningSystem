// src/modals/BulkEditInvoiceDatesModal.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BulkEditInvoiceDatesModal = ({ closeModal, onSubmit }) => {
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingMonth, setBillingMonth] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validácia - aspoň jedno pole musí byť vyplnené
    if (!issueDate && !dueDate && !billingMonth) {
      alert('Prosím vyplňte aspoň jedno pole.');
      return;
    }

    const updateData = {};
    if (issueDate) updateData.issue_date = issueDate;
    if (dueDate) updateData.due_date = dueDate;
    if (billingMonth) updateData.billing_month = billingMonth;

    onSubmit(updateData);
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mt-10 mb-10">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Upraviť dátumy faktúr</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="issueDate">
              Dátum vystavenia:
            </label>
            <input
              type="date"
              id="issueDate"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Ponechajte prázdne, ak nechcete zmeniť</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="dueDate">
              Dátum splatnosti:
            </label>
            <input
              type="date"
              id="dueDate"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Ponechajte prázdne, ak nechcete zmeniť</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="billingMonth">
              Fakturačný mesiac:
            </label>
            <input
              type="text"
              id="billingMonth"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              placeholder="napr. 12 alebo 12/2025"
            />
            <p className="text-xs text-gray-500 mt-1">Ponechajte prázdne, ak nechcete zmeniť</p>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
              onClick={closeModal}
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Potvrdiť
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

BulkEditInvoiceDatesModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default BulkEditInvoiceDatesModal;
