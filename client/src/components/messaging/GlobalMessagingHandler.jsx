import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@hooks/socket/useSocketEvent';
import { useAuthStore } from '@store/auth';

/**
 * @fileoverview Global handler for real-time messaging events
 * This component must be mounted at app/layout level to ensure
 * message listeners are active across all pages
 * 
 * Similar to GlobalNotificationHandler but for messaging events
 */

/**
 * Global Messaging Handler Component
 * 
 * Sets up socket listeners for real-time message updates
 * Updates React Query cache when messages arrive or are seen
 * 
 * IMPORTANT: This component must be mounted in a parent component
 * that remains mounted throughout the application lifecycle (e.g., Layout)
 * 
 * @returns {null} Renders nothing, only manages side effects
 * 
 * @example
 * // In Layout.jsx
 * export default function Layout() {
 *   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
 *   return (
 *     <>
 *       <Navbar />
 *       {isAuthenticated && <GlobalNotificationHandler />}
 *       {isAuthenticated && <GlobalMessagingHandler />}
 *       <Outlet />
 *     </>
 *   );
 * }
 */
export const GlobalMessagingHandler = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  /**
   * Handle new message event (global - updates sidebar and conversations list)
   * Only increments unread count if message is from someone else
   */
  const handleNewMessage = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[GlobalMessagingHandler] New message received:', data);
      }

      const { 
        conversationId, 
        senderId, 
        content, 
        image,
        senderName,
        timestamp 
      } = data;

      // Don't increment unread count for messages sent by current user
      if (senderId === currentUser?._id) {
        return;
      }

      // Update conversations list cache (for ConversationItem badges)
      queryClient.setQueryData(['conversations', { page: 1, limit: 50 }], (old) => {
        if (!old?.data?.conversations) return old;

        const conversations = old.data.conversations;
        const convIndex = conversations.findIndex((c) => c._id === conversationId);

        if (convIndex === -1) {
          // Conversation not in cache, invalidate to refetch
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          return old;
        }

        const updatedConv = {
          ...conversations[convIndex],
          lastMessage: {
            content,
            image,
            senderId: { _id: senderId, fullName: senderName },
            createdAt: timestamp,
          },
          updatedAt: timestamp,
          // Increment unread count for this conversation
          unreadCount: (conversations[convIndex].unreadCount || 0) + 1,
        };

        // Move conversation to top of list
        const newConversations = [
          updatedConv,
          ...conversations.slice(0, convIndex),
          ...conversations.slice(convIndex + 1),
        ];

        return {
          ...old,
          data: {
            ...old.data,
            conversations: newConversations,
          },
        };
      });

      // Update sidebar unread count (number of conversations with unread)
      // We need to check if this conversation was already counted
      queryClient.setQueryData(['messages', 'unread-count'], (old) => {
        if (!old?.data) return old;

        // Check if this conversation already had unread messages
        const conversations = queryClient.getQueryData(['conversations', { page: 1, limit: 50 }]);
        const conv = conversations?.data?.conversations?.find((c) => c._id === conversationId);
        
        // If conversation already had unread > 1 (was already counted), don't increment sidebar count
        // We increment unread in conversation cache before this runs, so check if it was > 1 before
        const wasAlreadyUnread = conv && conv.unreadCount > 1;

        if (wasAlreadyUnread) {
          // Conversation was already in unread state, sidebar count stays same
          return old;
        }

        // This is a new unread conversation, increment sidebar count
        return {
          ...old,
          data: {
            ...old.data,
            unreadCount: (old.data.unreadCount || 0) + 1,
          },
        };
      });

      if (import.meta.env.DEV) {
        console.log('[GlobalMessagingHandler] Updated caches for new message');
      }
    },
    [queryClient, currentUser?._id]
  );

  /**
   * Handle message seen event (global - updates sidebar when messages are marked seen)
   * Only relevant when current user marks messages as seen
   */
  const handleMessageSeen = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log('[GlobalMessagingHandler] Message seen event:', data);
      }

      const { conversationId, userId: seenByUserId } = data;

      // Only update counts if current user marked messages as seen
      if (seenByUserId !== currentUser?._id) {
        return;
      }

      // Update conversations list cache - reset unread for this conversation
      queryClient.setQueryData(['conversations', { page: 1, limit: 50 }], (old) => {
        if (!old?.data?.conversations) return old;

        return {
          ...old,
          data: {
            ...old.data,
            conversations: old.data.conversations.map((conv) =>
              conv._id === conversationId
                ? { ...conv, unreadCount: 0 }
                : conv
            ),
          },
        };
      });

      // Decrement sidebar unread count (one less conversation with unread)
      queryClient.setQueryData(['messages', 'unread-count'], (old) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: {
            ...old.data,
            unreadCount: Math.max(0, (old.data.unreadCount || 0) - 1),
          },
        };
      });

      if (import.meta.env.DEV) {
        console.log('[GlobalMessagingHandler] Updated caches for seen messages');
      }
    },
    [queryClient, currentUser?._id]
  );

  // Only setup listeners when user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Setup socket event listeners for global message events
  useSocketEvent('message:new', handleNewMessage, [handleNewMessage]);
  useSocketEvent('message:seen', handleMessageSeen, [handleMessageSeen]);

  // This component doesn't render anything
  // It only manages socket listeners as a side effect
  return null;
};

export default GlobalMessagingHandler;
