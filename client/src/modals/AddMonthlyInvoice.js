import React, { useState, useEffect } from 'react';
import { getCompanies, getCompanyById, getResidentialCompanies, getResidentialCompanyById  } from '../services/companyService';

const AddMonthlyInvoice = ({ closeModal, onSubmit }) => {
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

  useEffect(() => {
    // Načítanie zoznamu spoločností a rezidenčných spoločností
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
    // Načítanie detailov vybranej spoločnosti
    const fetchCompanyDetails = async () => {
      if (selectedCompany) {
        try {
          const company = await getCompanyById(selectedCompany);
          // Transformácia kľúčov
          const transformedCompany = {
            company_name: company.company_name,
            company_address: company.company_address,
            city: company.city,
            postal_code: company.postal_code,
            ico: company.company_ico,
            dic: company.company_dic,
            company_iban: company.company_iban,
            bank_connection: company.bank_connection,
            payment_method: company.payment_method || 'Prevodom',
          };
          setCompanyDetails(transformedCompany);
        } catch (error) {
          console.error('Chyba pri načítaní detailov spoločnosti:', error);
        }
      }
    };
    fetchCompanyDetails();
  }, [selectedCompany]);
  
  useEffect(() => {
    // Načítanie detailov vybranej rezidenčnej spoločnosti
    const fetchResidentialCompanyDetails = async () => {
      if (selectedResidentialCompany) {
        try {
          const residentialCompany = await getResidentialCompanyById(selectedResidentialCompany);
          // Transformácia kľúčov
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
          console.error('Chyba pri načítaní detailov rezidenčnej spoločnosti:', error);
        }
      }
    };
    fetchResidentialCompanyDetails();
  }, [selectedResidentialCompany]);
  

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
  
    // Predpokladáme, že máte vybranú spoločnosť a rezidenčnú spoločnosť s ich ID
    // Napríklad, selectedCompany a selectedResidentialCompany sú ID vybraných spoločností
  
    const invoiceData = {
      invoice_name: invoiceName,
      id_company: selectedCompany, // ID vybratej spoločnosti
      id_residential_company: selectedResidentialCompany, // ID vybratej rezidenčnej spoločnosti
      company_name: companyDetails.company_name || null,
      company_address: companyDetails.company_address || null,
      city: companyDetails.city || null,
      postal_code: companyDetails.postal_code|| null,
      company_ico: companyDetails.ico || null, // Mapovanie 'ico' na 'company_ico'
      company_dic: companyDetails.dic || null, // Mapovanie 'dic' na 'company_dic'
      company_ic_dph: companyDetails.company_ic_dph || null, // Prípadne ďalšie polia
      company_iban: companyDetails.company_iban || null,
      bank_connection: companyDetails.bank_connection || null,
      payment_method: companyDetails.payment_method || 'Prevodom',
      header1: residentialCompanyDetails.header1 || null, // Prístup cez residentialCompanyDetails
      header2: residentialCompanyDetails.header2 || null, // Prístup cez residentialCompanyDetails
      header3: residentialCompanyDetails.header3 || null, // Prístup cez residentialCompanyDetails
      header4: residentialCompanyDetails.header4 || null, 
      residential_company_name: residentialCompanyDetails.residential_company_name || null,
      residential_company_address: residentialCompanyDetails.residential_company_address || null,
      residential_city: residentialCompanyDetails.residential_city || null,
      residential_postal_code: residentialCompanyDetails.residential_postal_code || null,
      residential_company_ico: residentialCompanyDetails.ico || null,// Mapovanie 'ico' na 'residential_company_ico'
      residential_company_dic: residentialCompanyDetails.dic || null, // Mapovanie 'dic' na 'residential_company_dic'
      residential_company_ic_dph: residentialCompanyDetails.residential_company_ic_dph || null, // Prípadne ďalšie polia
      residential_company_iban: residentialCompanyDetails.iban || null, // Mapovanie 'iban' na 'residential_company_iban'
      residential_bank_connection: residentialCompanyDetails.bank_connection || null, // Prípadne ďalšie polia
      description_above_services: descriptionAboveServices || null,
      description_services: descriptionServices || null,
    };
  
    const servicesData = services.map(service => ({
      name: service.name,
      quantity: parseInt(service.quantity, 10), // Prekonvertovať na číslo
      price: parseFloat(service.price), // Prekonvertovať na číslo
    }));
  
    // Odoslať dáta v správnom formáte
    onSubmit({ invoiceData, servicesData });
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      closeModal();
    }, 500);
  };

  return (
    <div
      className={`fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-500 overflow-auto ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl transform transition-transform duration-500 max-h-screen overflow-y-auto mt-10 mb-10 ${
          visible ? 'scale-100' : 'scale-75'
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-green-600">Pridať mesačnú faktúru</h2>
          <button
              type="button"
            className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
            onClick={handleClose}
          >
            Zatvorit
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
                onChange={(e) => setSelectedCompany(e.target.value)}
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
                onChange={(e) => setSelectedResidentialCompany(e.target.value)}
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
              <label className="block text-green-700 mb-2" htmlFor="paymentMethod">
                Forma úhrady:
              </label>
              <input
                type="text"
                id="paymentMethod"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyDetails.payment_method || 'Prevodom'}
                onChange={(e) => handleCompanyDetailChange('payment_method', e.target.value)}
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
          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
              onClick={handleClose}
            >
              Zavrieť
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-300"
            >
              Pridať
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMonthlyInvoice;
