import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@lib/api';
import toast from 'react-hot-toast';

/**
 * @fileoverview Mutation hook for creating 1:1 conversations
 */

/**
 * Hook for creating a direct (1:1) conversation with another user
 * Returns existing conversation if one already exists
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation object
 * 
 * @example
 * const createConversation = useCreateConversation();
 * 
 * createConversation.mutate(
 *   { participantId: 'user-123' },
 *   {
 *     onSuccess: (data) => {
 *       console.log('Conversation created:', data.data.conversation);
 *     }
 *   }
 * );
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ participantId }) => {
      const response = await api.post('/conversations', {
        participantId,
      });

      if (import.meta.env.DEV) {
        console.log('[useCreateConversation] Conversation created:', response.data);
      }

      return response.data;
    },

    onSuccess: (data) => {
      const conversation = data.data.conversation;

      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Navigate to the conversation
      navigate(`/messages/${conversation._id}`);

      if (import.meta.env.DEV) {
        console.log('[useCreateConversation] Navigating to conversation:', conversation._id);
      }
    },

    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create conversation');

      if (import.meta.env.DEV) {
        console.error('[useCreateConversation] Error:', error);
      }
    },
  });
};

export default useCreateConversation;
