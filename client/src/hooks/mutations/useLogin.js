import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Login mutation hook
 * @returns {object} React Query mutation object
 */
export const useLogin = () => {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      return response;
    },
  });
};

export default useLogin;
