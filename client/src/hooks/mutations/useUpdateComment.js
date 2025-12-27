import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Update comment mutation hook
 * @returns {Object} Mutation object from React Query
 */
export default function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await api.put(`/comments/${commentId}`, {
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate comment queries to refresh
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
}
