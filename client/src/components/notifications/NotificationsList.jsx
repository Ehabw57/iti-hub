import { useIntlayer } from 'react-intlayer';
import { NotificationItem } from './NotificationItem';
import { NotificationSkeleton } from './NotificationSkeleton';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import notificationsContent from '../../content/notifications/notificationsCenter.content';
import { FiInbox } from 'react-icons/fi';

/**
 * @fileoverview List wrapper component for notifications
 * Handles infinite scroll, loading states, and empty states
 */

/**
 * Notifications list component with infinite scroll
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of notification objects
 * @param {Object} props.pagination - Pagination info { page, limit, total, hasNextPage }
 * @param {boolean} props.loading - Initial loading state
 * @param {boolean} props.loadingMore - Loading more state
 * @param {boolean} props.disabled - Disabled state (during mutations)
 * @param {Function} props.onLoadMore - Callback when user scrolls to bottom
 * @param {Function} props.onItemMarkRead - Callback when mark as read is clicked
 * @param {Object} props.inFlightMap - Map of notification IDs to in-flight states
 */
export const NotificationsList = ({
  items = [],
  pagination = {},
  loading = false,
  loadingMore = false,
  disabled = false,
  onLoadMore,
  onItemMarkRead,
  inFlightMap = {},
}) => {
  const content = useIntlayer(notificationsContent.key);

  // Setup intersection observer for infinite scroll
  const { observerTarget } = useIntersectionObserver({
    onIntersect: onLoadMore,
    enabled: !loading && !loadingMore && pagination.hasNextPage,
    threshold: 0.1
  });

  /**
   * Render empty state
   */
  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--color-neutral-100)' }}
        >
          <FiInbox className="w-10 h-10" style={{ color: 'var(--color-neutral-400)' }} />
        </div>
        <h3 className="text-heading-5 mb-2" style={{ color: 'var(--color-neutral-900)' }}>
          {content.noNotifications || 'No notifications yet'}
        </h3>
        <p className="text-body-2 text-center max-w-sm" style={{ color: 'var(--color-neutral-500)' }}>
          {content.noNotificationsDescription || 'When someone interacts with your content, you\'ll see it here'}
        </p>
      </div>
    );
  }

  /**
   * Render initial loading state
   */
  if (loading && items.length === 0) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, index) => (
          <NotificationSkeleton key={index} />
        ))}
      </div>
    );
  }

  /**
   * Render notifications list
   */
  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      {items.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkAsRead={onItemMarkRead}
          inFlight={inFlightMap[notification._id] || {}}
        />
      ))}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 text-body-2" style={{ color: 'var(--color-neutral-500)' }}>
            <div 
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ 
                borderColor: 'var(--color-neutral-300)',
                borderTopColor: 'var(--color-secondary-500)'
              }}
            />
            {content.loadingMore || 'Loading more...'}
          </div>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {pagination.hasNextPage && !loadingMore && (
        <div ref={observerTarget} className="h-4" />
      )}

      {/* End of list indicator */}
      {!pagination.hasNextPage && items.length > 0 && (
        <div className="py-4 text-center text-body-2" style={{ color: 'var(--color-neutral-500)' }}>
          {content.endOfList || 'You\'re all caught up!'}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
