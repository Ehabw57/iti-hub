// src/hooks/queries/useCommunities.js
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const fetchCommunities = async () => {
  const res = await api.get('/communities');
  // Axios response shape: res.data => { success, data }
  // Backend places actual payload inside res.data.data
  return res.data?.data ?? res.data; // fall back just in case
};

export default function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: fetchCommunities,
  });
}
