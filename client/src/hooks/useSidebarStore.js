import { useAuthStore } from '@store/auth';
import { useUnreadCount } from '@hooks/queries/useUnreadCount';

/**
 * @fileoverview Zustand adapter hook for sidebar store needs
 * Provides unified access to auth state, unread counts, and UI state
 */

/**
 * Hook to access sidebar-related state from various Zustand stores
 * Consolidates auth, notifications, and messages data for sidebar components
 * 
 * @returns {Object} Sidebar state object
 * @returns {boolean} returns.isAuthenticated - User authentication status
 * @returns {Object|null} returns.user - Current user object
 * @returns {number} returns.unreadNotifications - Unread notification count
 * @returns {number} returns.unreadMessages - Unread messages count (mocked for now)
 * @returns {Function} returns.logout - Logout function from auth store
 * 
 * @example
 * const { isAuthenticated, user, unreadNotifications, logout } = useSidebarStore();
 */
export const useSidebarStore = () => {
  // Auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Unread notifications count (from React Query + socket updates)
  const { data: unreadData } = useUnreadCount();
  const unreadNotifications = unreadData?.data?.unreadCount || 0;

  // TODO: Replace with real messages unread count when messaging system is integrated
  // For now, mock the messages unread count
  // When messaging is ready, use: const { data: messagesData } = useUnreadMessagesCount();
  const unreadMessages = 0; // Mock value

  return {
    isAuthenticated,
    user,
    unreadNotifications,
    unreadMessages,
    logout,
  };
};

export default useSidebarStore;
