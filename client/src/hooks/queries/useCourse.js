import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Fetch paginated tracks
 */
export function useTracks(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['tracks', filters],
    queryFn: ({ pageParam = 1 }) =>
      api.get('/tracks', { params: { page: pageParam, limit: 12, ...filters } }),
    getNextPageParam: (lastPage) => {
      const hasNext = lastPage.data?.meta?.pagination?.hasNextPage;
      const currentPage = lastPage.data?.meta?.pagination?.page;
      return hasNext ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single track with its branches
 */
export function useTrackDetail(trackId) {
  return useQuery({
    queryKey: ['tracks', trackId],
    queryFn: () => api.get(`/tracks/${trackId}`),
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch paginated branches
 * keepPreviousData: while the debounced search term changes the query key,
 * the previous result stays visible (no skeleton flash / focus loss) until
 * the new page arrives.
 */
export function useBranches(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['branches', filters],
    queryFn: ({ pageParam = 1 }) =>
      api.get('/branches', { params: { page: pageParam, limit: 12, ...filters } }),
    getNextPageParam: (lastPage) => {
      const hasNext = lastPage.data?.meta?.pagination?.hasNextPage;
      const currentPage = lastPage.data?.meta?.pagination?.page;
      return hasNext ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch a single branch with its tracks
 */
export function useBranchDetail(branchId) {
  return useQuery({
    queryKey: ['branches', branchId],
    queryFn: () => api.get(`/branches/${branchId}`),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch the authenticated user's enrollments
 */
export function useMyEnrollments() {
  return useQuery({
    queryKey: ['tracks', 'my-enrollments'],
    queryFn: () => api.get('/tracks/my-enrollments'),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Check if the current user is enrolled in a specific track
 */
export function useCheckEnrollment(trackId) {
  return useQuery({
    queryKey: ['tracks', 'check-enrollment', trackId],
    queryFn: () => api.get('/tracks/check-enrollment', { params: { trackId } }),
    enabled: !!trackId,
    staleTime: 2 * 60 * 1000,
  });
}


/**
 * Fetch tracks for a round (Round → Tracks view)
 */
export function useRoundTracks(roundId) {
  return useQuery({
    queryKey: ['rounds', roundId, 'tracks'],
    queryFn: () => api.get(`/rounds/${roundId}/tracks`),
    enabled: !!roundId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a track's members (instructors + students) for the settings modal
 */
export function useTrackMembers(trackId) {
  return useQuery({
    queryKey: ['tracks', trackId, 'members'],
    queryFn: () => api.get(`/tracks/${trackId}/members`),
    enabled: !!trackId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Search users for assignment dropdowns (instructors/students/branch_admin)
 */
export function useSearchAssignableUsers({ role, q = '', branchId } = {}) {
  return useQuery({
    queryKey: ['tracks', 'users', 'search', { role, q, branchId }],
    queryFn: () =>
      api.get('/tracks/users/search', { params: { role, q, branchId } }),
    enabled: !!role,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch files for a track (track members only)
 */
export function useTrackFiles(trackId) {
  return useQuery({
    queryKey: ['tracks', trackId, 'files'],
    queryFn: () => api.get(`/tracks/${trackId}/files`),
    enabled: !!trackId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch videos for a track (track members only)
 */
export function useTrackVideos(trackId) {
  return useQuery({
    queryKey: ['tracks', trackId, 'videos'],
    queryFn: () => api.get(`/tracks/${trackId}/videos`),
    enabled: !!trackId,
    staleTime: 2 * 60 * 1000,
  });
}


/**
 * Fetch chat messages for a track (paginated, oldest→newest order)
 */
export function useTrackChat(trackId, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['tracks', trackId, 'chat', { page, limit }],
    queryFn: () =>
      api.get(`/tracks/${trackId}/chat`, { params: { page, limit } }),
    enabled: !!trackId,
    staleTime: 0,
  });
}



/**
 * Fetch the authenticated user's own profile (role, branchId, ...)
 * GET /users/me returns the user document directly (no response envelope)
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.get('/users/me'),
    staleTime: 5 * 60 * 1000,
  });
}


/**
 * Fetch a track's enrollment request review queue (managers only)
 * @param {string} trackId
 * @param {string} status - pending | approved | rejected | all
 */
export function useTrackEnrollRequests(trackId, status = 'pending', { enabled = true, poll = false } = {}) {
  return useQuery({
    queryKey: ['tracks', trackId, 'enroll-requests', status],
    queryFn: () =>
      api.get(`/tracks/${trackId}/enroll-requests`, { params: { status } }),
    enabled: !!trackId && enabled,
    staleTime: 30 * 1000,
    // Managers poll so requests submitted while the page is open surface
    // without a manual refresh (window-focus refetch is disabled globally).
    refetchInterval: poll ? 30 * 1000 : false,
  });
}

/**
 * Fetch session records (Teams / meeting links) for a track
 */
export function useTrackRecords(trackId) {
  return useQuery({
    queryKey: ['tracks', trackId, 'records'],
    queryFn: () => api.get(`/tracks/${trackId}/records`),
    enabled: !!trackId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch a track's folders for one workspace tab — kind 'files' (default) or
 * 'records'. The two tabs have fully independent folder lists, so the kind
 * is part of the query key (each tab caches separately).
 */
export function useTrackFolders(trackId, kind = 'files') {
  return useQuery({
    queryKey: ['tracks', trackId, 'folders', kind],
    queryFn: () => api.get(`/tracks/${trackId}/folders`, { params: { kind } }),
    enabled: !!trackId,
    staleTime: 2 * 60 * 1000,
  });
}






/**
 * Fetch job board postings
 */
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs'),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch events (upcoming first) with registration flag
 */
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events'),
    staleTime: 2 * 60 * 1000,
  });
}
