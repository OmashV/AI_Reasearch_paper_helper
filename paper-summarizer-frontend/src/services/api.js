import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 60000, // Increased from 30000 to 60000 (60 seconds)
});

export const register = async (email, password) => {
  try {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

export const chatRequest = async (query, limit, token) => {
  try {
    console.log('Request config:', { query, limit, token });
    const response = await api.post('/api/chat', { query, limit }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Full API Response:', response);
    return response.data;
  } catch (error) {
    console.error('Detailed API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });
    throw new Error(error.response?.data?.detail || 'Network error');
  }
};

export const citePaper = async (paper, token) => {
  try {
    const response = await api.post('/api/cite', { paper }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Citation error');
  }
};