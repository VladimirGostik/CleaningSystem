// src/pages/InvoiceDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { getInvoiceById } from '../services/invoices';
import { toast } from 'react-toastify';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const invoiceData = await getInvoiceById(id);
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Chyba pri načítaní faktúry');
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
    navigate('/invoices', { state: location.state });
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
          <div className="text-lg text-red-600">Faktúra nebola nájdená</div>
        </div>
      </AdminLayout>
    );
  }

  // Calculate total price
  const totalPrice = (invoice.services || []).reduce((acc, service) => {
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
          <h1 className="text-2xl font-bold text-gray-600">Detail faktúry</h1>
          <button
            onClick={handleBack}
            className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-700 transition duration-300"
          >
            ← Späť na zoznam faktúr
          </button>
        </div>

        <div className="bg-white p-6 shadow-xl rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Details */}
            <div className="border p-6 rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Údaje spoločnosti</h3>
              {renderField('Číslo faktúry', invoice.invoice_number)}
              {renderField('Názov faktúry', invoice.invoice_name)}
              {renderField('Dátum vystavenia', invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('sk-SK') : '')}
              {renderField('Dátum splatnosti', invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('sk-SK') : '')}
              {renderField('Dátum úhrady', invoice.payment_date ? new Date(invoice.payment_date).toLocaleDateString('sk-SK') : '')}
              {renderField('Fakturačný mesiac', invoice.billing_month)}
              {renderField('Status', invoice.status)}
              {renderField('Názov spoločnosti', invoice.company_name)}
              {renderField('Adresa spoločnosti', invoice.company_address)}
              {renderField('Mesto', invoice.city)}
              {renderField('PSČ', invoice.postal_code)}
              {renderField('IČO', invoice.company_ico)}
              {renderField('DIČ', invoice.company_dic)}
              {renderField('IČ DPH', invoice.company_ic_dph)}
              {renderField('IBAN', invoice.company_iban)}
              {renderField('Bankové spojenie', invoice.bank_connection)}
              {renderField('Forma úhrady', invoice.payment_method)}
            </div>

            {/* Residential Company Details */}
            <div className="border p-6 rounded-md shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Údaje rezidenčnej spoločnosti</h3>
              {renderField('Názov rezidenčnej spoločnosti', invoice.residential_company_name)}
              {renderField('Adresa', invoice.residential_company_address)}
              {renderField('Mesto', invoice.residential_city)}
              {renderField('PSČ', invoice.residential_postal_code)}
              {renderField('IČO', invoice.residential_company_ico)}
              {renderField('DIČ', invoice.residential_company_dic)}
              {renderField('IČ DPH', invoice.residential_company_ic_dph)}
              {renderField('IBAN', invoice.residential_company_iban)}
              {renderField('Bankové spojenie', invoice.residential_bank_connection)}
              {renderField('Header 1', invoice.header1)}
              {renderField('Header 2', invoice.header2)}
              {renderField('Header 3', invoice.header3)}
              {renderField('Header 4', invoice.header4)}
            </div>
          </div>

          {/* Services */}
          <div className="mt-8 border p-6 rounded-md shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-green-700">Služby</h3>
            {invoice.description_above_services && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-gray-700">{invoice.description_above_services}</p>
              </div>
            )}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Názov služby</th>
                  <th className="border p-2 text-right">Množstvo</th>
                  <th className="border p-2 text-right">Cena</th>
                  <th className="border p-2 text-right">Celkom</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.services || []).map((service, index) => {
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
            {invoice.description_services && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-gray-700">{invoice.description_services}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InvoiceDetail;
