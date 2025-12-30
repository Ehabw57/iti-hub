import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth';
import api from '@lib/api';

/**
 * @fileoverview Hook for fetching a single conversation detail
 */

/**
 * Hook for fetching single conversation detail
 * 
 * @param {string} conversationId - ID of the conversation to fetch
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query query object
 * 
 * @example
 * const { data: conversation, isLoading, error } = useConversation('conv-123');
 * 
 * // Access conversation data
 * if (conversation) {
 *   console.log(conversation.data.name);
 *   console.log(conversation.data.participants);
 * }
 */
export const useConversation = (conversationId) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const response = await api.get(`/conversations/${conversationId}`);

        console.log('[useConversation] Fetched conversation:', response.data);

      return response.data;
    },
    enabled: !!conversationId && isAuthenticated,
    staleTime: 0, // Always fresh
    refetchOnWindowFocus: false,
  });
};

export default useConversation;
