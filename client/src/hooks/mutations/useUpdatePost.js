import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Update post mutation hook
 * @returns {Object} Mutation object from React Query
 */
export default function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, tags, isrepost }) => {
      console.log('isrepost value in useUpdatePost:', isrepost);
      const response = await api.patch(`/posts/${postId}`, {
        ...(isrepost ? { repostComment: content } : { content }),
        tags,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all feed and post queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
      
      // If post was in a community, invalidate community feed
      if (variables.communityId) {
        queryClient.invalidateQueries({ 
          queryKey: ['community', variables.communityId, 'feed'] 
        });
      }
      
      // Invalidate the post author's profile posts
      if (variables.authorId) {
        queryClient.invalidateQueries({ 
          queryKey: ['userPosts', variables.authorId] 
        });
      }
    },
  });
}

