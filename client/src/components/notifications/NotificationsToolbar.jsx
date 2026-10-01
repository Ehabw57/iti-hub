import { FiRefreshCw } from 'react-icons/fi';
import { useIntlayer } from 'react-intlayer';

/**
 * @fileoverview Toolbar for notifications page — title + actions + filter tabs.
 * Matches /screens notification mockup.
 */

const TABS = [
  { id: 'all', labelKey: 'tabAll' },
  { id: 'likes', labelKey: 'tabLikes' },
  { id: 'comments', labelKey: 'tabComments' },
  { id: 'follows', labelKey: 'tabFollows' },
];

export const NotificationsToolbar = ({
  unreadCount = 0,
  disabled = false,
  activeTab = 'all',
  onTabChange,
  onMarkAllRead,
  onRefresh,
}) => {
  const content = useIntlayer('notificationsCenter');

  return (
    <div className="bg-neutral-50/95 backdrop-blur-md border-b border-outline px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <h1 className="text-heading-4 font-bold text-neutral-900">
          {content.pageTitle || 'Notifications'}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            aria-label={content.refresh || 'Refresh'}
            className="p-2 rounded-full text-neutral-600 hover:bg-neutral-200/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className="w-4.5 h-4.5" />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={disabled}
              className="text-button font-semibold text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={content.markAllAsRead || 'Mark all as read'}
            >
              {content.markAllAsRead || 'Mark all as read'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs — scroll horizontally on narrow screens but with the
          scrollbar hidden (work order §5). The underline sits inside the
          nav's box (padding-bottom instead of negative margins) so no
          vertical overflow/scrollbar is ever created. */}
      <nav
        className="flex items-center gap-6 mt-3 overflow-x-auto no-scrollbar"
        aria-label="Filter notifications"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`pb-2 text-body-2 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {content[tab.labelKey]?.value || tab.id}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default NotificationsToolbar;
