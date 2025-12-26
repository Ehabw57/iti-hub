import { HiDocumentText } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import feedHomeContent from '@/content/feed/home.content'

/**
 * Empty state component for feed
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.message - Message text
 * @param {Function} props.action - Optional action button handler
 * @param {string} props.actionText - Optional action button text
 */
export default function EmptyFeed({ 
  title, 
  message, 
  action, 
  actionText 
}) {
  const content = useIntlayer(feedHomeContent.key);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <HiDocumentText className="w-10 h-10 text-neutral-400" />
      </div>
      <h2 className="text-heading-4 text-neutral-900 mb-2 text-center">
        {title || content.noPostsTitle}
      </h2>
      <p className="text-body-2 text-neutral-600 mb-6 text-center max-w-md">
        {message || content.noPostsMessage}
      </p>
      {action && actionText && (
        <button
          onClick={action}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
