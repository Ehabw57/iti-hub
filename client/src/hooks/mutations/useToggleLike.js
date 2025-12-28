import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for toggling post like/unlike
 * @returns {object} React Query mutation object
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isCurrentlyLiked }) => {
      if (isCurrentlyLiked) {
        // Unlike
        const response = await api.delete(`/posts/${postId}/like`);
        return response.data;
      } else {
        // Like
        const response = await api.post(`/posts/${postId}/like`);
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate feed queries to refresh like counts
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export default useToggleLike;
