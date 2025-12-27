import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntlayer, useLocale } from 'react-intlayer';
import { 
  FiHeart, 
  FiMessageCircle, 
  FiRepeat, 
  FiUserPlus 
} from 'react-icons/fi';
import { formatNotificationTime } from '../../utils/notificationHelpers';
import notificationsContent from '../../content/notifications/notificationsCenter.content';

/**
 * @fileoverview Single notification item component
 * Displays notification with actor avatar, message, and actions
 */

/**
 * Maps notification types to their corresponding icons
 */
const NOTIFICATION_ICONS = {
  like: FiHeart,
  comment: FiMessageCircle,
  comment_like: FiHeart,
  reply: FiMessageCircle,
  repost: FiRepeat,
  follow: FiUserPlus,
};

/**
 * Single Notification Item Component
 * 
 * Features:
 * - Visual indicators for unread notifications
 * - Type-specific icons (like, comment, repost, follow)
 * - Actor grouping for multiple actors (e.g., "John and 2 others liked your post")
 * - Relative time display (e.g., "2 hours ago")
 * - Click navigation to related content
 * - Mark as read action with optimistic updates
 * 
 * @param {Object} props
 * @param {Object} props.notification - Notification object from API
 * @param {Function} props.onMarkAsRead - Callback to mark notification as read
 * @param {Function} [props.onNavigate] - Optional callback when notification is clicked (for additional side effects)
 * @param {Object} props.inFlight - In-flight state for this notification
 */
