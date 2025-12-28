import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Hook for fetching community details
 * @param {string} communityId - The community ID
 * @returns {object} React Query query object
 */
export const useCommunityDetails = (communityId) => {
  return useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const response = await api.get(`/communities/${communityId}`);
      return response.data.data.community; // Extract community from nested structure
    },
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching community feed with infinite scroll
 * @param {string} communityId - The community ID
 * @returns {object} React Query infinite query object
 */
export const useCommunityFeed = (communityId) => {
  return useInfiniteQuery({
    queryKey: ['community', communityId, 'feed'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/communities/${communityId}/feed`, {
        params: {
          page: pageParam,
          limit: 10
        }
      });
      // Extract data from API response structure
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      // Check pagination.hasNextPage from API response
      return lastPage.pagination?.hasNextPage ? lastPage.pagination.page + 1 : undefined;
    },
    enabled: !!communityId,
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for fetching all communities list
 * @param {object} filters - Filter options (search, tag, sort, etc.)
 * @returns {object} React Query query object
 */
export const useCommunitiesList = (filters = {}) => {
  return useQuery({
    queryKey: ['communities', 'list', filters],
    queryFn: async () => {
      const response = await api.get('/communities', {
        params: filters
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching community members with pagination
 * @param {string} communityId - The community ID
 * @param {object} options - Query options (page, limit, role filter)
 * @returns {object} React Query query object
 */
export const useCommunityMembers = (communityId, options = {}) => {
  const { page = 1, limit = 20, role } = options;
  
  return useQuery({
    queryKey: ['community', communityId, 'members', { page, limit, role }],
    queryFn: async () => {
      const response = await api.get(`/communities/${communityId}/members`, {
        params: { page, limit, role }
      });
      return response.data.data;
    },
    enabled: !!communityId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for fetching community members with infinite scroll
 * @param {string} communityId - The community ID
 * @param {object} options - Query options (limit, role filter)
 * @returns {object} React Query infinite query object
 */
export const useCommunityMembersInfinite = (communityId, options = {}) => {
  const { limit = 20, role } = options;
  
  return useInfiniteQuery({
    queryKey: ['community', communityId, 'members', 'infinite', { limit, role }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/communities/${communityId}/members`, {
        params: {
          page: pageParam,
          limit,
          role
        }
      });
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasNextPage ? lastPage.pagination.page + 1 : undefined;
    },
    enabled: !!communityId,
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export default {
  useCommunityDetails,
  useCommunityFeed,
  useCommunitiesList,
  useCommunityMembers,
  useCommunityMembersInfinite
};
