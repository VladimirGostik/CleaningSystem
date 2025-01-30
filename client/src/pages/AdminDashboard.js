import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../layouts/AdminLayout';
import AddNewCompany from '../modals/AddNewCompany';
import { addCompany, getCompanies } from '../services/companyService';
import CompanyItem from '../components/CompanyItem';

const AdminDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [expandedCompany, setExpandedCompany] = useState(null);

  const fetchCompanies = async () => {
    try {
      const companiesData = await getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (companyData) => {
    try {
      await addCompany({ ...companyData, type: 'company' });
      setShowModal(false); // Close the modal after successful addition
      fetchCompanies(); // Refresh the companies list
      toast.success('Firma bola úspešne pridaná');
    } catch (error) {
      console.error('Error adding company:', error);
      toast.error('Chyba pri vytváraní firmy');
    }
  };

  const handleToggleExpand = (companyId) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-2">
        <div className='flex items-center gap-2'>
          <img
            src="/images/graph.png"
            alt="Graph"
            className="w-6 h-6 rounded-full"
          />
          <h1 className='text-grey-600 text-2xl font-bold'>Prehľad</h1>
        </div>
        <button
          className='bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300'
          onClick={() => setShowModal(true)}
        >
          + Pridať firmu
        </button>
      </div>
      <div className='bg-white w-full min-h-screen p-4 shadow-xl rounded-2xl'>
        {companies.map((company) => (
          <CompanyItem
            key={company.id}
            company={company}
            expandedCompany={expandedCompany}
            handleToggleExpand={handleToggleExpand}
            fetchCompanies={fetchCompanies} // Add this prop to refresh companies list
          />
        ))}
      </div>

      {showModal && (
        <AddNewCompany closeModal={() => setShowModal(false)} onSubmit={handleAddCompany} />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
