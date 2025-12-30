import axios from 'axios';

// API Configuration
// Use EXPO_PUBLIC_API_BASE_URL when provided.
// Otherwise pick a sensible default based on build type: local IP for development, Render URL for production builds.
const LOCAL_FALLBACK_URL = 'http://10.220.149.161:5000';
const PRODUCTION_FALLBACK_URL = 'https://rhm-backend-1.onrender.com/api';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_FALLBACK_URL : PRODUCTION_FALLBACK_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
