import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching following feed with infinite scroll
 * @returns {object} React Query infinite query object
 */
export const useFeedFollowing = () => {
  return useInfiniteQuery({
    queryKey: ['feed', 'following'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/feed/following', {
        params: {
          page: pageParam,
          limit: 20
        }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export default useFeedFollowing;
