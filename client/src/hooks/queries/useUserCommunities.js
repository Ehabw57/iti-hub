import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

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
 * Used by user communities page to display all joined communities with pagination
 * @returns {object} React Query infinite query object
 */
export const useUserCommunitiesInfinite = () => {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useUserCommunities;
