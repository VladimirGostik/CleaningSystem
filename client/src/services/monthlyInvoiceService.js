import axiosInstance from './axiosInstance';

// ➕ Pridanie mesačnej faktúry
export const addMonthlyInvoice = async (invoiceData) => {
  try {
    const response = await axiosInstance.post('/monthly-invoices', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error adding monthly invoice:', error);
    throw error;
  }
};

// 📜 Získanie všetkých mesačných faktúr
export const getMonthlyInvoices = async () => {
  try {
    const response = await axiosInstance.get('/monthly-invoices');
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly invoices:', error);
    throw error;
  }
};

// 🔍 Získanie mesačnej faktúry podľa ID
export const getMonthlyInvoiceById = async (invoiceId) => {
  try {
    const response = await axiosInstance.get(`/monthly-invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly invoice by ID:', error);
    throw error;
  }
};

// ✏️ Aktualizácia mesačnej faktúry
export const updateMonthlyInvoice = async (invoiceId, updatedData) => {
  try {
    const response = await axiosInstance.put(`/monthly-invoices/${invoiceId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating monthly invoice:', error);
    throw error;
  }
};

// ❌ Odstránenie mesačnej faktúry
export const deleteMonthlyInvoice = async (invoiceId) => {
  try {
    const response = await axiosInstance.delete(`/monthly-invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting monthly invoice:', error);
    throw error;
  }
};
