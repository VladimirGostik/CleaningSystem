import axiosInstance from './axiosInstance';

export const login = async (username, password) => {
  try {
    const response = await axiosInstance.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw new Error('Login failed');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getProfile = async () => {
  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const register = async (username, password, role) => {
  try {
    const response = await axiosInstance.post('/auth/register', { username, password, role });
    return response.data;
  } catch (error) {
    throw new Error('Registration failed');
  }
};