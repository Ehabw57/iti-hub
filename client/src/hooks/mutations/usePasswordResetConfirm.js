import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Password reset confirm mutation hook
 * @returns {object} React Query mutation object
 */
export const usePasswordResetConfirm = () => {
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const response = await api.post('/auth/password-reset/confirm', {
        token,
        password,
      });
      return response;
    },
  });
};

export default usePasswordResetConfirm;
