import axios from 'axios';
import { useAuthStore } from '@store/auth';

const TOKEN_EXPIRED_CODES = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED'];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (⚠️ NO logout here)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.error?.code;

    if (TOKEN_EXPIRED_CODES.includes(errorCode)) {
      // Signal auth failure ONLY
      useAuthStore.getState().setAuthError();
    }

    if (import.meta.env.DEV) {
      console.error('[API] Error:', {
        url: error.config?.url,
        status: error.response?.status,
        code: errorCode,
        message: error.response?.data?.error?.message,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
