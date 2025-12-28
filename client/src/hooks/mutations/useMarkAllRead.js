import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * @fileoverview Mutation hook for marking all notifications as read
 */

/**
 * Hook for marking all notifications as read
 * Includes optimistic update with rollback on error
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation object
 * 
 * @example
 * const markAllRead = useMarkAllRead();
 * markAllRead.mutate();
 */
export const useMarkAllRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read');

      if (import.meta.env.DEV) {
        console.log('[useMarkAllRead] Marked all as read');
      }

      return response.data;
    },
    // Optimistic update
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notifications', 'unread-count'] });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData(['notifications']);
      const previousCount = queryClient.getQueryData(['notifications', 'unread-count']);

      // Optimistically mark all as read
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              notifications: page.data.notifications.map((notification) => ({
                ...notification,
                isRead: true,
              })),
            },
          })),
        };
      });

      // Optimistically set unread count to 0
      queryClient.setQueryData(['notifications', 'unread-count'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            unreadCount: 0,
          },
        };
      });

      return { previousNotifications, previousCount };
    },
    // On error, rollback
    onError: (error, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(['notifications', 'unread-count'], context.previousCount);
      }

      console.error('[useMarkAllRead] Error:', error);
      // Note: Toast messages should be handled by the component using this hook
    },
    // On success, component can handle toast
    onSuccess: () => {
      // Component can show success toast if needed
    },
    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export default useMarkAllRead;
