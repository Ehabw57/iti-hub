import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from './useSocketEvent';

/**
 * @fileoverview Hook for handling real-time notification events via WebSocket
 * Listens to socket events and updates React Query cache accordingly
 */

/**
 * Hook for managing notification socket events
 * Automatically updates cache when notifications are received in real-time
 * 
 * @returns {{ isConnected: boolean, socket: Socket | null }}
 * 
 * @example
 * function NotificationsController() {
 *   useNotificationSocket(); // Setup listeners
 * }
 */
export const useNotificationSocket = () => {
  const queryClient = useQueryClient();

  /**
   * Handle new notification event
   * Adds notification to the beginning of the list and increments unread count
   */
  const handleNewNotification = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[useNotificationSocket] New notification received:', data);
      }

      const { notification, timestamp } = data;

      if (!notification) {
        console.warn('[useNotificationSocket] Received empty notification');
        return;
      }

      // Add notification to cache (prepend to first page)
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old || !old.pages || old.pages.length === 0) {
          if (import.meta.env.DEV) {
            console.log('[useNotificationSocket] No existing cache, skipping cache update');
          }
          return old;
        }

        const firstPage = old.pages[0];
        if (!firstPage || !firstPage.data) {
          if (import.meta.env.DEV) {
            console.log('[useNotificationSocket] First page invalid, skipping cache update');
          }
          return old;
        }

        if (import.meta.env.DEV) {
          console.log('[useNotificationSocket] Adding notification to cache:', notification._id);
        }

        const updatedFirstPage = {
          ...firstPage,
          data: {
            ...firstPage.data,
            notifications: [notification, ...(firstPage.data.notifications || [])],
          },
        };

        return {
          ...old,
          pages: [updatedFirstPage, ...old.pages.slice(1)],
        };
      });

      // Increment unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old) => {
        if (!old) {
          if (import.meta.env.DEV) {
            console.log('[useNotificationSocket] No unread count cache, skipping');
          }
          return old;
        }
        
        if (import.meta.env.DEV) {
          console.log('[useNotificationSocket] Incrementing unread count');
        }

        return {
          ...old,
          data: {
            ...old.data,
            unreadCount: (old.data.unreadCount || 0) + 1,
          },
        };
      });

      // Invalidate queries to trigger re-render
      queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'], refetchType: 'none' });

      // Optional: Show toast notification (commented out - can be added to component level)
      // if (notification.actor?.username) {
      //   const actorName = notification.actor.username;
      //   toast.success(`${actorName} interacted with your content`, { duration: 3000 });
      // }
    },
    [queryClient]
  );

  /**
   * Handle notification update event (for grouped notifications)
   * Updates existing notification in cache
   */
  const handleNotificationUpdate = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[useNotificationSocket] Notification update received:', data);
      }

      const { notification, timestamp } = data;

      if (!notification) {
        console.warn('[useNotificationSocket] Received empty notification update');
        return;
      }

      // Update notification in cache
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old || !old.pages) {
          if (import.meta.env.DEV) {
            console.log('[useNotificationSocket] No cache for update, skipping');
          }
          return old;
        }

        if (import.meta.env.DEV) {
          console.log('[useNotificationSocket] Updating notification in cache:', notification._id);
        }

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              notifications: (page.data.notifications || []).map((n) =>
                n._id === notification._id ? notification : n
              ),
            },
          })),
        };
      });

      // Invalidate to trigger re-render
      queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'none' });
    },
    [queryClient]
  );

  /**
   * Handle unread count update event
   * Updates unread count in cache
   */
  const handleCountUpdate = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[useNotificationSocket] Count updated:', data);
      }

      const { unreadCount, timestamp } = data;

      // Update unread count in cache
      queryClient.setQueryData(['notifications', 'unread-count'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            unreadCount,
          },
        };
      });
    },
    [queryClient]
  );

  /**
   * Handle notification read event
   * Updates notification and unread count in cache
   */
  const handleNotificationRead = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[useNotificationSocket] Notification read:', data);
      }

      const { notificationId, unreadCount, timestamp } = data;

      // Mark notification as read in cache
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

      // Update unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            unreadCount,
          },
        };
      });
    },
    [queryClient]
  );

  // Setup socket event listeners
  useSocketEvent('notification:new', handleNewNotification, [handleNewNotification]);
  useSocketEvent('notification:update', handleNotificationUpdate, [handleNotificationUpdate]);
  useSocketEvent('notification:count', handleCountUpdate, [handleCountUpdate]);
  useSocketEvent('notification:read', handleNotificationRead, [handleNotificationRead]);
};

export default useNotificationSocket;
