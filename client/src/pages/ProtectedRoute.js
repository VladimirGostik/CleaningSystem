import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="text-center mt-10 text-lg">Načítava sa...</div>; // ⏳ Čaká na načítanie
  }

  return user ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
