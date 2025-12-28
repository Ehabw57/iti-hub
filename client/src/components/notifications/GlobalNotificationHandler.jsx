import { useNotificationSocket } from '@hooks/socket/useNotificationSocket';
import { useAuthStore } from '@store/auth';

/**
 * @fileoverview Global handler for real-time notification events
 * This component must be mounted at app/layout level to ensure
 * notification listeners are active across all pages
 */

/**
 * Global Notification Handler Component
 * 
 * Sets up socket listeners for real-time notification updates
 * Updates React Query cache when notifications arrive
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
 *       <Outlet />
 *     </>
 *   );
 * }
 */
export const GlobalNotificationHandler = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Only setup listeners when user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Setup socket event listeners
  // This hook will:
  // - Listen for 'notification:new' events
  // - Listen for 'notification:update' events  
  // - Listen for 'notification:count' events
  // - Listen for 'notification:read' events
  // - Update React Query cache accordingly
  useNotificationSocket();

  // This component doesn't render anything
  // It only manages socket listeners as a side effect
  return null;
};

export default GlobalNotificationHandler;
