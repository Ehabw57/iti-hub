import { HiPencil, HiArrowRightOnRectangle, HiArrowRightEndOnRectangle } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@store/auth';
import Button from '../common/Button';
import sidebarContent from '@/content/sidebar/sidebar.content';

/**
 * @fileoverview Sidebar footer component
 * Renders Create Post button (authenticated) or Sign Up/Login buttons (unauthenticated)
 */

/**
 * SidebarFooter Component
 * 
 * Renders action buttons at the bottom of the sidebar
 * - Authenticated: Create Post button
 * - Unauthenticated: Sign Up and Login buttons
 * 
 * @param {Object} props
 * @param {Function} props.onCreatePost - Handler for create post action
 * @param {Function} props.onSignUp - Handler for sign up action
 * @param {Function} props.onLogin - Handler for login action
 * 
 * @example
 * <SidebarFooter
 *   onCreatePost={() => setShowComposer(true)}
 *   onSignUp={() => navigate('/register')}
 *   onLogin={() => setShowLoginModal(true)}
 * />
 */
const SidebarFooter = ({ onCreatePost, onSignUp, onLogin }) => {
  const content = useIntlayer(sidebarContent.key);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return (
      <div className="p-4 border-t border-neutral-200">
        <Button
          variant="primary"
          onClick={onCreatePost}
          className="w-full justify-center"
        >
          <HiPencil className="w-5 h-5" />
          <span>{content.createPost}</span>
        </Button>
      </div>
    );
  }

  // Unauthenticated: Show Sign Up and Login
  return (
    <div className="p-4 border-t border-neutral-200 space-y-2">
      <Button
        variant="primary"
        onClick={onSignUp}
        className="w-full justify-center"
      >
        <HiArrowRightEndOnRectangle className="w-5 h-5" />
        <span>{content.signUp}</span>
      </Button>
      <Button
        variant="secondary"
        onClick={onLogin}
        className="w-full justify-center"
      >
        <HiArrowRightOnRectangle className="w-5 h-5" />
        <span>{content.login}</span>
      </Button>
    </div>
  );
};


export default SidebarFooter;
