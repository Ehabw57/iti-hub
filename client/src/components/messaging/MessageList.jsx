import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useIntlayer } from 'react-intlayer';
import MessageItem from './MessageItem';
import Loading from '@/components/common/Loading';
import Button from '@/components/common/Button';
import { useIntersectionObserver } from '@hooks/useIntersectionObserver';
import { useUIStore } from '@store/uiStore';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';

dayjs.extend(calendar);
dayjs.extend(localizedFormat);

/**
 * @fileoverview Message list component with auto-scroll and infinite loading
 * Displays messages in chronological order with date separators
 */

/**
 * MessageList - Displays a scrollable list of messages
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of message objects
 * @param {string} props.currentUserId - ID of the current user
 * @param {boolean} [props.isGroup=false] - Whether this is a group conversation
 * @param {Array} [props.participants=[]] - List of participants
 * @param {boolean} [props.loading=false] - Whether messages are loading
 * @param {boolean} [props.hasOlderMessages=false] - Whether more messages can be loaded
 * @param {boolean} [props.loadingOlder=false] - Whether older messages are loading
 * @param {Function} [props.onLoadOlder] - Callback to load older messages
 * @param {Function} [props.onRetryMessage] - Callback to retry failed message
 * @param {Function} [props.onImageClick] - Callback when image is clicked
 * @returns {JSX.Element}
 */
export function MessageList({
  items = [],
  currentUserId,
  conversation,
  participants = [],
  loading = false,
  hasOlderMessages = false,
  loadingOlder = false,
  onLoadOlder,
  onRetryMessage,
  onImageClick,
}) {
  const content = useIntlayer('conversationDetail');
  const { locale } = useUIStore();
  const isGroup = conversation?.isGroup;
  const scrollContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousItemsLengthRef = useRef(items.length);

  // Set dayjs locale
  dayjs.locale(locale);

  // Setup intersection observer for infinite scroll (load older messages)
  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (onLoadOlder && typeof onLoadOlder === 'function') {
        console.log('[MessageList] Loading older messages...');
        onLoadOlder();
      }
    },
    enabled: hasOlderMessages && !loadingOlder && !!onLoadOlder,
    threshold: 0.1
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isNewMessage = items.length > previousItemsLengthRef.current;
    const isAtBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Auto-scroll if user is near bottom or if it's a new message
    if (shouldAutoScroll && (isAtBottom || isNewMessage)) {
      container.scrollTop = container.scrollHeight;
    }

    previousItemsLengthRef.current = items.length;
  }, [items, shouldAutoScroll]);

  // Track if user manually scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isAtBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    setShouldAutoScroll(isAtBottom);
  }, []);

  // Group messages by date - MEMOIZED for performance
  const messageGroups = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    items.forEach((message) => {
      const messageDate = dayjs(message.createdAt).format('YYYY-MM-DD');

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [items]);

  // Format date separator - MEMOIZED for performance
  const formatDateSeparator = useCallback((dateString) => {
    const date = dayjs(dateString);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    if (date.isSame(today, 'day')) {
      return content.dateSeparators.today.value;
    } else if (date.isSame(yesterday, 'day')) {
      return content.dateSeparators.yesterday.value;
    } else {
      // Use localized date format
      return date.format('LL'); // e.g., "January 1, 2024" or "١ يناير ٢٠٢٤"
    }
  }, [content.dateSeparators]);

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading text={content.loadingMessages.value} />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-heading-6 text-neutral-900 mb-2">
          {content.noMessages.value}
        </h3>
        <p className="text-body-2 text-neutral-600">
          {content.noMessagesDescription.value}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
    >
      {/* Load Older Messages Button - Intersection Observer Target */}
      {hasOlderMessages && (
        <div ref={observerTarget} className="flex justify-center mb-4">
          {loadingOlder ? (
            <Loading text={content.loadingOlderMessages.value} size="sm" />
          ) : (
            <Button
              variant="text"
              onClick={onLoadOlder}
              className="text-secondary-600"
            >
              {content.loadingOlderMessages.value}
            </Button>
          )}
        </div>
      )}

      {/* Messages Grouped by Date */}
      {messageGroups.map((group) => (
        <div key={group.date} className="space-y-2">
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-neutral-100 px-3 py-1 rounded-full">
              <span className="text-xs text-neutral-600 font-medium">
                {formatDateSeparator(group.date)}
              </span>
            </div>
          </div>

          {/* Messages */}
          {group.messages.map((message) => (
            <MessageItem
              key={message._id}
              message={message}
              isOwn={message.sender?._id === currentUserId}
              isGroup={isGroup}
              participants={participants}
              onRetry={onRetryMessage}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default MessageList;
