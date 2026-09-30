import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Google Sign-In mutation hook
 * Sends the GIS ID token (credential) to the server for verification.
 * The server links/creates the account and returns the app's normal JWT.
 * @returns {object} React Query mutation object
 */
export const useGoogleAuth = () => {
  return useMutation({
    mutationFn: async ({ idToken }) => {
      const response = await api.post('/auth/google', { idToken });
      return response;
    },
  });
};

export default useGoogleAuth;
