import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Verify email mutation hook
 * @returns {object} React Query mutation object
 */
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async ({ token }) => {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      return response;
    },
  });
};

export default useVerifyEmail;
