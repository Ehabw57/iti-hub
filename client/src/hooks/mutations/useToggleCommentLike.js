import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Toggle comment like mutation hook
 * @returns {Object} Mutation object from React Query
 */
export default function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, isCurrentlyLiked }) => {
      if (isCurrentlyLiked) {
        // Unlike
        const response = await api.delete(`/comments/${commentId}/like`);
        return response.data;
      } else {
        // Like
        const response = await api.post(`/comments/${commentId}/like`);
        return response.data;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate comment queries to refresh counts
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
}
