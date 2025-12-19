import axios from 'axios';
import { useAuthStore } from '@store/auth';

const TOKEN_EXPIRED_CODES = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED'];

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    // Return response as-is
    return response;
  },
  (error) => {
    // Check if error response exists
    if (error.response) {
      const errorCode = error.response?.data?.error?.code;

      // Handle token expiration
      if (errorCode && TOKEN_EXPIRED_CODES.includes(errorCode)) {
        console.log('[API] Token expired, logging out and redirecting');
        useAuthStore.getState().logout();
        
        // Hard redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      if (import.meta.env.DEV) {
        console.error('[API] Error:', {
          url: error.config?.url,
          status: error.response?.status,
          code: errorCode,
          message: error.response?.data?.error?.message,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