export const NotificationItem = ({ notification, onMarkAsRead, onNavigate, inFlight = {} }) => {
  const navigate = useNavigate();
  const content = useIntlayer(notificationsContent.key);
  const {locale} = useLocale();
  
  const {
    _id,
    type,
    actor,
    actorCount = 1,
    target,
    isRead,
    updatedAt,
  } = notification;

  // Get icon component for notification type
  const IconComponent = NOTIFICATION_ICONS[type] || FiHeart;

  // Handle notification click - navigate based on type
  const handleClick = () => {
    // Mark as read when clicked
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(_id);
    }

    // Call onNavigate callback if provided (for additional side effects)
    if (onNavigate) {
      onNavigate(notification);
    }

    // Navigate based on notification type
    if (type === 'follow' && actor) {
      navigate(`/profile/${actor.username}`);
    } else if (type === 'repost' && target) {
      // For reposts, navigate to the repost itself (the notification target IS the repost)
      const repostId = target._id || target;
      navigate(`/posts/${repostId}`);
    } else if (type === 'comment' && target) {
      // Navigate to post with comment highlighted
      const commentId = target._id || target;
      const postId = target.post || target._id;
      navigate(`/posts/${postId}#comment-${commentId}`);
    } else if (type === 'comment_like' && target) {
      // Navigate to post with comment highlighted
      const commentId = target._id || target;
      const postId = target.post;
      if (postId) {
        navigate(`/posts/${postId}#comment-${commentId}`);
      }
    } else if (type === 'reply' && target) {
      // Navigate to post with comment highlighted
      const commentId = target._id || target;
      const postId = target.post;
      if (postId) {
        navigate(`/posts/${postId}#comment-${commentId}`);
      }
    } else if (type === 'like' && target) {
      // For likes, navigate to the post
      const postId = target._id || target;
      navigate(`/posts/${postId}`);
    }
  };

  // Memoize formatted time to avoid recalculation
  const formattedTime = useMemo(
    () => formatNotificationTime(updatedAt, content, locale),
    [updatedAt, content, locale]
  );

  // Construct actor display text
  const actorText = useMemo(() => {
    if (!actor) return content.unknownUser;
    
    const actorName = actor.fullName || actor.username || content.unknownUser;
    
    if (actorCount === 1) {
      return actorName;
    } else if (actorCount === 2) {
      // Use i18n function with parameters
      return content.actorGroupingTwo[locale]({ 
        actor1: actorName, 
        actor2: content.oneOther.value
      });
    } else {
      // Use i18n function with parameters
      return content.actorGroupingMultiple[locale]({ 
        actor1: actorName, 
        count: actorCount - 1 
      });
    }
  }, [actor, actorCount, content, locale]);

  // Construct notification message using i18n
  const notificationMessage = useMemo(() => {
    const notificationTypes = content.notificationTypes;
    
    if (!notificationTypes) {
      return content.defaultInteraction;
    }

    // Note: We don't pass actor name here since it's displayed separately
    // The {{actor}} placeholder in the i18n string is just removed
    switch (type) {
      case 'like':
        return notificationTypes.like[locale]({ actor: '' })
      case 'comment':
        return notificationTypes.comment[locale]({ actor: '' })
      case 'comment_like':
        return notificationTypes.comment_like[locale]({ actor: '' })
      case 'reply':
        return notificationTypes.reply[locale]({ actor: '' })
      case 'repost':
        return notificationTypes.repost[locale]({ actor: '' })
      case 'follow':
        return notificationTypes.follow[locale]({ actor: '' })
      default:
        return content.defaultInteraction;
    }
  }, [type, content, locale]);

  // Truncate post content preview
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get display content based on notification type
  const displayContent = useMemo(() => {
    if (type === 'repost' && target) {
      // For reposts, show the repost comment if available
      return target.repostComment || target.content;
    }
    // For other types, show the target content
    return target?.content;
  }, [type, target]);

  return (
    <div
      className="relative flex gap-3 p-4 border-b transition-colors duration-200 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-100"
      style={{
        backgroundColor: !isRead ? 'var(--color-secondary-300)' : 'transparent',
        borderColor: 'var(--color-neutral-200)'
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${actorText} ${notificationMessage}`}
    >
      {/* Unread Indicator */}
      {!isRead && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1" 
          style={{ backgroundColor: 'var(--color-secondary-500)' }}
        />
      )}

      {/* Actor Avatar */}
      <div className="relative shrink-0">
        <img
          src={actor?.profilePicture || '/default-avatar.png'}
          alt={actor?.fullName || actor?.username || 'User'}
          className="w-12 h-12 rounded-full object-cover"
        />
        
        {/* Notification Type Icon Badge */}
        <div 
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 
              type === 'like' || type === 'comment_like' ? 'var(--color-primary-500)' :
              type === 'comment' || type === 'reply' ? 'var(--color-secondary-500)' :
              type === 'repost' ? 'var(--color-success)' :
              type === 'follow' ? '#a855f7' : 'var(--color-neutral-500)'
          }}
        >
          <IconComponent className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Notification Content */}
      <div className="flex-1 min-w-0">
        {/* Actor Names and Action */}
        <p className="text-body-2">
          <span className="font-semibold text-neutral-900">{actorText}</span>
          {' '}
          <span className="text-neutral-600">{notificationMessage}</span>
        </p>

        {/* Post Preview (if applicable) */}
        {displayContent && (
          <p className="mt-1 text-body-2 text-neutral-600 line-clamp-2">
            "{truncateText(displayContent, 50)}"
          </p>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-caption text-neutral-500">
          {formattedTime}
        </p>
      </div>

      {/* Mark as Read Button (only shown if unread) */}
      {!isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigation when clicking mark as read
            onMarkAsRead(_id);
          }}
          disabled={inFlight.markRead}
          className="shrink-0 text-button disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'var(--color-secondary-600)' }}
          aria-label={content.markAsRead}
        >
          {inFlight.markRead ? content.loading : '✓'}
        </button>
      )}

      {/* New Badge */}
      {!isRead && (
        <span 
          className="absolute top-2 right-2 px-2 py-0.5 text-caption font-medium rounded-full"
          style={{
            backgroundColor: 'var(--color-secondary-100)',
            color: 'var(--color-secondary-800)'
          }}
        >
          {content.newBadge}
        </span>
      )}
    </div>
  );
};

export default NotificationItem;
