import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Register mutation hook
 * @returns {object} React Query mutation object
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: async ({ email, username, firstName, lastName, password }) => {
      const response = await api.post('/auth/register', {
        email,
        fullName: `${firstName} ${lastName}`,
        username,
        password,
      });
      return response;
    },
  });
};

export default useRegister;
