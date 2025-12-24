import { createContext, useContext, useState } from 'react';
import { useAuthStore } from '@store/auth';
import LoginRequiredModal from '@components/auth/LoginRequiredModal';

/**
 * Context for authentication-required actions
 */
const RequireAuthContext = createContext(null);

/**
 * Hook to access require auth functionality
 */
export const useRequireAuth = () => {
  const context = useContext(RequireAuthContext);
  if (!context) {
    throw new Error('useRequireAuth must be used within RequireAuthProvider');
  }
  return context;
};

/**
 * Provider for authentication-required actions
 * Wraps the app and provides a function to check auth before actions
 * Shows login modal if user is not authenticated
 */
export default function RequireAuthProvider({ children }) {
  const { isAuthenticated } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

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
      setShowLoginModal(true);
      return false;
    }
  };

  return (
    <RequireAuthContext.Provider value={{ requireAuth }}>
      {children}
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </RequireAuthContext.Provider>
  );
}
