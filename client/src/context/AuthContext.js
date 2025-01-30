import React, { createContext, useState, useEffect } from 'react';
import { login, logout, getProfile } from '../services/authService'; 
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await getProfile(); // Získa údaje o používateľovi
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          logoutHandler(); // Ak je token neplatný, odhlásiť používateľa
        }
      }
    };

    fetchUser();
  }, [token]);

  const loginHandler = async (username, password) => {
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);

      const decodedUser = jwtDecode(data.token);
      setUser(decodedUser);

      if (decodedUser.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (decodedUser.role === 'employee') {
        navigate('/employee-dashboard');
      }
    } catch (error) {
      throw new Error('Invalid username or password');
    }
  };

  const logoutHandler = () => {
    logout();
    setToken(null);
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loginHandler, logoutHandler }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
