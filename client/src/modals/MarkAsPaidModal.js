// src/modals/MarkAsPaidModal.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MarkAsPaidModal = ({ closeModal, onSubmit }) => {
  const [paymentDate, setPaymentDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentDate) {
      alert('Prosím vyberte dátum platby.');
      return;
    }
    onSubmit(paymentDate);
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mt-10 mb-10">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Označiť ako zaplatená</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-green-700 mb-2" htmlFor="paymentDate">
              Dátum platby:
            </label>
            <input
              type="date"
              id="paymentDate"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
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
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Potvrdiť
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

MarkAsPaidModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default MarkAsPaidModal;
