import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';
import { toast } from 'react-hot-toast';

/**
 * Hook for creating a comment on a post
 * @returns {object} React Query mutation object
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, parentCommentId }) => {
      const response = await api.post(`/posts/${postId}/comments`, {
        content,
        parentCommentId: parentCommentId || undefined,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate comments queries for this post
      queryClient.invalidateQueries({ 
        queryKey: ['comments', variables.postId] 
      });
      
      // Invalidate feed queries to update commentsCount
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      toast.success('Comment posted');
    },
    onError: () => {
      toast.error('Failed to post comment');
    },
  });
};

export default useCreateComment;
