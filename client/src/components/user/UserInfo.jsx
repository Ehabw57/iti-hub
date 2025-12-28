import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';
import { useUIStore } from '@store/uiStore';

dayjs.extend(relativeTime);

/**
 * UserInfo Component
 * Displays user name, username, timestamp with proper i18n and RTL support
 * Reusable across posts, comments, profiles
 */

/**
 * UserInfo - Display user information with timestamp
 * @param {Object} props
 * @param {string} props.fullName - User's full name
 * @param {string} props.username - User's username (without @)
 * @param {string} props.timestamp - ISO date string
 * @param {boolean} [props.edited=false] - Whether content was edited
 * @param {Function} props.onProfileClick - Handler for profile navigation
 * @param {string} [props.size='md'] - Size variant (currently unused, for future)
 */
export function UserInfo({ 
  fullName, 
  username, 
  timestamp, 
  edited = false,
  onProfileClick,
  size = 'md' 
}) {
  const { locale } = useUIStore();
  dayjs.locale(locale);

  return (
    <div className="flex-1 min-w-0">
      <button
        onClick={onProfileClick}
        className="font-semibold text-neutral-900 hover:underline truncate block"
      >
        {fullName}
      </button>
      <p className="text-sm text-neutral-600">
        @{username} · {dayjs(timestamp).fromNow()}
        {edited && <span className="ms-1">(edited)</span>}
      </p>
    </div>
  );
}
