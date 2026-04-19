import axios from 'axios';

// Production API URL (change this if deploying elsewhere)
const PRODUCTION_API_URL = 'https://api.budgetier.ink';
const DEVELOPMENT_API_URL = 'http://localhost:3000';

// Determine if we're in production (GitHub Pages) or development
const isProduction = window.location.hostname === 'budgetier.ink' || 
                     window.location.hostname === 'www.budgetier.ink';

const API_URL = process.env.REACT_APP_API_URL || 
                (isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
