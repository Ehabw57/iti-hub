import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for asking questions and getting AI-generated answers from community posts
 * Like "Ask Reddit" - searches posts and generates answer with inline references
 * 
 * @returns {object} React Query mutation object
 * 
 * Response data:
 * {
 *   answer: string,           // AI-generated answer with [POST_1], [POST_2] references
 *   referencedPosts: Array<{  // Metadata for referenced posts
 *     _id: string,
 *     referenceId: string,    // e.g., "POST_1"
 *     author: { _id, username, fullName, profilePicture },
 *     contentPreview: string,
 *     createdAt: string,
 *     likesCount: number,     // Number of likes on the post
 *     commentsCount: number   // Number of comments on the post
 *   }>
 * }
 * 
 * @example
 * const askMutation = useAskCommunity();
 * askMutation.mutate({ question: 'What are the best React practices?' });
 */
export const useAskCommunity = () => {
  return useMutation({
    mutationFn: async ({ question, limit = 50 }) => {
      const response = await api.post('/ai/ask', {
        question,
        limit
      });
      return response.data;
    }
  });
};

export default useAskCommunity;
