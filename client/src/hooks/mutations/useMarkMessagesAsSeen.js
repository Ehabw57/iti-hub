import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * @fileoverview Mutation hook for marking messages as seen in a conversation
 */

/**
 * Hook for marking all messages in a conversation as seen
 * Silent mutation - no toast notifications
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation object
 * 
 * @example
 * const markAsSeen = useMarkMessagesAsSeen();
 * 
 * // Call when user views conversation
 * markAsSeen.mutate({ conversationId: 'conv-123' });
 */
export const useMarkMessagesAsSeen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId }) => {
      const response = await api.put(`/conversations/${conversationId}/seen`);

      if (import.meta.env.DEV) {
        console.log('[useMarkMessagesAsSeen] Marked as seen:', conversationId);
      }

      return response.data;
    },

    onSuccess: (data, variables) => {
      const { conversationId } = variables;

      // Invalidate messages to update seen status
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });

      // Get current conversations to check if this conversation had unread
      // Use getQueriesData to find the conversations cache (any pagination params)
      const allConversationsData = queryClient.getQueriesData({ queryKey: ['conversations'] });
      let hadUnread = false;
      let cacheQueryKey = null;
      
      // Find the conversations cache that contains our conversation
      for (const [queryKey, queryData] of allConversationsData) {
        if (queryData?.data?.conversations) {
          const conversation = queryData.data.conversations.find((c) => c._id === conversationId);
          if (conversation) {
            hadUnread = (conversation.unreadCount || 0) > 0;
            cacheQueryKey = queryKey;
            break;
          }
        }
      }

      // Update the specific conversations cache (not all)
      if (cacheQueryKey) {
        queryClient.setQueryData(cacheQueryKey, (old) => {
          if (!old?.data?.conversations) return old;

          return {
            ...old,
            data: {
              ...old.data,
              conversations: old.data.conversations.map((conv) =>
                conv._id === conversationId
                  ? { ...conv, unreadCount: 0 }
                  : conv
              ),
            },
          };
        });
      }

      // Decrement global unread count ONLY if this conversation had unread
      if (hadUnread) {
        queryClient.setQueryData(['messages', 'unread-count'], (old) => {
          if (!old?.data) return old;
          
          const newCount = Math.max(0, (old.data.unreadCount || 0) - 1);
          
          if (import.meta.env.DEV) {
            console.log('[useMarkMessagesAsSeen] Decrementing unread count:', {
              conversationId,
              oldCount: old.data.unreadCount,
              newCount,
            });
          }

          return {
            ...old,
            data: {
              ...old.data,
              unreadCount: newCount,
            },
          };
        });
      }

      if (import.meta.env.DEV) {
        console.log('[useMarkMessagesAsSeen] Cache updated for conversation:', {
          conversationId,
          hadUnread,
        });
      }
    },

    onError: (error) => {
      // Silent error - don't show toast for seen status
      if (import.meta.env.DEV) {
        console.error('[useMarkMessagesAsSeen] Error:', error);
      }
    },
  });
};

export default useMarkMessagesAsSeen;
