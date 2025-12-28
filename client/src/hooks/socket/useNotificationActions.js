import { useCallback } from 'react';
import { useSocket } from './useSocket';

/**
 * @fileoverview Hook for emitting notification-related socket events
 * Provides functions to send real-time notification updates
 */

/**
 * Hook for emitting notification socket events
 * 
 * @returns {{
 *   emitMarkAsRead: (notificationId: string) => boolean,
 *   emitMarkAllAsRead: () => boolean,
 *   canEmit: boolean
 * }}
 * 
 * @example
 * function NotificationItem({ notification }) {
 *   const { emitMarkAsRead, canEmit } = useNotificationActions();
 *   
 *   const handleMarkAsRead = () => {
 *     if (canEmit) {
 *       emitMarkAsRead(notification._id);
 *     }
 *   };
 * }
 */
export const useNotificationActions = () => {
  const { socket, isConnected } = useSocket();

  /**
   * Emit mark single notification as read event
   * This is OPTIONAL - HTTP mutation should be primary method
   * Socket event is for real-time echo to other user sessions
   * 
   * @param {string} notificationId - ID of notification to mark as read
   * @returns {boolean} True if emitted successfully
   */
  const emitMarkAsRead = useCallback(
    (notificationId) => {
      if (!socket || !isConnected) {
        if (import.meta.env.DEV) {
          console.warn('[useNotificationActions] Socket not connected, cannot emit mark as read');
        }
        return false;
      }

      if (import.meta.env.DEV) {
        console.log('[useNotificationActions] Emitting notification:markAsRead', notificationId);
      }

      socket.emit('notification:markAsRead', { notificationId });
      return true;
    },
    [socket, isConnected]
  );

  /**
   * Emit mark all notifications as read event
   * This is OPTIONAL - HTTP mutation should be primary method
   * Socket event is for real-time echo to other user sessions
   * 
   * @returns {boolean} True if emitted successfully
   */
  const emitMarkAllAsRead = useCallback(() => {
    if (!socket || !isConnected) {
      if (import.meta.env.DEV) {
        console.warn('[useNotificationActions] Socket not connected, cannot emit mark all as read');
      }
      return false;
    }

    if (import.meta.env.DEV) {
      console.log('[useNotificationActions] Emitting notification:markAllAsRead');
    }

    socket.emit('notification:markAllAsRead');
    return true;
  }, [socket, isConnected]);

  return {
    emitMarkAsRead,
    emitMarkAllAsRead,
    canEmit: isConnected,
  };
};

export default useNotificationActions;
