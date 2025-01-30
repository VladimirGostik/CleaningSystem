import React, { useState, useEffect } from 'react';
import { register } from '../services/authService';

const AddNewModal = ({ closeModal }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Spustenie animácie pri otvorení
    setVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, password, role);
      handleClose(); // Zatvorí modal po úspešnom odoslaní údajov
    } catch (error) {
      console.error('Error adding new user:', error);
    }
  };

  const handleClose = () => {
    // Nastavenie viditeľnosti pre zatváraciu animáciu
    setVisible(false);
    setTimeout(() => {
      closeModal();
    }, 500); // Dĺžka animácie zatvorenia
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white p-6 rounded-lg shadow-lg w-full max-w-md transform transition-transform duration-500 ${
          visible ? 'scale-100' : 'scale-75'
        }`}
      >
        <h2 className="text-2xl font-bold mb-4 text-green-600">Pridať nového používateľa</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="block text-green-700 mb-2" htmlFor="username">
              Meno:
            </label>
            <input
              type="text"
              id="username"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-4">
            <label className="block text-green-700 mb-2" htmlFor="password">
              Heslo:
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-6">
            <label className="block text-green-700 mb-2" htmlFor="role">
              Pozícia:
            </label>
            <select
              id="role"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="employee">Zamestnanec</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
              onClick={handleClose}
            >
              Zavrieť
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-300"
            >
              Pridať
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewModal;
