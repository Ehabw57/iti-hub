import { FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import { useIntlayer } from 'react-intlayer';
import notificationsContent from '../../content/notifications/notificationsCenter.content';

/**
 * @fileoverview Toolbar component for notifications page
 * Displays title, unread count, and action buttons
 */

/**
 * Notifications toolbar component
 * 
 * @param {Object} props
 * @param {number} props.unreadCount - Number of unread notifications
 * @param {boolean} props.disabled - Disabled state (during mutations)
 * @param {Function} props.onMarkAllRead - Callback when mark all as read is clicked
 * @param {Function} props.onRefresh - Callback when refresh is clicked
 */
export const NotificationsToolbar = ({
  unreadCount = 0,
  disabled = false,
  onMarkAllRead,
  onRefresh,
}) => {
  const content = useIntlayer(notificationsContent.key);

  return (
    <div 
      className="sticky top-0 z-10 border-b px-4 py-3"
      style={{
        backgroundColor: 'var(--color-neutral-50)',
        borderColor: 'var(--color-neutral-200)'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left section: Title and badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-heading-4" style={{ color: 'var(--color-neutral-900)' }}>
            {content.pageTitle || 'Notifications'}
          </h1>
          {unreadCount > 0 && (
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium"
              style={{
                backgroundColor: 'var(--color-secondary-100)',
                color: 'var(--color-secondary-800)'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Right section: Action buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-3 py-2 text-button rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              color: 'var(--color-neutral-700)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)')}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label={content.refresh || 'Refresh'}
          >
            <FiRefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{content.refresh || 'Refresh'}</span>
          </button>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-3 py-2 text-button text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-secondary-600)' }}
              onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)')}
              onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)')}
              aria-label={content.markAllAsRead || 'Mark all as read'}
            >
              <FiCheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{content.markAllAsRead || 'Mark all read'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsToolbar;
