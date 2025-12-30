import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@lib/api';
import toast from 'react-hot-toast';

/**
 * @fileoverview Mutation hook for creating group conversations
 */

/**
 * Hook for creating a group conversation with multiple participants
 * Supports group name, participant selection, and group image
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation object
 * 
 * @example
 * const createGroup = useCreateGroupConversation();
 * 
 * createGroup.mutate({
 *   name: 'Project Team',
 *   participantIds: ['user1', 'user2', 'user3'],
 *   image: imageFile // optional
 * });
 */
export const useCreateGroupConversation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ name, participantIds, image }) => {
      const formData = new FormData();
      
      formData.append('name', name);
      formData.append('participantIds', JSON.stringify(participantIds));
      
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/conversations/group', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (import.meta.env.DEV) {
        console.log('[useCreateGroupConversation] Group created:', response.data);
      }

      return response.data;
    },

    onSuccess: (data) => {
      const conversation = data.data.conversation;

      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Navigate to the new group conversation
      navigate(`/messages/${conversation._id}`);

      toast.success('Group created successfully');

      if (import.meta.env.DEV) {
        console.log('[useCreateGroupConversation] Navigating to group:', conversation._id);
      }
    },

    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create group');

      if (import.meta.env.DEV) {
        console.error('[useCreateGroupConversation] Error:', error);
      }
    },
  });
};

export default useCreateGroupConversation;
