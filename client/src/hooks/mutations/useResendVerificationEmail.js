import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Resend email verification mutation hook
 * @returns {object} React Query mutation object
 */
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const response = await api.post('/auth/resend-verification', { email });
      return response;
    },
  });
};

export default useResendVerificationEmail;
