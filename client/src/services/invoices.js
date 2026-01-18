import axiosInstance from './axiosInstance';

// 🔢 Získanie posledného čísla faktúry pre konkrétnu firmu a rok
export const getLastNumber = async (selectedCompany, invoiceYear) => {
  try {
    const response = await axiosInstance.get(`/invoices/last-number`, {
      params: { selectedCompany: parseInt(selectedCompany, 10), invoiceYear: parseInt(invoiceYear, 10) }, // Použitie `params` pre správne odoslanie údajov
    });
    return response.data;
  } catch (error) {
    console.error('Error getting last-invoice number:', error);
    throw error;
  }
};

// 🔍 Získanie faktúry podľa ID
export const getInvoiceById = async (id) => {
  try {
    const response = await axiosInstance.get(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting invoice by ID:', error);
    throw error;
  }
};

export const sendTransactionsToBackend = async (transactions) => {
  try {
    // Vyčistiť cache pre unlinkedTransactions pred odoslaním požiadavky
    localStorage.removeItem('unlinkedTransactions');

    // Odoslanie požiadavky na aktualizáciu faktúr na základe transakcií
    const response = await axiosInstance.put('/invoices/update-from-transactions', { transactions });

    // Uložiť nové unlinkedTransactions do localStorage po úspešnom spracovaní
    localStorage.setItem('unlinkedTransactions', JSON.stringify(response.data.unlinkedTransactions));
    localStorage.setItem('wrongPriceTransactions', JSON.stringify(response.data.wrongPriceTransactions));
    return response.data;
  } catch (error) {
    console.error('Error updating invoices from transactions:', error);
  }
};

// 📜 Získanie všetkých faktúr
export const getInvoices = async () => {
  try {
    const response = await axiosInstance.get('/invoices');
    return response.data;
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
};

// ➕ Pridanie faktúry
export const addInvoice = async (invoiceData, servicesData) => {
  try {
    const response = await axiosInstance.post('/invoices', {
      ...invoiceData,
      services: servicesData,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding invoice:', error);
    throw error;
  }
};

// ✏️ Aktualizácia faktúry
export const updateInvoice = async (invoiceId, updatedData) => {
  try {
    const response = await axiosInstance.put(`/invoices/${invoiceId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// 🚀 Označenie faktúry ako ODOSLANÚ
export const InvoicesMarkAsSent = async (invoiceId) => {
  try {
    const response = await axiosInstance.put(`/invoices/${invoiceId}/mark-as-sent`);
    return response.data;
  } catch (error) {
    console.error('Error marking invoice as sent:', error);
    throw error;
  }
};

// 🔄 Generovanie mesačných faktúr
export const generateMonthlyInvoices = async (data) => {
  try {
    const response = await axiosInstance.post('/invoices/generate-monthly', data);
    return response.data;
  } catch (error) {
    console.error('Error generating monthly invoices:', error);
    throw error;
  }
};

// 🔄 Generovanie mesačných faktúr pre jednu firmu
export const generateMonthlyInvoicesForCompany = async (data) => {
  try {
    const response = await axiosInstance.post('/invoices/generate-monthly-for-company', data);
    return response.data;
  } catch (error) {
    console.error('Error generating monthly invoices for company:', error);
    throw error;
  }
};

// 💰 Označenie faktúry ako ZAPLATENÚ
export const InvoicesMarkAsPaid = async (invoiceId, paymentDate) => {
  try {
    const response = await axiosInstance.put(`/invoices/${invoiceId}/mark-as-paid`, {
      payment_date: paymentDate,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    throw error;
  }
};

// ❌ Odstránenie faktúry
export const deleteInvoice = async (invoiceId) => {
  try {
    const response = await axiosInstance.delete(`/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

export const InvoicesBulkMarkAsSent = async (invoiceIds) => {
  try {
    const response = await axiosInstance.put('/invoices/bulk-update-status', {
      invoiceIds,
      status: 'sent',
    });
    return response.data;
  } catch (error) {
    console.error('Error marking invoices as sent:', error);
    throw error;
  }
};

// 💰 Označenie viacerých faktúr ako ZAPLATENÉ
export const InvoicesBulkMarkAsPaid = async (invoiceIds, paymentDate) => {
  try {
    const response = await axiosInstance.put('/invoices/bulk-update-status', {
      invoiceIds,
      status: 'paid',
      payment_date: paymentDate,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking invoices as paid:', error);
    throw error;
  }
};

// ❌ Hromadné vymazanie faktúr
export const InvoicesBulkDelete = async (invoiceIds) => {
  try {
    const response = await axiosInstance.post('/invoices/bulk-delete', {
      invoiceIds,
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting invoices:', error);
    throw error;
  }
};