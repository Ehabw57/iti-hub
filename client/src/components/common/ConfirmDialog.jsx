import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiExclamationTriangle, HiXMark } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import confirmDialogContent from '@/content/common/confirm-dialog.content';

/**
 * Reusable confirmation dialog component
 * @param {Object} props
 * @param {boolean} props.isOpen - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm action handler
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message/description
 * @param {string} props.confirmText - Custom confirm button text (optional)
 * @param {string} props.cancelText - Custom cancel button text (optional)
 * @param {string} props.variant - Visual variant: 'danger' | 'warning' | 'info' (default: 'warning')
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'warning'
}) {
  const content = useIntlayer(confirmDialogContent.key);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Variant styles
  const variantStyles = {
    danger: {
      icon: 'text-error-600',
      iconBg: 'bg-error-100',
      button: 'bg-error hover:bg-error-700 focus:ring-error-500'
    },
    warning: {
      icon: 'text-warning-600',
      iconBg: 'bg-warning-100',
      button: 'bg-warning hover:bg-warning-700 focus:ring-warning-500'
    },
    info: {
      icon: 'text-primary-600',
      iconBg: 'bg-primary-100',
      button: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
    }
  };

  const styles = variantStyles[variant] || variantStyles.warning;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-neutral-100 rounded-lg shadow-elevation-3 p-6">
          {/* Close button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-neutral-200 transition-colors"
              aria-label={content.cancel}
            >
              <HiXMark className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`rounded-full p-3 ${styles.iconBg}`}>
              <HiExclamationTriangle className={`w-8 h-8 ${styles.icon}`} />
            </div>
          </div>

          {/* Title */}
          <DialogTitle className="text-heading-4 font-semibold text-neutral-900 text-center mb-2">
            {title}
          </DialogTitle>

          {/* Message */}
          <p className="text-body-1 text-neutral-700 text-center mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-900 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
            >
              {cancelText || content.cancel}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
            >
              {confirmText || content.confirm}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
