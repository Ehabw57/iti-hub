import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth';
import { useNotifications } from '@hooks/queries/useNotifications';
import { useUnreadCount } from '@hooks/queries/useUnreadCount';
import { useMarkNotificationRead } from '@hooks/mutations/useMarkNotificationRead';
import { useMarkAllRead } from '@hooks/mutations/useMarkAllRead';
import { NotificationsList } from '@components/notifications/NotificationsList';
import { NotificationsToolbar } from '@components/notifications/NotificationsToolbar';
import { NotificationsStatus } from '@components/notifications/NotificationsStatus';

/**
 * @fileoverview Main controller for notifications center page
 * Orchestrates all notification components, hooks, and socket events
 * 
 * NOTE: Socket listeners are now handled globally by GlobalNotificationHandler
 * in the Layout component, so this controller no longer needs to set them up
 */

/**
 * Notifications Center Controller
 * Main page component for displaying and managing notifications
 * 
 * @example
 * <Route path="/notifications" element={<ProtectedRoute><NotificationsCenterController /></ProtectedRoute>} />
 */
export const NotificationsCenterController = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Local state for in-flight operations
  const [inFlightMap, setInFlightMap] = useState({});

  // Data hooks
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchNotifications,
  } = useNotifications();

  const {
    data: unreadCountData,
    refetch: refetchUnreadCount,
  } = useUnreadCount();

  // Mutation hooks
  const markAsReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllRead();

  // NOTE: Socket listeners are now handled globally in Layout component
  // No need to call useNotificationSocket() here anymore

  /**
   * Flatten paginated notifications
   */
  const flattenedNotifications = useMemo(() => {
    if (!notificationsData?.pages) return [];
    return notificationsData.pages.flatMap((page) => page.data?.notifications || []);
  }, [notificationsData]);

  /**
   * Extract pagination info
   */
  const paginationInfo = useMemo(() => {
    if (!notificationsData?.pages || notificationsData.pages.length === 0) {
      return { hasNextPage: false };
    }
    const lastPage = notificationsData.pages[notificationsData.pages.length - 1];
    return lastPage.data?.pagination || { hasNextPage: false };
  }, [notificationsData]);

  /**
   * Get unread count
   */
  const unreadCount = useMemo(() => {
    return unreadCountData?.data?.unreadCount || 0;
  }, [unreadCountData]);

  /**
   * Check if any mutation is in progress
   */
  const isDisabled = markAsReadMutation.isPending || markAllReadMutation.isPending;

  /**
   * Handle load more (infinite scroll)
   */
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      if (import.meta.env.DEV) {
        console.log('[NotificationsCenterController] Loading more notifications');
      }
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * Handle mark single notification as read
   */
  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      // Set in-flight state
      setInFlightMap((prev) => ({
        ...prev,
        [notificationId]: { markRead: true },
      }));

      try {
        await markAsReadMutation.mutateAsync({ notificationId });
      } catch (error) {
        console.error('[NotificationsCenterController] Error marking as read:', error);
      } finally {
        // Clear in-flight state
        setInFlightMap((prev) => {
          const { [notificationId]: removed, ...rest } = prev;
          return rest;
        });
      }
    },
    [markAsReadMutation]
  );

  /**
   * Handle mark all notifications as read
   */
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch (error) {
      console.error('[NotificationsCenterController] Error marking all as read:', error);
    }
  }, [markAllReadMutation]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('[NotificationsCenterController] Refreshing notifications');
    }
    refetchNotifications();
    refetchUnreadCount();
  }, [refetchNotifications, refetchUnreadCount]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Auth guard
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Please log in to view notifications
          </h2>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="notifications-center min-h-screen"
      style={{ backgroundColor: 'var(--color-neutral-50)' }}
    >
      {/* Toolbar */}
      <NotificationsToolbar
        unreadCount={unreadCount}
        disabled={isDisabled}
        onMarkAllRead={handleMarkAllRead}
        onRefresh={handleRefresh}
      />

      {/* Error state */}
      {isError && (
        <NotificationsStatus
          status="error"
          error={error?.response?.data?.error || { message: error?.message }}
          onRetry={handleRetry}
        />
      )}

      {/* Notifications list */}
      {!isError && (
        <NotificationsList
          items={flattenedNotifications}
          pagination={paginationInfo}
          loading={isLoading}
          loadingMore={isFetchingNextPage}
          disabled={isDisabled}
          onLoadMore={handleLoadMore}
          onItemMarkRead={handleMarkAsRead}
          inFlightMap={inFlightMap}
        />
      )}
    </div>
  );
};

export default NotificationsCenterController;
