import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Resend email verification mutation hook
 * Requires authentication - uses logged in user's email
 * @returns {object} React Query mutation object
 */
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/auth/resend-verification');
      return response;
    },
  });
};

export default useResendVerificationEmail;
