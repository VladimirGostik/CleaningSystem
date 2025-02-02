import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getCompanies, getResidentialCompanies } from '../services/companyService';

const FilterInput = ({ onFilter }) => {
  const [invoiceName, setInvoiceName] = useState('');
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [residentialCompaniesOptions, setResidentialCompaniesOptions] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedResidentialCompanies, setSelectedResidentialCompanies] = useState([]);

  useEffect(() => {
    // Fetch companies and residential companies to populate the options
    const fetchCompanies = async () => {
      try {
        const companies = await getCompanies();
        const residentialCompanies = await getResidentialCompanies();

        setCompaniesOptions(companies.map(company => ({
          value: company.company_name,
          label: company.company_name,
        })));

        setResidentialCompaniesOptions(residentialCompanies.map(company => ({
          value: company.company_name,
          label: company.company_name,
        })));
      } catch (error) {
        console.error('Error fetching companies for filter:', error);
      }
    };

    fetchCompanies();
  }, []);

  const handleFilterChange = () => {
    onFilter({
      invoiceName,
      companies: selectedCompanies.map(option => option.value),
      residentialCompanies: selectedResidentialCompanies.map(option => option.value),
    });
  };

  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <input
          type="text"
          placeholder="Názov faktúry"
          value={invoiceName}
          onChange={(e) => setInvoiceName(e.target.value)}
          className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <Select
          isMulti
          options={companiesOptions}
          value={selectedCompanies}
          onChange={(selected) => setSelectedCompanies(selected)}
          placeholder="Vyberte spoločnosti"
          className="w-full focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <Select
          isMulti
          options={residentialCompaniesOptions}
          value={selectedResidentialCompanies}
          onChange={(selected) => setSelectedResidentialCompanies(selected)}
          placeholder="Vyberte bytové podniky"
          className="w-full focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
      <div className="flex justify-center mt-2">
        <button
          type="button"
          className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition duration-300"
          onClick={handleFilterChange}
        >
          Filtrovať
        </button>
      </div>
    </div>
  );
};

export default FilterInput;
