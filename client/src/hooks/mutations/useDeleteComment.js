import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Delete comment mutation hook
 * @returns {Object} Mutation object from React Query
 */
export default function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({commentId}) => {
        console.log("Deleting comment with ID:", commentId);
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate comment queries and post queries (to update comment counts)
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
