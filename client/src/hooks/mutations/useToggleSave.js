import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for toggling post save/unsave
 * @returns {object} React Query mutation object
 */
export const useToggleSave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isCurrentlySaved }) => {
      if (isCurrentlySaved) {
        // Unsave
        const response = await api.delete(`/posts/${postId}/save`);
        return response.data;
      } else {
        // Save
        const response = await api.post(`/posts/${postId}/save`);
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate feed and saved posts queries
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'saved'] });
    },
  });
};

export default useToggleSave;
