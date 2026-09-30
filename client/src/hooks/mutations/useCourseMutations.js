import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * Request enrollment in a track (a manager must approve before membership)
 */
export function useRequestEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, branchId }) =>
      api.post('/tracks/enroll-requests', { trackId, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', 'check-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['tracks', 'my-enroll-requests'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/**
 * Cancel a pending enrollment request (request owner)
 */
export function useCancelEnrollmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId) => api.delete(`/tracks/enroll-requests/${requestId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks', 'check-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['tracks', 'my-enroll-requests'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/**
 * Approve or reject an enrollment request (track managers)
 */
export function useDecideEnrollmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, decision }) =>
      api.patch(`/tracks/enroll-requests/${requestId}/decision`, { decision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

/**
 * Update user profile (settings)
 */
export function useSettingsUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates) => api.patch('/users/me', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

/**
 * Change password (settings)
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      api.patch('/users/me/password', { currentPassword, newPassword }),
  });
}

/**
 * Update notification preferences (settings)
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences) =>
      api.patch('/users/me/notification-preferences', preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

/**
 * Delete account (settings)
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password) => api.delete('/users/me', { data: { password } }),
  });
}

// ---------------------------------------------------------------------------
// Track workspace: records (Teams links), folders, chat
// ---------------------------------------------------------------------------

/** Add a session record (Teams / meeting link) to a track (managers) */
export function useCreateTrackRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, ...payload }) =>
      api.post(`/tracks/${trackId}/records`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'records'] });
      // Folder rows show record counts — keep them fresh when records move
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'folders'] });
    },
  });
}

/** Update a session record (managers) */
export function useUpdateTrackRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, ...payload }) =>
      api.patch(`/tracks/records/${recordId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/** Delete a session record (managers) */
export function useDeleteTrackRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId }) => api.delete(`/tracks/records/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/** Create a folder in a track, scoped to one tab — kind: 'files' | 'records' (managers) */
export function useCreateTrackFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, name, kind }) =>
      api.post(`/tracks/${trackId}/folders`, { name, kind }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'folders'] });
    },
  });
}

/** Rename a file folder (managers) */
export function useUpdateTrackFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, name }) => api.patch(`/tracks/folders/${folderId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/** Delete a file folder — files fall back to the track root (managers) */
export function useDeleteTrackFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId }) => api.delete(`/tracks/folders/${folderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/** Send a chat message to a track room (members) */
export function useSendTrackChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, content }) =>
      api.post(`/tracks/${trackId}/chat`, { content }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'chat'] });
    },
  });
}

/** Delete a chat message (own messages, or any for track managers) */
export function useDeleteTrackChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId }) => api.delete(`/tracks/chat/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}










/** Assign / remove members on a track */
export function useUpdateTrackMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, ...payload }) =>
      api.patch(`/tracks/${trackId}/members`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Track content (files / videos)
// ---------------------------------------------------------------------------

/** Upload a file to a track (multipart field "file", optional isShared/folderId) */
export function useUploadTrackFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, file, isShared = false, folderId = null }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isShared', String(isShared));
      if (folderId) formData.append('folderId', folderId);
      return api.post(`/tracks/${trackId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'files'] });
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'shared-resources'] });
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'leaderboard'] });
      // Folder rows show file counts — keep them fresh after uploads
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'folders'] });
    },
  });
}

/** Delete a file */
export function useDeleteTrackFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/tracks/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}

/** Add a video to a track */
export function useAddTrackVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, ...payload }) =>
      api.post(`/tracks/${trackId}/videos`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'videos'] });
      queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId, 'leaderboard'] });
    },
  });
}

/** Delete a video */
export function useDeleteTrackVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/tracks/videos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}
















/** Toggle registration for an event */
export function useToggleEventRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId) => api.post(`/events/${eventId}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
