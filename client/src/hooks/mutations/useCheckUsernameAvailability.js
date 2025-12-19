import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Check username availability mutation hook
 * @returns {object} React Query mutation object
 */
export const useCheckUsernameAvailability = () => {
  return useMutation({
    mutationFn: async ({ username }) => {
      const response = await api.post('/auth/check-username', { username });
      return response;
    },
  });
};

export default useCheckUsernameAvailability;
