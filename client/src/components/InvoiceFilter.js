// src/components/InvoiceFilter.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { getCompanies, getResidentialCompanies } from '../services/companyService';

const STORAGE_KEY = 'invoiceFilters';

const InvoiceFilter = ({ invoices, onFilter }) => {
  // Load saved filters from localStorage or use defaults
  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
    return {
      invoiceNumber: '',
      invoiceName: '',
      selectedCompanies: [],
      selectedResidentialCompanies: [],
      selectedStatus: '',
      totalPriceFrom: '',
      totalPriceTo: '',
      issueDateFrom: '',
      issueDateTo: '',
    };
  };

  const savedFilters = loadSavedFilters();

  const [invoiceNumber, setInvoiceNumber] = useState(savedFilters.invoiceNumber);
  const [invoiceName, setInvoiceName] = useState(savedFilters.invoiceName || '');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState(savedFilters.selectedCompanies);
  const [residentialCompanyOptions, setResidentialCompanyOptions] = useState([]);
  const [selectedResidentialCompanies, setSelectedResidentialCompanies] = useState(savedFilters.selectedResidentialCompanies);
  const [statusOptions] = useState([
    { value: '', label: 'Všetky' },
    { value: 'created', label: 'Vytvorená' },
    { value: 'sent', label: 'Odoslaná' },
    { value: 'paid', label: 'Zaplatená' },
    { value: 'expired', label: 'Po splatnosti' },
  ]);
  const [selectedStatus, setSelectedStatus] = useState(savedFilters.selectedStatus);
  const [totalPriceFrom, setTotalPriceFrom] = useState(savedFilters.totalPriceFrom);
  const [totalPriceTo, setTotalPriceTo] = useState(savedFilters.totalPriceTo);
  const [issueDateFrom, setIssueDateFrom] = useState(savedFilters.issueDateFrom);
  const [issueDateTo, setIssueDateTo] = useState(savedFilters.issueDateTo);

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

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filtersToSave = {
      invoiceNumber,
      invoiceName,
      selectedCompanies,
      selectedResidentialCompanies,
      selectedStatus,
      totalPriceFrom,
      totalPriceTo,
      issueDateFrom,
      issueDateTo,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [
    invoiceNumber,
    invoiceName,
    selectedCompanies,
    selectedResidentialCompanies,
    selectedStatus,
    totalPriceFrom,
    totalPriceTo,
    issueDateFrom,
    issueDateTo,
  ]);

  // Handle filter changes
  useEffect(() => {
    const filters = {
      invoice_number: invoiceNumber.trim(),
      invoice_name: invoiceName.trim(),
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
    invoiceName,
    selectedCompanies,
    selectedResidentialCompanies,
    selectedStatus,
    totalPriceFrom,
    totalPriceTo,
    issueDateFrom,
    issueDateTo,
    onFilter,
  ]);

  // Reset all filters
  const handleResetFilters = () => {
    setInvoiceNumber('');
    setInvoiceName('');
    setSelectedCompanies([]);
    setSelectedResidentialCompanies([]);
    setSelectedStatus('');
    setTotalPriceFrom('');
    setTotalPriceTo('');
    setIssueDateFrom('');
    setIssueDateTo('');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className=" mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-700">Filtre faktúr</h3>
        <button
          onClick={handleResetFilters}
          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-300 text-sm"
        >
          Vymazať filtre
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Invoice Number */}
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="invoiceNumber">
            Číslo faktúry:
          </label>
          <input
            type="text"
            id="invoiceNumber"
            className="w-full p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Napríklad: 20260001"
          />
        </div>

        {/* Invoice Name */}
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="invoiceName">
            Názov faktúry:
          </label>
          <input
            type="text"
            id="invoiceName"
            className="w-full p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            value={invoiceName}
            onChange={(e) => setInvoiceName(e.target.value)}
            placeholder="Napríklad: Úklid, Rehabilitácia..."
          />
        </div>

        {/* Company Name Multi-Select */}
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">
            Názov spoločnosti:
          </label>
          <Select
            isMulti
            options={companyOptions}
            value={selectedCompanies}
            onChange={setSelectedCompanies}
            placeholder="Vyberte spoločnosti"
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '32px',
                fontSize: '14px',
              }),
            }}
          />
        </div>

        {/* Residential Company Name Multi-Select */}
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">
            Názov bytového podniku:
          </label>
          <Select
            isMulti
            options={residentialCompanyOptions}
            value={selectedResidentialCompanies}
            onChange={setSelectedResidentialCompanies}
            placeholder="Vyberte bytové podniky"
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '32px',
                fontSize: '14px',
              }),
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {/* Status Select */}
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">
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
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '32px',
                fontSize: '14px',
              }),
            }}
          />
        </div>

        {/* Total Price Range */}
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">
            Celková cena (od - do):
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              className="w-1/2 p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Od"
              value={totalPriceFrom}
              onChange={(e) => setTotalPriceFrom(e.target.value)}
            />
            <input
              type="number"
              min="0"
              className="w-1/2 p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Do"
              value={totalPriceTo}
              onChange={(e) => setTotalPriceTo(e.target.value)}
            />
          </div>
        </div>

        {/* Issue Date Range */}
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">
            Dátum vystavenia (od - do):
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              className="w-1/2 p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={issueDateFrom}
              onChange={(e) => setIssueDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="w-1/2 p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
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
