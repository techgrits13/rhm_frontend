import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
// Use EXPO_PUBLIC_API_BASE_URL when provided.
// Otherwise pick a sensible default based on build type: local IP for development, Render URL for production builds.
const LOCAL_FALLBACK_URL = 'http://192.168.1.100:5000/api';
const PRODUCTION_FALLBACK_URL = 'https://rhm-backend-2.onrender.com/api';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_FALLBACK_URL : PRODUCTION_FALLBACK_URL);

console.log('🌐 API Base URL:', API_BASE_URL);

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Extend AxiosRequestConfig to include metadata
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { retryCount: number };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(retryCount: number): number {
  const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors, timeouts - retry
    return true;
  }

  const status = error.response.status;
  // Retry on 5xx errors and 429 (rate limit)
  return status >= 500 || status === 429;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Request interceptor for retry logic
api.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    // Add retry metadata
    if (!config.metadata) {
      config.metadata = { retryCount: 0 };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig;

    if (!config || !config.metadata) {
      console.error('API Error:', error.message);
      return Promise.reject(error);
    }

    const { retryCount } = config.metadata;

    // Check if we should retry
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      config.metadata.retryCount++;
      const delay = getRetryDelay(retryCount);

      console.log(`⏳ Retrying request (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`);

      await sleep(delay);

      return api.request(config);
    }

    // Max retries exceeded or non-retryable error
    if (error.response) {
      console.error(`API Error (${error.response.status}):`, error.message);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
