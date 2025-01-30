import React, { useState, useEffect } from 'react';

const AddNewCompany = ({ closeModal, onSubmit }) => {
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [companyIco, setCompanyIco] = useState('');
  const [companyDic, setCompanyDic] = useState('');
  const [companyIban, setCompanyIban] = useState('');
  const [bankConnection, setBankConnection] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Spustenie animácie pri otvorení
    setVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName || !companyAddress || !postalCode || !city) {
        alert('Please fill in all required fields.');
        return;
      }

      const companyData = {
        company_name: companyName,
        company_address: companyAddress,
        postal_code: postalCode,
        city: city,
        company_ico: companyIco || null,
        company_dic: companyDic || null,
        company_iban: companyIban || null,
        bank_connection: bankConnection || null,
        type: 'residential-company' // pridáme typ
      };

    onSubmit(companyData);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      closeModal();
    }, 500); // Dĺžka animácie zatvorenia
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white p-4 rounded-2xl shadow-lg w-full max-w-lg transform transition-transform duration-500 ${
          visible ? 'scale-100' : 'scale-75'
        }`}
      >
        <h2 className="text-2xl text-center font-bold mb-4 text-green-600">Pridať novú firmu</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="companyName">
                Názov firmy:
              </label>
              <input
                type="text"
                id="companyName"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="companyAddress">
                Adresa firmy:
              </label>
              <input
                type="text"
                id="companyAddress"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="postalCode">
                PSČ:
              </label>
              <input
                type="text"
                id="postalCode"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="city">
                Mesto:
              </label>
              <input
                type="text"
                id="city"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="companyIco">
                IČO:
              </label>
              <input
                type="text"
                id="companyIco"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyIco}
                onChange={(e) => setCompanyIco(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="companyDic">
                DIČ:
              </label>
              <input
                type="text"
                id="companyDic"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyDic}
                onChange={(e) => setCompanyDic(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="companyIban">
                IBAN:
              </label>
              <input
                type="text"
                id="companyIban"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={companyIban}
                onChange={(e) => setCompanyIban(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="block text-green-700 mb-2" htmlFor="bankConnection">
                Bankové spojenie:
              </label>
              <input
                type="text"
                id="bankConnection"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                value={bankConnection}
                onChange={(e) => setBankConnection(e.target.value)}
              />
            </div>
          </div>
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

export default AddNewCompany;
