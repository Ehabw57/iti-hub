import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiXMark } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import loginModalContent from '@/content/auth/login-modal.content';


/**
 * Login required modal - prompts unauthenticated users to login
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 */
export default function LoginRequiredModal({ isOpen, onClose }) {
  //const navigate = useNavigate();
  const  content  = useIntlayer(loginModalContent.key);

  const handleLogin = () => {
    onClose();
    //navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    //navigate('/register');
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-neutral-100 rounded-lg shadow-elevation-3 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-heading-4 font-semibold text-neutral-900">
              {content.title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
              aria-label={content.cancel}
            >
              <HiXMark className="w-6 h-6 text-neutral-600" />
            </button>
          </div>

          {/* Message */}
          <p className="text-body-1 text-neutral-700 mb-6">
            {content.message}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              {content.loginButton}
            </button>
            <button
              onClick={handleRegister}
              className="w-full px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
            >
              {content.registerButton}
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {content.cancel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// Export the content for use with useIntlayer
export { loginModalContent };
