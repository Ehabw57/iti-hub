import { useQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching a single post by ID
 * @param {string} postId - Post ID
 * @returns {object} React Query query object
 */
export const usePost = (postId) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await api.get(`/posts/${postId}`);
      return response.data.data.post;
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export default usePost;
