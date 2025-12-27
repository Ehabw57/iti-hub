import { create } from 'zustand';
import { useAuthStore } from '@store/auth';

/**
 * Store for managing login modal state
 * Separate from auth store to avoid unnecessary re-renders
 */
const useLoginModalStore = create((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));

/**
 * Export the store hook for use in LoginRequiredModal component
 */
export { useLoginModalStore };

/**
 * Hook to require authentication before performing actions
 * 
 * This hook provides a lightweight way to check authentication
 * without the overhead of React Context. It uses Zustand for
 * modal state management, which is more performant.
 * 
 * @example
 * const { requireAuth } = useRequireAuth();
 * 
 * const handleLike = () => {
 *   requireAuth(() => {
 *     // This code only runs if user is authenticated
 *     likeMutation.mutate();
 *   });
 * };
 * 
 * @returns {Object} - Object with requireAuth function
 */
export default function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const openModal = useLoginModalStore((state) => state.openModal);

  /**
   * Check if user is authenticated before performing an action
   * @param {Function} action - Action to perform if authenticated
   * @returns {boolean} - Returns true if authenticated, false otherwise
   */
  const requireAuth = (action) => {
    if (isAuthenticated) {
      if (action) action();
      return true;
    } else {
      openModal();
      return false;
    }
  };

  return { requireAuth };
}
