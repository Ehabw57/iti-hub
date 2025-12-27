import { HiExclamationCircle } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';

/**
 * Component to display when a post is no longer available (deleted or not found)
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant='default'] - Style variant: 'default' | 'compact'
 */
export default function UnavailablePost({ className = '', variant = 'default' }) {
  const content = useIntlayer('unavailable-post');

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center gap-2 py-4 px-4 bg-neutral-100 rounded-lg border border-neutral-200 ${className}`}>
        <HiExclamationCircle className="w-5 h-5 text-neutral-500 shrink-0" />
        <p className="text-body-2 text-neutral-600 font-medium">
          {content.compactMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 bg-neutral-50 rounded-lg border border-neutral-200 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-200 mb-4">
        <HiExclamationCircle className="w-8 h-8 text-neutral-500" />
      </div>
      
      <h3 className="text-heading-5 text-neutral-900 font-semibold mb-2 text-center">
        {content.title}
      </h3>
      
      <p className="text-body-2 text-neutral-600 text-center max-w-sm">
        {content.description}
      </p>
    </div>
  );
}
