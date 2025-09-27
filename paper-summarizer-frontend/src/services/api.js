import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL, // http://localhost:8000
  headers: { 'Content-Type': 'application/json' },
});

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Logs a user in and returns an access token.
 * @param {object} userData - Object containing email and password.
 * @returns {promise<object>} A promise resolving to an object containing an access token.
 */
/*******  563cf07d-38da-4b86-9115-9a9c6ba51019  *******/export const login = async (userData) => {
  const response = await api.post('/auth/login', userData);
  return response.data;
};

export const chatRequest = async (query, limit, token) => {
  const response = await api.post('/api/chat', { query, limit }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};

export const citePaper = async (paper, token) => {
  const response = await api.post('/cite', { papers: [paper] }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};