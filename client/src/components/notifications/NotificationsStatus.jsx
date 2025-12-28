import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { useIntlayer } from 'react-intlayer';
import notificationsContent from '../../content/notifications/notificationsCenter.content';

/**
 * @fileoverview Status message component for notifications
 * Displays error states with retry option
 */

/**
 * Notifications status component
 * 
 * @param {Object} props
 * @param {'idle' | 'loading' | 'success' | 'error'} props.status - Current status
 * @param {Object} props.error - Error object { code: string, message: string }
 * @param {Function} props.onRetry - Callback when retry is clicked
 */
export const NotificationsStatus = ({
  status = 'idle',
  error = null,
  onRetry,
}) => {
  const content = useIntlayer(notificationsContent.key);

  // Don't render for idle, loading, or success states
  if (status !== 'error' || !error) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Error icon */}
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-primary-100)' }}
      >
        <FiAlertCircle className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
      </div>

      {/* Error message */}
      <h3 className="text-heading-5 mb-2" style={{ color: 'var(--color-neutral-900)' }}>
        {content.errorLoadingNotifications || 'Error loading notifications'}
      </h3>
      <p className="text-body-2 text-center max-w-sm mb-6" style={{ color: 'var(--color-neutral-500)' }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-button text-white rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--color-secondary-600)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)'}
        >
          <FiRefreshCw className="w-4 h-4" />
          {content.tryAgain || 'Try again'}
        </button>
      )}
    </div>
  );
};

export default NotificationsStatus;
