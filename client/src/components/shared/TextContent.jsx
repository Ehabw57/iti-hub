import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { truncateWords } from '@/utils/text/truncateWords';

/**
 * TextContent Component
 * Displays text with optional truncation and expand/collapse functionality
 * Reusable for posts, comments, descriptions, etc.
 */

/**
 * TextContent - Display text content with optional truncation
 * @param {Object} props
 * @param {string} props.content - Text content to display
 * @param {number} [props.maxWords=50] - Maximum words before truncation
 * @param {string} [props.className=''] - Additional CSS classes
 */
export function TextContent({ 
  content, 
  maxWords = 50, 
  className = '' 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentObj = useIntlayer('feedHome');
  
  const { truncated, isTruncated, fullText } = truncateWords(content, maxWords);
  const displayContent = isExpanded ? fullText : truncated;

  if (!content) return null;

  return (
    <div className={className}>
      <p className="text-neutral-900 whitespace-pre-wrap wrap-break-word">
        {displayContent}
      </p>
      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 transition-colors"
        >
          {isExpanded ? contentObj.showLess : contentObj.readMore}
        </button>
      )}
    </div>
  );
}
