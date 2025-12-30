import { useCallback } from 'react';
import { useSocket } from './useSocket';

/**
 * @fileoverview Hook for emitting messaging-related socket events
 * Provides functions to send real-time messaging updates
 */

/**
 * Hook for emitting messaging socket events
 * 
 * @returns {{
 *   emitMessageSend: (conversationId: string, message: object) => boolean,
 *   emitMessageSeen: (conversationId: string, userId: string) => boolean,
 *   emitTypingStart: (conversationId: string, userId: string) => boolean,
 *   emitTypingStop: (conversationId: string, userId: string) => boolean,
 *   canEmit: boolean
 * }}
 * 
 * @example
 * function MessageInput({ conversationId }) {
 *   const { emitTypingStart, emitTypingStop } = useMessagingActions();
 *   
 *   const handleInputChange = () => {
 *     emitTypingStart(conversationId, currentUser._id);
 *   };
 * }
 */
export const useMessagingActions = () => {
  const { socket, isConnected } = useSocket();

  /**
   * Emit message send event
   * Note: This is for real-time notification to other participants
   * The actual message should be sent via HTTP mutation first
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {object} message - Message data
   * @returns {boolean} True if emitted successfully
   */
  const emitMessageSend = useCallback(
    (conversationId, message) => {
      if (!socket || !isConnected) {
        if (import.meta.env.DEV) {
          console.warn('[useMessagingActions] Socket not connected, cannot emit message send');
        }
        return false;
      }

      if (import.meta.env.DEV) {
        console.log('[useMessagingActions] Emitting message:send', { conversationId, messageId: message.messageId });
      }

      socket.emit('message:send', {
        conversationId,
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        image: message.image,
        messageId: message.messageId,
      });

      return true;
    },
    [socket, isConnected]
  );

  /**
   * Emit message seen event
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user who saw the messages
   * @returns {boolean} True if emitted successfully
   */
  const emitMessageSeen = useCallback(
    (conversationId, userId) => {
      if (!socket || !isConnected) {
        if (import.meta.env.DEV) {
          console.warn('[useMessagingActions] Socket not connected, cannot emit message seen');
        }
        return false;
      }

      if (import.meta.env.DEV) {
        console.log('[useMessagingActions] Emitting message:seen', { conversationId, userId });
      }

      socket.emit('message:seen', { conversationId, userId });

      return true;
    },
    [socket, isConnected]
  );

  /**
   * Emit typing start event
   * Should be throttled by the caller (useTypingIndicator hook)
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user typing
   * @returns {boolean} True if emitted successfully
   */
  const emitTypingStart = useCallback(
    (conversationId, userId) => {
      if (!socket || !isConnected) {
        if (import.meta.env.DEV) {
          console.warn('[useMessagingActions] Socket not connected, cannot emit typing start');
        }
        return false;
      }

      if (import.meta.env.DEV) {
        console.log('[useMessagingActions] Emitting typing:start', { conversationId, userId });
      }

      socket.emit('typing:start', { conversationId, userId });

      return true;
    },
    [socket, isConnected]
  );

  /**
   * Emit typing stop event
   * 
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user who stopped typing
   * @returns {boolean} True if emitted successfully
   */
  const emitTypingStop = useCallback(
    (conversationId, userId) => {
      if (!socket || !isConnected) {
        if (import.meta.env.DEV) {
          console.warn('[useMessagingActions] Socket not connected, cannot emit typing stop');
        }
        return false;
      }

      if (import.meta.env.DEV) {
        console.log('[useMessagingActions] Emitting typing:stop', { conversationId, userId });
      }

      socket.emit('typing:stop', { conversationId, userId });

      return true;
    },
    [socket, isConnected]
  );

  return {
    emitMessageSend,
    emitMessageSeen,
    emitTypingStart,
    emitTypingStop,
    canEmit: isConnected,
  };
};

export default useMessagingActions;
