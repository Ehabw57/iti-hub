import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching trending feed with infinite scroll
 * @param {string} timeframe - Timeframe filter: '24h', '7d', '30d'
 * @returns {object} React Query infinite query object
 */
export const useFeedTrending = (timeframe = '24h') => {
  return useInfiniteQuery({
    queryKey: ['feed', 'trending', timeframe],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/feed/trending', {
        params: {
          page: pageParam,
          limit: 20,
          timeframe
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

export default useFeedTrending;
