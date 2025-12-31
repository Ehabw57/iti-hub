import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Fast search API
const fetchFastSearch = async (query) => {
  if (!query || query.trim().length === 0) {
    return { users: [], communities: [] };
  }
  
  const response = await api.get(`/search/fast?q=${encodeURIComponent(query)}`);
  return response.data;
};

export function useFastSearch(query) {
  return useQuery({
    queryKey: ["fastSearch", query],
    queryFn: () => fetchFastSearch(query),
    enabled: Boolean(query?.trim() && query.trim().length > 0),
    staleTime: 30_000,
  });
}

