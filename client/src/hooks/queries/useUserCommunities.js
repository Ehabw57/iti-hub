import { useQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching user's joined communities
 * Used by post composer to select community for post
 * @returns {object} React Query query object
 */
export const useUserCommunities = () => {
  return useQuery({
    queryKey: ['user', 'communities'],
    queryFn: async () => {
      const response = await api.get('/users/me/communities');
      return response.data.data.communities;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useUserCommunities;
