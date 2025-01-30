import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../layouts/AdminLayout';
import AddNewCompany from '../modals/AddNewCompany';
import { addResidentialCompany, getResidentialCompanies } from '../services/companyService';
import ResidentialCompanyItem from '../components/ResidentialCompanyItem';
import SearchInput from '../components/SearchInput';

const ResidentialCompanies = () => {
  const [showModal, setShowModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [expandedCompany, setExpandedCompany] = useState(null);

  const fetchCompanies = async () => {
    try {
      const companiesData = await getResidentialCompanies();
      setCompanies(companiesData);
      setFilteredCompanies(companiesData); // Initially set filtered companies to all companies
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (companyData) => {
    try {
      await addResidentialCompany({ ...companyData, type: 'residential-company' });
      setShowModal(false); // Close the modal after successful addition
      fetchCompanies(); // Refresh the companies list
      toast.success('Bytový podnik bol úspešne pridaný');
    } catch (error) {
      console.error('Error adding company:', error);
      toast.error('Chyba pri vytváraní bytového podniku');
    }
  };

  const handleToggleExpand = (companyId) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
  };

  const handleSearch = (searchTerm) => {
    if (searchTerm === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-2">
        <div className='flex items-center gap-2'>
          <img
            src="/images/home.png"
            alt="Home"
            className="w-6 h-6 rounded-full"
          />
          <h1 className='text-grey-600 text-2xl font-bold'>Bytové podniky</h1>
        </div>
        <button
          className='bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300'
          onClick={() => setShowModal(true)}
        >
          + Pridať bytový podnik
        </button>
      </div>

      <div className='bg-white w-full min-h-screen p-4 shadow-xl rounded-2xl'>
        <SearchInput onSearch={handleSearch} />

          {filteredCompanies.map((company) => (
            <ResidentialCompanyItem
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

export default ResidentialCompanies;