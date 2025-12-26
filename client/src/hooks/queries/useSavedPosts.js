import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching user's saved posts with infinite scroll
 * @returns {object} React Query infinite query object
 */
export const useSavedPosts = () => {
  return useInfiniteQuery({
    queryKey: ['posts', 'saved'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/posts/saved', {
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

export default useSavedPosts;
