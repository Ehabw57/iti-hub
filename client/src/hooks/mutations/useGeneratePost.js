import { useMutation } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for generating post content using AI
 * Takes user's idea/text and returns AI-enhanced post content with hashtags
 * @returns {object} React Query mutation object
 * Response data: { content: string, hashtags: string[] }
 */
export const useGeneratePost = () => {
  return useMutation({
    mutationFn: async ({ text, tone = 'professional', withEmojis = false }) => {
      const response = await api.post('/ai/generate-post', {
        text,
        tone,
        withEmojis
      });
      return response.data;
    }
  });
};

export default useGeneratePost;
