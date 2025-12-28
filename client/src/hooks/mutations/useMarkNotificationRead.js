import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@lib/api';

/**
 * @fileoverview Mutation hook for marking a single notification as read
 */

/**
 * Hook for marking a single notification as read
 * Includes optimistic update with rollback on error
 * 
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation object
 * 
 * @example
 * const markAsRead = useMarkNotificationRead();
 * markAsRead.mutate({ notificationId: '123' });
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId }) => {
      const response = await api.put(`/notifications/${notificationId}/read`);

      if (import.meta.env.DEV) {
        console.log('[useMarkNotificationRead] Marked as read:', notificationId);
      }

      return response.data;
    },
    // Optimistic update
    onMutate: async ({ notificationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notifications', 'unread-count'] });

      // Snapshot previous values
      const previousNotifications = queryClient.getQueryData(['notifications']);
      const previousCount = queryClient.getQueryData(['notifications', 'unread-count']);

      // Optimistically update notifications
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              notifications: page.data.notifications.map((notification) =>
                notification._id === notificationId
                  ? { ...notification, isRead: true }
                  : notification
              ),
            },
          })),
        };
      });

      // Optimistically decrement unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old) => {
        if (!old?.data?.unreadCount) return old;
        return {
          ...old,
          data: {
            ...old.data,
            unreadCount: Math.max(0, old.data.unreadCount - 1),
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

      console.error('[useMarkNotificationRead] Error:', error);
      // Note: Toast messages should be handled by the component using this hook
    },
    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export default useMarkNotificationRead;
