import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Check email availability mutation hook
 * @returns {object} React Query mutation object
 */
export const useCheckEmailAvailability = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const response = await api.post('/auth/check-email', { email });
      return response;
    },
  });
};

export default useCheckEmailAvailability;
