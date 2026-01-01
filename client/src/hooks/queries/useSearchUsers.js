import { useQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * @fileoverview Hook for searching users
 * Uses the /search/users endpoint with optional authentication
 * This is a standalone hook for components that only need user search
 * For comprehensive search across all types, use useSearch from './useSearch'
 */

/**
 * Hook for searching users by username, fullName, or bio
 * 
 * @param {Object} options - Search options
 * @param {string} options.query - Search query (min 2 chars)
 * @param {string} [options.specialization] - Filter by specialization
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Results per page (max 50)
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query query object
 * 
 * @example
 * const { data, isLoading, error } = useSearchUsers({ 
 *   query: 'john',
 *   page: 1,
 *   limit: 20 
 * });
 * 
 * // Access users
 * const users = data?.data?.users || [];
 */
export const useSearchUsers = (options = {}) => {
  const { query = '', specialization, page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: ['search', 'users', { query, specialization, page, limit }],
    queryFn: async () => {
      const response = await api.get('/search/users', {
        params: {
          q: query,
          specialization,
          page,
          limit,
        },
      });

      if (import.meta.env.DEV) {
        console.log('[useSearchUsers] Search results:', response.data);
      }

      return response.data;
    },
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 30 * 1000, // 30 seconds - search results can be cached briefly
    retry: 1, // Retry once on failure
  });
};

export default useSearchUsers;
