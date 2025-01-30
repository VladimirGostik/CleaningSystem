import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginHandler } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginHandler(username, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-600">Prihlásenie</h2>
        {error && (
          <p className="mb-4 text-red-500 text-center">
            {error}
          </p>
        )}
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
          <div className="form-group mb-6">
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
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition duration-300"
          >
            Prihlásiť
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
