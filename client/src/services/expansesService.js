// src/services/expansesService.js
import axiosInstance from './axiosInstance';

export const getExpensesAll = () => {
  return axiosInstance.get(`/expenses/all`);
};

export const getExpenses = (month, year) => {
  return axiosInstance.get(`/expenses?month=${month}&year=${year}`);
};

export const createExpense = (expenseData) => {
  return axiosInstance.post('/expenses', expenseData);
};

export const updateExpense = (id, expenseData) => {
  return axiosInstance.put(`/expenses/${id}`, expenseData);
};

export const deleteExpense = (id) => {
  return axiosInstance.delete(`/expenses/${id}`);
};

export const importExpenses = (expensesData) => {
  return axiosInstance.post('/expenses/import', { expenses: expensesData });
};