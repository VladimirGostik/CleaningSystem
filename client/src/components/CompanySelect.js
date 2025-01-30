// src/components/CompanySelect.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const CompanySelect = ({ onChange }) => {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/companies');
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  const handleSelectChange = (e) => {
    const companyId = e.target.value;
    setSelected(companyId);
    onChange(companyId);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="company" className="font-semibold">Firma:</label>
      <select
        id="company"
        value={selected}
        onChange={handleSelectChange}
        className="border border-gray-300 rounded-md py-1"
      >
        <option value="">Všetky</option>
        {companies.map(company => (
          <option key={company.id} value={company.id}>{company.company_name}</option>
        ))}
      </select>
    </div>
  );
};

CompanySelect.propTypes = {
  onChange: PropTypes.func.isRequired,
};

export default CompanySelect;
