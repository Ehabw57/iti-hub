import { useState, useCallback, useEffect } from 'react';
import { useSocketEvent } from './useSocketEvent';

/**
 * @fileoverview Hook for managing typing indicators in conversations
 * Tracks which users are currently typing
 */

/**
 * Hook for tracking typing indicators in a conversation
 * 
 * @param {string} conversationId - ID of the conversation to track
 * @returns {{
 *   typingUsers: Set<string>,
 *   typingUsernames: string[],
 *   isAnyoneTyping: boolean
 * }}
 * 
 * @example
 * function ConversationDetail({ conversationId }) {
 *   const { typingUsernames, isAnyoneTyping } = useTypingSocket(conversationId);
 *   
 *   return (
 *     <div>
 *       {isAnyoneTyping && (
 *         <span>{typingUsernames.join(', ')} typing...</span>
 *       )}
 *     </div>
 *   );
 * }
 */
export const useTypingSocket = (conversationId) => {
  const [typingUsers, setTypingUsers] = useState(new Map()); // userId -> { username, timeout }

  /**
   * Handle typing start event
   */
  const handleTypingStart = useCallback(
    (data) => {
      const { conversationId: typingConvId, userId: typingUserId, username } = data;

      // Only track typing for this conversation
      if (typingConvId !== conversationId) {
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[useTypingSocket] User started typing:', { typingUserId, username });
      }

      setTypingUsers((prev) => {
        const newMap = new Map(prev);

        // Clear existing timeout if any
        const existing = prev.get(typingUserId);
        if (existing?.timeout) {
          clearTimeout(existing.timeout);
        }

        // Set auto-stop timeout (5 seconds)
        const timeout = setTimeout(() => {
          setTypingUsers((current) => {
            const updated = new Map(current);
            updated.delete(typingUserId);
            return updated;
          });
        }, 5000);

        newMap.set(typingUserId, { username, timeout });
        return newMap;
      });
    },
    [conversationId]
  );

  /**
   * Handle typing stop event
   */
  const handleTypingStop = useCallback(
    (data) => {
      const { conversationId: typingConvId, userId: typingUserId } = data;

      // Only track typing for this conversation
      if (typingConvId !== conversationId) {
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[useTypingSocket] User stopped typing:', typingUserId);
      }

      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        
        // Clear timeout if exists
        const existing = prev.get(typingUserId);
        if (existing?.timeout) {
          clearTimeout(existing.timeout);
        }

        newMap.delete(typingUserId);
        return newMap;
      });
    },
    [conversationId]
  );

  // Setup socket event listeners
  useSocketEvent('typing:start', handleTypingStart, [handleTypingStart]);
  useSocketEvent('typing:stop', handleTypingStop, [handleTypingStop]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      typingUsers.forEach((data) => {
        if (data.timeout) {
          clearTimeout(data.timeout);
        }
      });
    };
  }, [typingUsers]);

  // Extract usernames for display
  const typingUsernames = Array.from(typingUsers.values()).map((data) => data.username);

  return {
    typingUsers: new Set(typingUsers.keys()),
    typingUsernames,
    isAnyoneTyping: typingUsers.size > 0,
  };
};

export default useTypingSocket;
