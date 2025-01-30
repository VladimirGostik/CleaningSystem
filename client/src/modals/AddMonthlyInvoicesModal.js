// src/modals/AddMonthlyInvoicesModal.js

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AddMonthlyInvoicesModal = ({ closeModal, onSubmit }) => {
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [status] = useState('created'); // Status is always 'created'

  const handleSubmit = (e) => {
    e.preventDefault();

    // Extract month number from billingMonth
    const billingMonthNumber = billingMonth ? parseInt(billingMonth.split('-')[1], 10) : null;

    if (!billingMonthNumber || isNaN(billingMonthNumber)) {
      alert('Prosím vyberte platný fakturačný mesiac.');
      return;
    }

    const data = {
      issue_date: issueDate,
      due_date: dueDate,
      billing_month: billingMonthNumber,
      payment_date: null, // Always null
      status: status,
    };

    onSubmit(data);
  };

  return (
    <div
      className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-auto"
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mt-10 mb-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-green-600">Pridať mesačné faktúry</h2>
          <button
            type="button"
            className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
            onClick={closeModal}
          >
            Zatvoriť
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Issue Date */}
          <div className="mb-4">
            <label className="block text-green-700 mb-2" htmlFor="issueDate">
              Dátum vystavenia:
            </label>
            <input
              type="date"
              id="issueDate"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>
          {/* Due Date */}
          <div className="mb-4">
            <label className="block text-green-700 mb-2" htmlFor="dueDate">
              Dátum splatnosti:
            </label>
            <input
              type="date"
              id="dueDate"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          {/* Billing Month */}
          <div className="mb-4">
            <label className="block text-green-700 mb-2" htmlFor="billingMonth">
              Fakturačný mesiac:
            </label>
            <input
              type="month"
              id="billingMonth"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              required
            />
          </div>
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-300"
            >
              Vytvoriť
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddMonthlyInvoicesModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default AddMonthlyInvoicesModal;
