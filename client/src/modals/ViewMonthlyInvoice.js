// ViewMonthlyInvoice.js
import React from 'react';
import PropTypes from 'prop-types';

const ViewMonthlyInvoice = ({ closeModal, invoice }) => {
  const {
    invoice_name,
    company_name,
    company_address,
    city,
    postal_code,
    company_ico,
    company_dic,
    company_iban,
    bank_connection,
    payment_method,
    header1,
    header2,
    header3,
    header4,
    residential_company_name,
    residential_company_address,
    residential_city,
    residential_postal_code,
    residential_company_ico,
    residential_company_dic,
    residential_company_iban,
    residential_bank_connection,
    description_above_services,
    description_services,
    services_planned,
  } = invoice;

  // Pomocná funkcia na renderovanie jednotlivých polí, ak majú hodnotu
  const renderField = (label, value) => {
    if (!value) return null;
    return (
      <div className="mb-2 flex">
        <span className="font-semibold text-green-700 w-48">{label}:</span>
        <span className="text-gray-800">{value}</span>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-500 overflow-auto`}
    >
      <div
        className={`bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl transform transition-transform duration-500 max-h-screen overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-600">Zobraziť mesačnú faktúru</h2>
          <button
            type="button"
            className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 transition duration-300"
            onClick={closeModal}
          >
            Zavrieť
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Údaje spoločnosti */}
          <div className="border p-6 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Údaje spoločnosti</h3>
            {renderField('Názov faktúry', invoice_name)}
            {renderField('Názov spoločnosti', company_name)}
            {renderField('Adresa spoločnosti', company_address)}
            {renderField('Mesto', city)}
            {renderField('PSČ', postal_code)}
            {renderField('IČO', company_ico)}
            {renderField('DIČ', company_dic)}
            {renderField('IBAN spoločnosti', company_iban)}
            {renderField('Bankové spojenie', bank_connection)}
            {renderField('Forma úhrady', payment_method)}
          </div>

          {/* Údaje rezidenčnej spoločnosti */}
          <div className="border p-6 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Údaje bytového podniku</h3>
            {renderField('Hlavička 1', header1)}
            {renderField('Hlavička 2', header2)}
            {renderField('Hlavička 3', header3)}
            {renderField('Hlavička 4', header4)}
            {renderField('Názov bytového podniku', residential_company_name)}
            {renderField('Adresa bytového podniku', residential_company_address)}
            {renderField('Mesto', residential_city)}
            {renderField('PSČ', residential_postal_code)}
            {renderField('IČO', residential_company_ico)}
            {renderField('DIČ', residential_company_dic)}
            {renderField('IBAN', residential_company_iban)}
            {renderField('Bankové spojenie', residential_bank_connection)}
          </div>
        </div>

        {/* Popis nad službami */}
        {description_above_services && (
          <div className="mt-6 border p-6 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Popis nad službami</h3>
            <p className="text-gray-800">{description_above_services}</p>
          </div>
        )}

        {/* Služby */}
        {services_planned && services_planned.length > 0 && (
          <div className="mt-6 border p-6 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Služby</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Popis služby</th>
                  <th className="border p-2 text-left">Množstvo</th>
                  <th className="border p-2 text-left">Cena služby</th>
                </tr>
              </thead>
                <tbody>
                    {description_services && (
                        <tr>
                        <td colSpan="3" className="border p-2">
                            <h3 className="text-sm font-semibold">Popis služieb</h3>
                            <p className="text-gray-800">{description_services}</p>
                        </td>
                        </tr>
                    )}
                    {services_planned.map((service, index) => (
                        <tr key={index}>
                            {service.name && <td className="border p-2">{service.name}</td>}
                            {service.quantity !== undefined && <td className="border p-2">{service.quantity}</td>}
                            {service.price !== undefined && <td className="border p-2">{(service.price*service.quantity).toFixed(2)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

ViewMonthlyInvoice.propTypes = {
  closeModal: PropTypes.func.isRequired,
  invoice: PropTypes.shape({
    invoice_name: PropTypes.string,
    company_name: PropTypes.string,
    company_address: PropTypes.string,
    city: PropTypes.string,
    postal_code: PropTypes.string,
    company_ico: PropTypes.string,
    company_dic: PropTypes.string,
    company_iban: PropTypes.string,
    bank_connection: PropTypes.string,
    payment_method: PropTypes.string,
    header1: PropTypes.string,
    header2: PropTypes.string,
    header3: PropTypes.string,
    header4: PropTypes.string,
    residential_company_name: PropTypes.string,
    residential_company_address: PropTypes.string,
    residential_city: PropTypes.string,
    residential_postal_code: PropTypes.string,
    residential_company_ico: PropTypes.string,
    residential_company_dic: PropTypes.string,
    residential_company_iban: PropTypes.string,
    residential_bank_connection: PropTypes.string,
    description_above_services: PropTypes.string,
    description_services: PropTypes.string,
    services_planned: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        quantity: PropTypes.number,
        price: PropTypes.number,
    })
    ),
  }).isRequired,
};

export default ViewMonthlyInvoice;
