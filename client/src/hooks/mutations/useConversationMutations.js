import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@lib/api';
import toast from 'react-hot-toast';

/**
 * @fileoverview Mutation hooks for group conversation management
 * (rename, photo, add/remove members, leave, delete)
 */

/**
 * Update group name and/or image (admin only)
 *
 * @example
 * const updateGroup = useUpdateGroup();
 * updateGroup.mutate({ conversationId, name, image });
 */
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, name, image }) => {
      const formData = new FormData();

      if (name) {
        formData.append('name', name);
      }

      if (image) {
        formData.append('image', image);
      }

      const response = await api.patch(`/conversations/${conversationId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (import.meta.env.DEV) {
        console.log('[useUpdateGroup] Group updated:', response.data);
      }

      return response.data;
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversationId] });
      toast.success('Group updated successfully');
    },

    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update group');

      if (import.meta.env.DEV) {
        console.error('[useUpdateGroup] Error:', error);
      }
    },
  });
};

/**
 * Add a member to a group (admin only)
 *
 * @example
 * const addMember = useAddGroupMember();
 * addMember.mutate({ conversationId, userId });
 */
export const useAddGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }) => {
      const response = await api.post(`/conversations/${conversationId}/members`, { userId });

      if (import.meta.env.DEV) {
        console.log('[useAddGroupMember] Member added:', response.data);
      }

      return response.data;
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversationId] });
      toast.success('Member added to group');
    },

    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to add member');

      if (import.meta.env.DEV) {
        console.error('[useAddGroupMember] Error:', error);
      }
    },
  });
};

/**
 * Remove a member from a group (admin only)
 *
 * @example
 * const removeMember = useRemoveGroupMember();
 * removeMember.mutate({ conversationId, userId });
 */
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }) => {
      const response = await api.delete(
        `/conversations/${conversationId}/members/${userId}`
      );

      if (import.meta.env.DEV) {
        console.log('[useRemoveGroupMember] Member removed:', response.data);
      }

      return response.data;
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversationId] });
      toast.success('Member removed from group');
    },

    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to remove member');

      if (import.meta.env.DEV) {
        console.error('[useRemoveGroupMember] Error:', error);
      }
    },
  });
};

/**
 * Leave a group conversation (any member; admin role auto-transfers)
 *
 * @example
 * const leaveGroup = useLeaveGroup();
 * leaveGroup.mutate(conversationId);
 */
export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (conversationId) => {
      const response = await api.post(`/conversations/${conversationId}/leave`);

      if (import.meta.env.DEV) {
        console.log('[useLeaveGroup] Left group:', response.data);
      }

      return response.data;
    },

    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.removeQueries({ queryKey: ['conversations', conversationId] });
      toast.success('You have left the group');
      navigate('/messages');
    },

    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to leave group');

      if (import.meta.env.DEV) {
        console.error('[useLeaveGroup] Error:', error);
      }
    },
  });
};

/**
 * Delete a group conversation (admin only) — removes the group and all its messages
 *
 * @example
 * const deleteGroup = useDeleteGroup();
 * deleteGroup.mutate(conversationId);
 */
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (conversationId) => {
      const response = await api.delete(`/conversations/${conversationId}`);

      if (import.meta.env.DEV) {
        console.log('[useDeleteGroup] Group deleted:', response.data);
      }

      return response.data;
    },

    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.removeQueries({ queryKey: ['conversations', conversationId] });
      toast.success('Group deleted');
      navigate('/messages');
    },

    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete group');

      if (import.meta.env.DEV) {
        console.error('[useDeleteGroup] Error:', error);
      }
    },
  });
};
