// src/pages/MonthlyInvoiceDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { getMonthlyInvoiceById } from '../services/monthlyInvoiceService';
import { toast } from 'react-toastify';

const MonthlyInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const invoiceData = await getMonthlyInvoiceById(id);
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Error fetching monthly invoice:', error);
        toast.error('Chyba pri načítaní mesačnej faktúry');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handleBack = () => {
    // Navigate back with state to preserve filters
    navigate('/monthly-invoices', { state: location.state });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-lg">Načítavanie...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-lg text-red-600">Mesačná faktúra nebola nájdená</div>
        </div>
      </AdminLayout>
    );
  }

  // Calculate total price
  const totalPrice = (invoice.services_planned || []).reduce((acc, service) => {
    const price = parseFloat(service.price) || 0;
    const quantity = parseInt(service.quantity, 10) || 0;
    return acc + price * quantity;
  }, 0);

  // Helper function to render field
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
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-600">Detail mesačnej faktúry</h1>
          <button
            onClick={handleBack}
            className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-700 transition duration-300"
          >
            ← Späť na zoznam mesačných faktúr
          </button>
        </div>

        <div className="bg-white p-6 shadow-xl rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Details */}
            <div className="border p-6 rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Údaje spoločnosti</h3>
              {renderField('Názov faktúry', invoice.invoice_name)}
              {renderField('Názov spoločnosti', invoice.company_name)}
              {renderField('Adresa spoločnosti', invoice.company_address)}
              {renderField('Mesto', invoice.city)}
              {renderField('PSČ', invoice.postal_code)}
              {renderField('IČO', invoice.company_ico)}
              {renderField('DIČ', invoice.company_dic)}
              {renderField('IČ DPH', invoice.company_ic_dph)}
              {renderField('IBAN spoločnosti', invoice.company_iban)}
              {renderField('Bankové spojenie', invoice.bank_connection)}
              {renderField('Forma úhrady', invoice.payment_method)}
            </div>

            {/* Residential Company Details */}
            <div className="border p-6 rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Údaje bytového podniku</h3>
              {renderField('Hlavička 1', invoice.header1)}
              {renderField('Hlavička 2', invoice.header2)}
              {renderField('Hlavička 3', invoice.header3)}
              {renderField('Hlavička 4', invoice.header4)}
              {renderField('Názov bytového podniku', invoice.residential_company_name)}
              {renderField('Adresa bytového podniku', invoice.residential_company_address)}
              {renderField('Mesto', invoice.residential_city)}
              {renderField('PSČ', invoice.residential_postal_code)}
              {renderField('IČO', invoice.residential_company_ico)}
              {renderField('DIČ', invoice.residential_company_dic)}
              {renderField('IČ DPH', invoice.residential_company_ic_dph)}
              {renderField('IBAN', invoice.residential_company_iban)}
              {renderField('Bankové spojenie', invoice.residential_bank_connection)}
            </div>
          </div>

          {/* Description Above Services */}
          {invoice.description_above_services && (
            <div className="mt-8 border p-6 rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Popis nad službami</h3>
              <p className="text-gray-700">{invoice.description_above_services}</p>
            </div>
          )}

          {/* Services */}
          {invoice.services_planned && invoice.services_planned.length > 0 && (
            <div className="mt-8 border p-6 rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Služby</h3>
              {invoice.description_services && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <h4 className="text-sm font-semibold mb-2">Popis služieb:</h4>
                  <p className="text-gray-700">{invoice.description_services}</p>
                </div>
              )}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Popis služby</th>
                    <th className="border p-2 text-right">Množstvo</th>
                    <th className="border p-2 text-right">Cena</th>
                    <th className="border p-2 text-right">Celkom</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.services_planned.map((service, index) => {
                    const serviceTotal = (parseFloat(service.price) || 0) * (parseInt(service.quantity, 10) || 0);
                    return (
                      <tr key={index} className="border">
                        <td className="border p-2">{service.name}</td>
                        <td className="border p-2 text-right">{service.quantity}</td>
                        <td className="border p-2 text-right">{parseFloat(service.price || 0).toFixed(2)} €</td>
                        <td className="border p-2 text-right">{serviceTotal.toFixed(2)} €</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="3" className="border p-2 text-right">Celkom:</td>
                    <td className="border p-2 text-right">{totalPrice.toFixed(2)} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default MonthlyInvoiceDetail;
