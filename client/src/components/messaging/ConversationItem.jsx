import { memo } from 'react';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useIntlayer, useLocale } from 'react-intlayer';
import { useAuthStore } from '@store/auth';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * @fileoverview Single conversation item in the messages list
 * Displays conversation preview with avatar, name, last message, and unread count
 * Memoized to prevent unnecessary re-renders when parent updates
 */

/**
 * ConversationItem - Displays a single conversation in the list
 * Memoized for performance - only re-renders when props change
 * 
 * @param {Object} props
 * @param {Object} props.conversation - Conversation data
 * @param {Function} props.onOpen - Callback when conversation is clicked
 * @param {boolean} [props.isActive=false] - Whether this conversation is currently open
 * @returns {JSX.Element}
 */
export const ConversationItem = memo(function ConversationItem({ conversation, onOpen, isActive = false }) {
  const content = useIntlayer('messagesList');
  const { locale } = useLocale();
  const currentUser = useAuthStore((state) => state.user);

  if (!conversation) return null;

  const {
    _id,
    isGroup,
    name,
    image,
    participants,
    lastMessage,
    unreadCount,
    updatedAt,
  } = conversation;

  // Determine display name and avatar
  let displayName = name;
  let displayAvatar = image;

  if (!isGroup && participants) {
    // Find the other participant (not current user)
    const otherParticipant = participants.find(
      (p) => p._id !== currentUser?._id
    );
    displayName = otherParticipant?.fullName || content.unknownUser.value;
    displayAvatar = otherParticipant?.profilePicture;
  }

  // Format last message preview
  const getMessagePreview = () => {
    if (!lastMessage) return '';

    const { content: messageContent, image: messageImage, senderId } = lastMessage;

    // Check if current user sent the message
    const isOwnMessage = senderId?._id === currentUser?._id;
    let prefix = (isOwnMessage ? content.you.value  : senderId?.fullName) + ': ';
    if (!senderId)
        prefix = content.initialMessage.value

    if (messageImage && !messageContent) {
      return `${prefix}${content.photoMessage.value}`;
    }

    return `${prefix}${messageContent || ''}`;
  };

  // Format relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const now = dayjs();
    const time = dayjs(timestamp);
    const diffInMinutes = now.diff(time, 'minute');
    const diffInHours = now.diff(time, 'hour');
    const diffInDays = now.diff(time, 'day');

    if (diffInMinutes < 1) return content.timeLabels.justNow.value;
    if (diffInMinutes < 60) return content.timeLabels.minutes[locale]({ count: diffInMinutes });
    if (diffInHours < 24) return content.timeLabels.hours[locale]({ count: diffInHours });
    if (diffInDays < 7) return content.timeLabels.days[locale]({ count: diffInDays });
    
    return time.format('MMM D');
  };

  const messagePreview = getMessagePreview();
  const timeLabel = formatTime(updatedAt || lastMessage?.createdAt);
  const hasUnread = unreadCount > 0;

  return (
    <div
      onClick={() => onOpen(_id)}
      className={`
        flex items-start gap-3
        p-4
        cursor-pointer
        transition-colors duration-200
        border-b border-neutral-200
        hover:bg-neutral-50
        ${isActive ? 'bg-blue-50 border-l-4 border-l-secondary-500' : ''}
        ${hasUnread ? 'bg-blue-50/30' : ''}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(_id);
        }
      }}
    >
      {/* Avatar Section */}
      <div className="relative shrink-0">
        <UserAvatar
          src={displayAvatar}
          alt={displayName}
          size="md"
          className="ring-2 ring-white"
        />
        {/* Unread Badge Overlay */}
        {hasUnread && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          {/* Name */}
          <h3
            className={`
              text-md  truncate
              ${hasUnread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-800'}
            `}
          >
            {displayName}
          </h3>
            {isGroup && participants && (
              <span className="text-xs text-left text-neutral-500 font-normal ">
                {participants.length === 1
                  ? content.member.value
                  : content.groupMembers[locale]({ count: participants.length })}
              </span>
            )}

          {/* Timestamp */}
          <span
            className={`
              text-caption rtl:mr-auto ltr:ml-auto
              ${hasUnread ? 'text-secondary-600 font-medium' : 'text-neutral-500'}
            `}
          >
            {timeLabel}
          </span>
        </div>

        {/* Last Message Preview */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={`
              text-body-2 truncate
              ${hasUnread ? 'text-neutral-700 font-medium' : 'text-neutral-600'}
            `}
          >
            {messagePreview || content.noMessages}
          </p>

          {/* Unread Count Badge */}
          {hasUnread && (
            <span className="shrink-0 px-2 py-0.5 bg-secondary-500 text-white text-xs font-semibold rounded-full">
              {content.newBadge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConversationItem;
