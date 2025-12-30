import { useEffect, useRef, useCallback } from 'react';
import { useMessagingActions } from './socket/useMessagingActions';

/**
 * @fileoverview Helper hook for managing typing indicator state with debouncing
 * Automatically handles typing start/stop events with proper cleanup
 */

/**
 * Hook for managing typing indicator with auto-stop
 * Debounces typing events and auto-stops after inactivity
 * 
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - ID of the current user
 * @param {Object} options - Configuration options
 * @param {number} [options.debounceMs=1000] - Debounce interval in milliseconds
 * @param {number} [options.autoStopMs=3000] - Auto-stop timeout in milliseconds
 * @returns {{
 *   handleTyping: () => void,
 *   stopTyping: () => void,
 *   isTyping: boolean
 * }}
 * 
 * @example
 * function MessageInput({ conversationId }) {
 *   const { handleTyping, stopTyping } = useTypingIndicator(
 *     conversationId,
 *     currentUser._id
 *   );
 *   
 *   return (
 *     <input
 *       onChange={handleTyping}
 *       onBlur={stopTyping}
 *     />
 *   );
 * }
 */
export const useTypingIndicator = (
  conversationId,
  userId,
  options = {}
) => {
  const { debounceMs = 1000, autoStopMs = 3000 } = options;
  const { emitTypingStart, emitTypingStop } = useMessagingActions();
  
  const debounceTimerRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  /**
   * Stop typing indicator
   * Clears all timers and emits stop event
   */
  const stopTyping = useCallback(() => {
    if (!isTypingRef.current) return;

    // Clear timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    // Emit stop event
    emitTypingStop(conversationId, userId);
    isTypingRef.current = false;

    if (import.meta.env.DEV) {
      console.log('[useTypingIndicator] Stopped typing');
    }
  }, [conversationId, userId, emitTypingStop]);

  /**
   * Handle typing event
   * Debounces typing start and resets auto-stop timer
   */
  const handleTyping = useCallback(() => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If not currently typing, debounce the start event
    if (!isTypingRef.current) {
      debounceTimerRef.current = setTimeout(() => {
        emitTypingStart(conversationId, userId);
        isTypingRef.current = true;

        if (import.meta.env.DEV) {
          console.log('[useTypingIndicator] Started typing');
        }
      }, debounceMs);
    }

    // Reset auto-stop timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }

    autoStopTimerRef.current = setTimeout(() => {
      stopTyping();
    }, autoStopMs);
  }, [conversationId, userId, debounceMs, autoStopMs, emitTypingStart, stopTyping]);

  /**
   * Cleanup on unmount or when dependencies change
   */
  useEffect(() => {
    return () => {
      // Clear all timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }

      // Emit stop if currently typing
      if (isTypingRef.current) {
        emitTypingStop(conversationId, userId);
      }
    };
  }, [conversationId, userId, emitTypingStop]);

  return {
    handleTyping,
    stopTyping,
    isTyping: isTypingRef.current,
  };
};

export default useTypingIndicator;
