// src/components/InvoiceFilter.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { getCompanies, getResidentialCompanies } from '../services/companyService';

const InvoiceFilter = ({ invoices, onFilter }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [residentialCompanyOptions, setResidentialCompanyOptions] = useState([]);
  const [selectedResidentialCompanies, setSelectedResidentialCompanies] = useState([]);
  const [statusOptions] = useState([
    { value: '', label: 'Všetky' },
    { value: 'created', label: 'Vytvorená' },
    { value: 'sent', label: 'Odoslaná' },
    { value: 'paid', label: 'Zaplatená' },
    { value: 'expired', label: 'Po splatnosti' },
  ]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [totalPriceFrom, setTotalPriceFrom] = useState('');
  const [totalPriceTo, setTotalPriceTo] = useState('');
  const [issueDateFrom, setIssueDateFrom] = useState('');
  const [issueDateTo, setIssueDateTo] = useState('');

  // Extract unique company IDs and names based on type
  useEffect(() => {
    // Fetch companies and residential companies to populate the options
    const fetchCompanies = async () => {
      try {
        const companies = await getCompanies();
        const residentialCompanies = await getResidentialCompanies();

        setCompanyOptions(companies.map(company => ({
            value: company.id,
            label: company.company_name,
        })));

        setResidentialCompanyOptions(residentialCompanies.map(company => ({
            value: company.id,
            label: company.company_name,
        })));
      } catch (error) {
        console.error('Error fetching companies for filter:', error);
      }
    };

    fetchCompanies();
  }, []);
  // Handle filter changes
  useEffect(() => {
    const filters = {
      invoice_number: invoiceNumber.trim(),
      company_ids: selectedCompanies.map((company) => company.value),
      residential_company_ids: selectedResidentialCompanies.map((company) => company.value),
      status: selectedStatus,
      total_price_from: totalPriceFrom.trim(),
      total_price_to: totalPriceTo.trim(),
      issue_date_from: issueDateFrom,
      issue_date_to: issueDateTo,
    };

    onFilter(filters);
  }, [
    invoiceNumber,
    selectedCompanies,
    selectedResidentialCompanies,
    selectedStatus,
    totalPriceFrom,
    totalPriceTo,
    issueDateFrom,
    issueDateTo,
    onFilter,
  ]);

  return (
    <div className=" mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Invoice Number */}
        <div>
          <label className="block text-gray-700 mb-2" htmlFor="invoiceNumber">
            Číslo faktúry:
          </label>
          <input
            type="text"
            id="invoiceNumber"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Zadajte číslo faktúry"
          />
        </div>

        {/* Company Name Multi-Select */}
        <div>
          <label className="block text-gray-700 mb-2">
            Názov spoločnosti:
          </label>
          <Select
            isMulti
            options={companyOptions}
            value={selectedCompanies}
            onChange={setSelectedCompanies}
            placeholder="Vyberte spoločnosti"
          />
        </div>

        {/* Residential Company Name Multi-Select */}
        <div>
          <label className="block text-gray-700 mb-2">
            Názov bytového podniku:
          </label>
          <Select
            isMulti
            options={residentialCompanyOptions}
            value={selectedResidentialCompanies}
            onChange={setSelectedResidentialCompanies}
            placeholder="Vyberte bytové podniky"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Status Select */}
        <div>
          <label className="block text-gray-700 mb-2">
            Status:
          </label>
          <Select
            options={statusOptions}
            value={
              statusOptions.find((option) => option.value === selectedStatus) || statusOptions[0]
            }
            onChange={(option) => setSelectedStatus(option ? option.value : '')}
            placeholder="Vyberte status"
            isClearable
          />
        </div>

        {/* Total Price Range */}
        <div>
          <label className="block text-gray-700 mb-2">
            Celková cena (od - do):
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              className="w-1/2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Od"
              value={totalPriceFrom}
              onChange={(e) => setTotalPriceFrom(e.target.value)}
            />
            <input
              type="number"
              min="0"
              className="w-1/2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Do"
              value={totalPriceTo}
              onChange={(e) => setTotalPriceTo(e.target.value)}
            />
          </div>
        </div>

        {/* Issue Date Range */}
        <div>
          <label className="block text-gray-700 mb-2">
            Dátum vystavenia (od - do):
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              className="w-1/2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={issueDateFrom}
              onChange={(e) => setIssueDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="w-1/2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={issueDateTo}
              onChange={(e) => setIssueDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

InvoiceFilter.propTypes = {
  invoices: PropTypes.array.isRequired,
  onFilter: PropTypes.func.isRequired,
};

export default InvoiceFilter;
