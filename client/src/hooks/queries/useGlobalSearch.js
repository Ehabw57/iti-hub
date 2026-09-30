import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Site-wide grouped search (sidebar search — Round 3 work order §1).
 * GET /search/all?q=... returns top matches grouped by type (branches,
 * tracks, users, communities, jobs, posts) with a hasMore flag per group.
 */
const fetchGlobalSearch = async (query) => {
  if (!query || query.trim().length === 0) {
    return null;
  }

  const response = await api.get(`/search/all?q=${encodeURIComponent(query)}`);
  return response.data?.data ?? null;
};

export function useGlobalSearch(query, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => fetchGlobalSearch(query),
    enabled: enabled && Boolean(query?.trim()),
    staleTime: 30_000,
  });
}

export default useGlobalSearch;