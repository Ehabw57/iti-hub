import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';
import { useAuthStore } from '@store/auth';

/**
 * Hook for fetching user's joined communities (simple query)
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

/**
 * Hook for fetching user's joined communities with infinite scroll
 * Used by the Communities page "My Communities" tab to display all joined
 * communities with pagination. Auth-gated: the consolidated page is public
 * (the All tab works for guests), so this must not fire without a session.
 * @returns {object} React Query infinite query object
 */
export const useUserCommunitiesInfinite = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useInfiniteQuery({
    queryKey: ['user', 'communities', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/users/me/communities', {
        params: {
          page: pageParam,
          limit: 12
        }
      });
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination?.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useUserCommunities;
