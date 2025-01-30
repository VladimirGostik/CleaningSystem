import axiosInstance from './axiosInstance';

// 🏢 Pridanie firmy
export const addCompany = async (companyData) => {
  try {
    const response = await axiosInstance.post('/companies', companyData); // odstránený zbytočný objekt `{ companyData }`
    return response.data;
  } catch (error) {
    console.error('Error adding company:', error);
    throw error;
  }
};

// 📜 Získanie zoznamu firiem
export const getCompanies = async () => {
  try {
    const response = await axiosInstance.get('/companies');
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

// 🔍 Získanie firmy podľa ID
export const getCompanyById = async (companyId) => {
  try {
    const response = await axiosInstance.get(`/companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    throw error;
  }
};

// ✏️ Aktualizácia firmy
export const updateCompany = async (companyId, updatedData) => {
  try {
    const response = await axiosInstance.put(`/companies/${companyId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

// ❌ Odstránenie firmy
export const deleteCompany = async (companyId) => {
  try {
    const response = await axiosInstance.delete(`/companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

// 🏠 Pridanie bytového podniku
export const addResidentialCompany = async (companyData) => {
  try {
    const response = await axiosInstance.post('/residential-companies', companyData);
    return response.data;
  } catch (error) {
    console.error('Error adding residential company:', error);
    throw error;
  }
};

// 📜 Získanie zoznamu bytových podnikov
export const getResidentialCompanies = async () => {
  try {
    const response = await axiosInstance.get('/residential-companies');
    return response.data;
  } catch (error) {
    console.error('Error fetching residential companies:', error);
    throw error;
  }
};

// 🔍 Získanie bytového podniku podľa ID
export const getResidentialCompanyById = async (companyId) => {
  try {
    const response = await axiosInstance.get(`/residential-companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching residential company by ID:', error);
    throw error;
  }
};

// ✏️ Aktualizácia bytového podniku
export const updateResidentialCompany = async (companyId, updatedData) => {
  try {
    const response = await axiosInstance.put(`/residential-companies/${companyId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating residential company:', error);
    throw error;
  }
};

// ❌ Odstránenie bytového podniku
export const deleteResidentialCompany = async (companyId) => {
  try {
    const response = await axiosInstance.delete(`/residential-companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting residential company:', error);
    throw error;
  }
};
