import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching post comments (top-level only, no replies)
 * @param {string} postId - Post ID
 * @returns {object} React Query infinite query object
 */
export const usePostComments = (postId) => {
  return useInfiniteQuery({
    queryKey: ['comments', postId, { parentCommentId: null }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/posts/${postId}/comments`, {
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
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export default usePostComments;
