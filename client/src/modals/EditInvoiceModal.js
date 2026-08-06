// src/modals/EditInvoiceModal.js

import React, { useState, useEffect } from 'react';
import {
  getCompanies,
  getCompanyById,
  getResidentialCompanies,
  getResidentialCompanyById,
} from '../services/companyService';
import { getInvoiceById } from '../services/invoices';
import PropTypes from 'prop-types';
import axios from 'axios';

const EditInvoiceModal = ({ closeModal, onSubmit, onSaveAndSyncToMonthly, invoiceId }) => {
  const [invoiceName, setInvoiceName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedResidentialCompany, setSelectedResidentialCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [residentialCompanies, setResidentialCompanies] = useState([]);
  const [companyDetails, setCompanyDetails] = useState({});
  const [residentialCompanyDetails, setResidentialCompanyDetails] = useState({});
  const [descriptionAboveServices, setDescriptionAboveServices] = useState('');
  const [descriptionServices, setDescriptionServices] = useState('');
  const [services, setServices] = useState([{ name: '', quantity: '', price: '' }]);
  const [visible, setVisible] = useState(true);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [paymentDate, setpaymentDate] = useState('');
  const [status, setStatus] = useState('');
  const [idMonthlyInvoice, setIdMonthlyInvoice] = useState(null);

  useEffect(() => {
    // Load companies and residential companies
    const fetchCompaniesData = async () => {
      try {
        const companiesData = await getCompanies();
        const residentialCompaniesData = await getResidentialCompanies();
        setCompanies(companiesData);
        setResidentialCompanies(residentialCompaniesData);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchCompaniesData();
  }, []);

  useEffect(() => {
    // Fetch existing invoice data
    const fetchInvoiceData = async () => {
      try {
        const response = await getInvoiceById(invoiceId);
        const invoice = response;

        // Populate state variables with fetched data
        setInvoiceName(invoice.invoice_name || '');
        setSelectedCompany(invoice.id_company || '');
        setSelectedResidentialCompany(invoice.id_residential_company || '');
        setInvoiceNumber(invoice.invoice_number || '');
        setIssueDate(invoice.issue_date ? invoice.issue_date.slice(0, 10) : '');
        setDueDate(invoice.due_date ? invoice.due_date.slice(0, 10) : '');
        setDeliveryDate(invoice.delivery_date ? invoice.delivery_date.slice(0, 10) : '');
        setBillingMonth(invoice.billing_month ? String(invoice.billing_month) : '');
        setDescriptionAboveServices(invoice.description_above_services || '');
        setDescriptionServices(invoice.description_services || '');
        setpaymentDate(invoice.payment_date ? invoice.payment_date.slice(0, 10) : '');
        setStatus(invoice.status || '');
        setCompanyDetails({
          company_name: invoice.company_name || '',
          company_address: invoice.company_address || '',
          city: invoice.city || '',
          postal_code: invoice.postal_code || '',
          ico: invoice.company_ico || '',
          dic: invoice.company_dic || '',
          company_iban: invoice.company_iban || '',
          bank_connection: invoice.bank_connection || '',
        });
        setResidentialCompanyDetails({
          header1: invoice.header1 || '',
          header2: invoice.header2 || '',
          header3: invoice.header3 || '',
          header4: invoice.header4 || '',
          residential_company_name: invoice.residential_company_name || '',
          residential_company_address: invoice.residential_company_address || '',
          residential_city: invoice.residential_city || '',
          residential_postal_code: invoice.residential_postal_code || '',
          ico: invoice.residential_company_ico || '',
          dic: invoice.residential_company_dic || '',
          iban: invoice.residential_company_iban || '',
        });
        setServices(
          invoice.services.map((service) => ({
            name: service.name,
            quantity: service.quantity,
            price: service.price,
          })) || [{ name: '', quantity: '', price: '' }]
        );
        setIdMonthlyInvoice(invoice.id_monthly_invoice ?? null);
      } catch (error) {
        console.error('Error fetching invoice data:', error);
      }
    };

    fetchInvoiceData();
  }, [invoiceId]);

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...services];
    updatedServices[index][field] = value;
    setServices(updatedServices);
  };

  const addService = () => {
    setServices([...services, { name: '', quantity: '', price: '' }]);
  };

  const removeService = (index) => {
    const updatedServices = services.filter((_, i) => i !== index);
    setServices(updatedServices);
  };

  const handleCompanyDetailChange = (field, value) => {
    setCompanyDetails({ ...companyDetails, [field]: value });
  };

  const handleResidentialCompanyDetailChange = (field, value) => {
    setResidentialCompanyDetails({ ...residentialCompanyDetails, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Get month number directly (it's already a number 1-12)
    const billingMonthNumber = billingMonth ? parseInt(billingMonth, 10) : null;

    if (!billingMonthNumber || isNaN(billingMonthNumber) || billingMonthNumber < 1 || billingMonthNumber > 12) {
      alert('Prosím vyberte platný fakturačný mesiac (1-12).');
      return;
    }

    const invoiceData = {
      invoice_name: invoiceName,
      id_company: selectedCompany,
      id_residential_company: selectedResidentialCompany,
      company_name: companyDetails.company_name || null,
      company_address: companyDetails.company_address || null,
      city: companyDetails.city || null,
      postal_code: companyDetails.postal_code || null,
      company_ico: companyDetails.ico || null,
      company_dic: companyDetails.dic || null,
      company_ic_dph: companyDetails.company_ic_dph || null,
      company_iban: companyDetails.company_iban || null,
      bank_connection: companyDetails.bank_connection || null,
      header1: residentialCompanyDetails.header1 || null,
      header2: residentialCompanyDetails.header2 || null,
      header3: residentialCompanyDetails.header3 || null,
      header4: residentialCompanyDetails.header4 || null,
      residential_company_name: residentialCompanyDetails.residential_company_name || null,
      residential_company_address: residentialCompanyDetails.residential_company_address || null,
      residential_city: residentialCompanyDetails.residential_city || null,
      residential_postal_code: residentialCompanyDetails.residential_postal_code || null,
      residential_company_ico: residentialCompanyDetails.ico || null,
      residential_company_dic: residentialCompanyDetails.dic || null,
      residential_company_ic_dph: residentialCompanyDetails.residential_company_ic_dph || null,
      residential_company_iban: residentialCompanyDetails.iban || null,
      residential_bank_connection: residentialCompanyDetails.bank_connection || null,
      description_above_services: descriptionAboveServices || null,
      description_services: descriptionServices || null,
      invoice_number: invoiceNumber || null,
      issue_date: issueDate || null,
      payment_date: paymentDate || null,
      due_date: dueDate || null,
      delivery_date: deliveryDate || null,
      billing_month: billingMonthNumber,
      status: status,
    };

    const servicesData = services.map((service) => ({
      name: service.name,
      quantity: parseInt(service.quantity, 10),
      price: parseFloat(service.price),
    }));

    const dataToSend = { ...invoiceData, services: servicesData };
    onSubmit(invoiceId, dataToSend);
  };

  const buildPayload = () => {
    const billingMonthNumber = billingMonth ? parseInt(billingMonth, 10) : null;
    if (!billingMonthNumber || isNaN(billingMonthNumber) || billingMonthNumber < 1 || billingMonthNumber > 12) {
      return null;
    }
    const invoiceData = {
      invoice_name: invoiceName,
      id_company: selectedCompany,
      id_residential_company: selectedResidentialCompany,
      company_name: companyDetails.company_name || null,
      company_address: companyDetails.company_address || null,
      city: companyDetails.city || null,
      postal_code: companyDetails.postal_code || null,
      company_ico: companyDetails.ico || null,
      company_dic: companyDetails.dic || null,
      company_ic_dph: companyDetails.company_ic_dph || null,
      company_iban: companyDetails.company_iban || null,
      bank_connection: companyDetails.bank_connection || null,
      header1: residentialCompanyDetails.header1 || null,
      header2: residentialCompanyDetails.header2 || null,
      header3: residentialCompanyDetails.header3 || null,
      header4: residentialCompanyDetails.header4 || null,
      residential_company_name: residentialCompanyDetails.residential_company_name || null,
      residential_company_address: residentialCompanyDetails.residential_company_address || null,
      residential_city: residentialCompanyDetails.residential_city || null,
      residential_postal_code: residentialCompanyDetails.residential_postal_code || null,
      residential_company_ico: residentialCompanyDetails.ico || null,
      residential_company_dic: residentialCompanyDetails.dic || null,
      residential_company_ic_dph: residentialCompanyDetails.residential_company_ic_dph || null,
      residential_company_iban: residentialCompanyDetails.iban || null,
      residential_bank_connection: residentialCompanyDetails.bank_connection || null,
      description_above_services: descriptionAboveServices || null,
      description_services: descriptionServices || null,
      invoice_number: invoiceNumber || null,
      issue_date: issueDate || null,
      payment_date: paymentDate || null,
      due_date: dueDate || null,
      delivery_date: deliveryDate || null,
      billing_month: billingMonthNumber,
      status: status,
    };
    const servicesData = services.map((s) => ({
      name: s.name,
      quantity: parseInt(s.quantity, 10),
      price: parseFloat(s.price),
    }));
    return { ...invoiceData, services: servicesData };
  };

  const handleSaveAndSyncToMonthlyClick = () => {
    const dataToSend = buildPayload();
    if (!dataToSend) {
      alert('Prosím vyberte platný fakturačný mesiac (1-12).');
      return;
    }
    if (onSaveAndSyncToMonthly) onSaveAndSyncToMonthly(invoiceId, dataToSend);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      closeModal();
    }, 500);
  };

  return (
    <div
      className={`fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-500 overflow-auto ${visible ? 'opacity-100' : 'opacity-0'
        }`}
    >
      <div
        className={`bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl transform transition-transform duration-500 max-h-screen overflow-y-auto mt-10 mb-10 ${visible ? 'scale-100' : 'scale-75'
          }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-green-600">Upraviť faktúru</h2>
          <button
            type="button"
            className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
            onClick={handleClose}
          >
            Zatvoriť
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Top Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            {/* Invoice Name */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="invoiceName">
                Názov faktúry:
              </label>
              <input
                type="text"
                id="invoiceName"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
                required
              />
            </div>
            {/* Select Company */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="selectCompany">
                Vybrať spoločnosť:
              </label>
              <select
                id="selectCompany"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={selectedCompany}
                onChange={async (e) => {
                  const newCompanyId = e.target.value;
                  setSelectedCompany(newCompanyId);

                  // Fetch company details immediately
                  if (newCompanyId) {
                    try {
                      const company = await getCompanyById(newCompanyId);
                      const transformedCompany = {
                        company_name: company.company_name,
                        company_address: company.company_address,
                        city: company.city,
                        postal_code: company.postal_code,
                        ico: company.company_ico,
                        dic: company.company_dic,
                        company_iban: company.company_iban,
                        bank_connection: company.bank_connection,
                      };
                      setCompanyDetails(transformedCompany);
                    } catch (error) {
                      console.error('Error fetching company details:', error);
                    }
                  }
                }}
                required
              >
                <option value="">-- Vyberte spoločnosť --</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>
            {/* Select Residential Company */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="selectResidentialCompany">
                Vybrať bytový podnik:
              </label>
              <select
                id="selectResidentialCompany"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={selectedResidentialCompany}
                onChange={async (e) => {
                  const newResidentialCompanyId = e.target.value;
                  setSelectedResidentialCompany(newResidentialCompanyId);

                  // Fetch residential company details immediately
                  if (newResidentialCompanyId) {
                    try {
                      const residentialCompany = await getResidentialCompanyById(newResidentialCompanyId);
                      const transformedResidentialCompany = {
                        header1: residentialCompany.header1,
                        header2: residentialCompany.header2,
                        header3: residentialCompany.header3,
                        header4: residentialCompany.header4,
                        residential_company_name: residentialCompany.company_name,
                        residential_company_address: residentialCompany.company_address,
                        residential_city: residentialCompany.city,
                        residential_postal_code: residentialCompany.postal_code,
                        ico: residentialCompany.company_ico,
                        dic: residentialCompany.company_dic,
                        iban: residentialCompany.company_iban,
                      };
                      setResidentialCompanyDetails(transformedResidentialCompany);
                    } catch (error) {
                      console.error('Error fetching residential company details:', error);
                    }
                  }
                }}
                required
              >
                <option value="">-- Vyberte bytový podnik --</option>
                {residentialCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoice Number and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            {/* Invoice Number */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="invoiceNumber">
                Číslo faktúry:
              </label>
              <input
                type="text"
                id="invoiceNumber"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>
            {/* Issue Date */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="issueDate">
                Dátum vystavenia:
              </label>
              <input
                type="date"
                id="issueDate"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>
            {/* Due Date */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="dueDate">
                Dátum splatnosti:
              </label>
              <input
                type="date"
                id="dueDate"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            {/* Billing Month */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="billingMonth">
                Fakturačný mesiac (1-12):
              </label>
              <select
                id="billingMonth"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                required
              >
                <option value="">-- Vyberte mesiac --</option>
                <option value="1">Január (1)</option>
                <option value="2">Február (2)</option>
                <option value="3">Marec (3)</option>
                <option value="4">Apríl (4)</option>
                <option value="5">Máj (5)</option>
                <option value="6">Jún (6)</option>
                <option value="7">Júl (7)</option>
                <option value="8">August (8)</option>
                <option value="9">September (9)</option>
                <option value="10">Október (10)</option>
                <option value="11">November (11)</option>
                <option value="12">December (12)</option>
              </select>
            </div>
            {/* Delivery Date */}
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="deliveryDate">
                Dátum dodania:
              </label>
              <input
                type="date"
                id="deliveryDate"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Company Details */}
          {/* Company Details Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
            {/* Left Box - Company Details */}
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-semibold mb-4">Údaje spoločnosti</h3>
              {/* ... Vaše polia pre údaje spoločnosti */}
              {/* Názov spoločnosti */}
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="companyName">
                  Názov spoločnosti:
                </label>
                <input
                  type="text"
                  id="companyName"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={companyDetails.company_name || ''}
                  onChange={(e) => handleCompanyDetailChange('company_name', e.target.value)}
                />
              </div>
              {/* Adresa spoločnosti */}
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="companyAddress">
                  Adresa spoločnosti:
                </label>
                <input
                  type="text"
                  id="companyAddress"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={companyDetails.company_address || ''}
                  onChange={(e) => handleCompanyDetailChange('company_address', e.target.value)}
                />
              </div>
              {/* Mesto a PSČ */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-green-700 mb-2" htmlFor="city">
                    Mesto:
                  </label>
                  <input
                    type="text"
                    id="city"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={companyDetails.city || ''}
                    onChange={(e) => handleCompanyDetailChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-green-700 mb-2" htmlFor="postalCode">
                    PSČ:
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={companyDetails.postal_code || ''}
                    onChange={(e) => handleCompanyDetailChange('postal_code', e.target.value)}
                  />
                </div>
              </div>
              {/* IČO a DIČ */}
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="ico">
                  IČO:
                </label>
                <input
                  type="text"
                  id="ico"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={companyDetails.ico || ''}
                  onChange={(e) => handleCompanyDetailChange('ico', e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="dic">
                  DIČ:
                </label>
                <input
                  type="text"
                  id="dic"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={companyDetails.dic || ''}
                  onChange={(e) => handleCompanyDetailChange('dic', e.target.value)}
                />
              </div>
            </div>

            {/* Right Box - Residential Company Details */}
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-semibold mb-4">Údaje bytového podniku</h3>
              {/* Header1 až Header4 */}
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="header1">
                  Hlavička 1:
                </label>
                <input
                  type="text"
                  id="header1"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.header1 || ''}
                  onChange={(e) => handleResidentialCompanyDetailChange('header1', e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="header2">
                  Hlavička 2:
                </label>
                <input
                  type="text"
                  id="header2"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.header2 || ''}
                  onChange={(e) => handleResidentialCompanyDetailChange('header2', e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="header3">
                  Hlavička 3:
                </label>
                <input
                  type="text"
                  id="header3"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.header3 || ''}
                  onChange={(e) => handleResidentialCompanyDetailChange('header3', e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="header4">
                  Hlavička 4:
                </label>
                <input
                  type="text"
                  id="header4"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.header4 || ''}
                  onChange={(e) => handleResidentialCompanyDetailChange('header4', e.target.value)}
                />
              </div>
              {/* Názov rezidenčnej spoločnosti */}
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="residentialCompanyName">
                  Názov bytového podniku:
                </label>
                <input
                  type="text"
                  id="residentialCompanyName"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.residential_company_name || ''}
                  onChange={(e) =>
                    handleResidentialCompanyDetailChange('residential_company_name', e.target.value)
                  }
                />
              </div>
              {/* Adresa rezidenčnej spoločnosti */}
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="residentialCompanyAddress">
                  Adresa bytového podniku:
                </label>
                <input
                  type="text"
                  id="residentialCompanyAddress"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.residential_company_address || ''}
                  onChange={(e) =>
                    handleResidentialCompanyDetailChange(
                      'residential_company_address',
                      e.target.value
                    )
                  }
                />
              </div>
              {/* Mesto a PSČ */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-green-700 mb-2" htmlFor="residentialCity">
                    Mesto:
                  </label>
                  <input
                    type="text"
                    id="residentialCity"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={residentialCompanyDetails.residential_city || ''}
                    onChange={(e) =>
                      handleResidentialCompanyDetailChange('residential_city', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-green-700 mb-2" htmlFor="residentialPostalCode">
                    PSČ:
                  </label>
                  <input
                    type="text"
                    id="residentialPostalCode"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={residentialCompanyDetails.residential_postal_code || ''}
                    onChange={(e) =>
                      handleResidentialCompanyDetailChange(
                        'residential_postal_code',
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
              {/* IČO a DIČ */}
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="residentialIco">
                  IČO:
                </label>
                <input
                  type="text"
                  id="residentialIco"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.ico || ''}
                  onChange={(e) => handleResidentialCompanyDetailChange('ico', e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="residentialDic">
                  DIČ:
                </label>
                <input
                  type="text"
                  id="residentialDic"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.dic || ''}
                  onChange={(e) => handleResidentialCompanyDetailChange('dic', e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block text-green-700 mb-2" htmlFor="residentialIban">
                  Iban:
                </label>
                <input
                  type="text"
                  id="residentialIban"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={residentialCompanyDetails.iban || ''}
                  onChange={(e) => handleResidentialCompanyDetailChange('iban', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-4 border rounded-md mb-6">
            <h3 className="text-lg font-semibold mb-4">Platobné údaje</h3>
            {/* IBAN spoločnosti */}
            <div className="mb-2">
              <label className="block text-green-700 mb-2" htmlFor="companyIban">
                IBAN spoločnosti:
              </label>
              <input
                type="text"
                id="companyIban"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyDetails.company_iban || ''}
                onChange={(e) => handleCompanyDetailChange('company_iban', e.target.value)}
              />
            </div>
            {/* Bankové spojenie */}
            <div className="mb-2">
              <label className="block text-green-700 mb-2" htmlFor="bankConnection">
                Bankové spojenie:
              </label>
              <input
                type="text"
                id="bankConnection"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyDetails.bank_connection || ''}
                onChange={(e) => handleCompanyDetailChange('bank_connection', e.target.value)}
              />
            </div>
            {/* Forma úhrady */}
            <div className="mb-2">
              <label className="block text-green-700 mb-2" >
                Forma úhrady:
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={'Prevodom'}
                readOnly
              />
            </div>
          </div>

          {/* Description Above Services */}
          <div className="mb-6">
            <label className="block text-green-700 mb-2" htmlFor="descriptionAboveServices">
              Popis nad službami:
            </label>
            <textarea
              id="descriptionAboveServices"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={descriptionAboveServices}
              onChange={(e) => setDescriptionAboveServices(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          {/* Services Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Popis služby</th>
                  <th className="border p-2 text-left">Množstvo</th>
                  <th className="border p-2 text-left">Cena služby</th>
                  <th className="border p-2 text-left">Akcie</th>
                </tr>
              </thead>
              <tbody>
                {/* Description Services Row */}
                <tr>
                  <td colSpan="4" className="border p-2">
                    <label className="block text-green-700 mb-2" htmlFor="descriptionServices">
                      Popis služieb:
                    </label>
                    <input
                      type="text"
                      id="descriptionServices"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                      value={descriptionServices}
                      onChange={(e) => setDescriptionServices(e.target.value)}
                    />
                  </td>
                </tr>
                {/* Services Rows */}
                {services.map((service, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                        required
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        value={service.quantity}
                        onChange={(e) => handleServiceChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                        required
                      />
                    </td>
                    <td className="border p-2">
                      <button
                        type="button"
                        className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                        onClick={() => removeService(index)}
                      >
                        Odstrániť
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <button
                type="button"
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                onClick={addService}
              >
                Pridať službu
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <button
              type="button"
              className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
              onClick={handleClose}
            >
              Zavrieť
            </button>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-300"
              >
                Uložiť
              </button>
              {idMonthlyInvoice && onSaveAndSyncToMonthly && (
                <button
                  type="button"
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
                  onClick={handleSaveAndSyncToMonthlyClick}
                >
                  Uložiť a zmeniť v mesačnej faktúre
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

EditInvoiceModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSaveAndSyncToMonthly: PropTypes.func,
  invoiceId: PropTypes.number.isRequired,
};

export default EditInvoiceModal;
