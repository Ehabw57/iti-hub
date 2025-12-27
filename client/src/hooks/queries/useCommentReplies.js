import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching comment replies (nested comments)
 * @param {string} postId - Post ID
 * @param {string} parentCommentId - Parent comment ID
 * @param {Object} options - Additional query options (e.g., enabled)
 * @returns {object} React Query infinite query object
 */
export const useCommentReplies = (postId, parentCommentId, options = {}) => {
  return useInfiniteQuery({
    queryKey: ['comments', postId, { parentCommentId }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/posts/${postId}/comments`, {
        params: {
          page: pageParam,
          limit: 20,
          parentCommentId
        }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!postId && !!parentCommentId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

export default useCommentReplies;
