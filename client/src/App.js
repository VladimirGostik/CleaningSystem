import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ProtectedRoute from './pages/ProtectedRoute';
import AuthProvider from './context/AuthContext';
import Invoices from './pages/Invoices';
import ResidentialCompanies from './pages/ResidentialCompanies';
import Expanses from './pages/Expanses';
import Employees from './pages/Employees';
import MonthlyInvoices from './pages/MonthlyInvoices';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monthly-invoices"
                element={
                  <ProtectedRoute>
                    <MonthlyInvoices/>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/residential-companies"
                element={
                  <ProtectedRoute>
                    <ResidentialCompanies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expanses"
                element={
                  <ProtectedRoute>
                    <Expanses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute>
                    <Employees />
                  </ProtectedRoute>
                }
              />
          <Route
            path="/employee-dashboard"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
          <ToastContainer />
      </AuthProvider>
    </Router>
  );
}
export default App;
