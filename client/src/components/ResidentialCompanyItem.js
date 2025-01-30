import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EditResidentialCompany from '../modals/EditResidentialCompany';
import { deleteResidentialCompany } from '../services/companyService';

const ResidentialCompanyItem = ({ company, expandedCompany, handleToggleExpand, fetchCompanies }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteResidentialCompany(company.id);
      fetchCompanies(); // Refresh the list after successful deletion
      toast.success('Bytový podnik bol úspešne aktualizovaný');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Chyba pri aktualizácii bytového podniku');
    }
  };

  return (
    <div key={company.id} className="bg-gray-100 p-3 rounded-lg shadow-md mb-2">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => handleToggleExpand(company.id)}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-green-700">{company.company_name}</h2>
          <span className="text-sm text-gray-600">IČO: {company.company_ico}</span>
          <span className="text-sm text-gray-600">DIČ: {company.company_dic}</span>
        </div>
        <div className="relative text-lg text-gray-500 text-center">
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
          >
            ...
          </div>
          {showOptions && (
            <div className={`absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-2 transition-transform duration-500 ${showOptions ? 'transform scale-100' : 'transform scale-75'}`}>
              <button
                className="w-full text-left px-2 py-1 text-blue-600 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                  setShowOptions(false);
                }}
              >
                Upraviť
              </button>
              <button
                className="w-full text-left px-2 py-1 text-red-600 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  setShowOptions(false);
                }}
              >
                Vymazať
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-1000 ease-in-out ${expandedCompany === company.id ? 'max-h-96' : 'max-h-0'}`}
        style={{ maxHeight: expandedCompany === company.id ? '400px' : '0' }}
      >
        {expandedCompany === company.id && (
          <div className="mt-4">
            <p className="text-sm text-gray-700"><strong>Adresa:</strong> {company.company_address}</p>
            <p className="text-sm text-gray-700"><strong>PSČ:</strong> {company.postal_code}</p>
            <p className="text-sm text-gray-700"><strong>Mesto:</strong> {company.city}</p>
            <p className="text-sm text-gray-700"><strong>IBAN:</strong> {company.company_iban}</p>
            <p className="text-sm text-gray-700"><strong>Bankové spojenie:</strong> {company.bank_connection}</p>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditResidentialCompany
          closeModal={() => setShowEditModal(false)}
          company={company}
          fetchCompanies={fetchCompanies}
        />
      )}
    </div>
  );
};

export default ResidentialCompanyItem;
