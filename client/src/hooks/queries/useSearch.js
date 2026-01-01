import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * @fileoverview Unified hook for searching across users, posts, and communities
 * Makes three parallel infinite query API calls when a search query is provided
 */

/**
 * Hook for searching across all content types simultaneously with infinite scroll
 * 
 * @param {Object} options - Search options
 * @param {string} options.query - Search query (min 2 chars)
 * @param {number} [options.limit=20] - Results per page (max 50)
 * @returns {Object} Object containing infinite query results for users, posts, and communities
 * 
 * @example
 * const { users, posts, communities, isLoading, error } = useSearch({ 
 *   query: 'react',
 *   limit: 20 
 * });
 * 
 * // Access flattened results
 * const userResults = users.data?.pages.flatMap(page => page.data.users) || [];
 * const postResults = posts.data?.pages.flatMap(page => page.data.posts) || [];
 * const communityResults = communities.data?.pages.flatMap(page => page.data.communities) || [];
 */
export const useSearch = (options = {}) => {
  const { query = '', limit = 20 } = options;
  const isEnabled = query.length >= 2;

  // Search users with infinite scroll
  const users = useInfiniteQuery({
    queryKey: ['search', 'users', { query, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/search/users', {
        params: { q: query, page: pageParam, limit },
      });

      if (import.meta.env.DEV) {
        console.log('[useSearch] Users results page', pageParam, ':', response.data);
      }

      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination?.hasNextPage ? pagination.page + 1 : undefined;
    },
    enabled: isEnabled,
    initialPageParam: 1,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  // Search posts with infinite scroll
  const posts = useInfiniteQuery({
    queryKey: ['search', 'posts', { query, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/search/posts', {
        params: { q: query, page: pageParam, limit },
      });

      if (import.meta.env.DEV) {
        console.log('[useSearch] Posts results page', pageParam, ':', response.data);
      }

      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination?.hasNextPage ? pagination.page + 1 : undefined;
    },
    enabled: isEnabled,
    initialPageParam: 1,
    staleTime: 30 * 1000,
    retry: 1,
  });

  // Search communities with infinite scroll
  const communities = useInfiniteQuery({
    queryKey: ['search', 'communities', { query, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/search/communities', {
        params: { q: query, page: pageParam, limit },
      });

      if (import.meta.env.DEV) {
        console.log('[useSearch] Communities results page', pageParam, ':', response.data);
      }

      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination?.hasNextPage ? pagination.page + 1 : undefined;
    },
    enabled: isEnabled,
    initialPageParam: 1,
    staleTime: 30 * 1000,
    retry: 1,
  });

  return {
    users,
    posts,
    communities,
    isLoading: users.isLoading || posts.isLoading || communities.isLoading,
    error: users.error || posts.error || communities.error,
  };
};

export default useSearch;
