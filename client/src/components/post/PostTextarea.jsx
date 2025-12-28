import { useEffect, useRef } from 'react';
import { useIntlayer } from 'react-intlayer';

/**
 * Auto-resizing textarea for post content
 * @param {Object} props
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler (value) => void
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.maxLength - Maximum character length
 */
export default function PostTextarea({ 
  value, 
  onChange, 
  placeholder, 
  maxLength = 5000 
}) {
  const  content  = useIntlayer('postComposer');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const remaining = maxLength - value.length;
  const isOverLimit = remaining < 0;

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 transition-colors ${
          isOverLimit
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-200'
        }`}
        rows={4}
        style={{ minHeight: '120px', maxHeight: '400px' }}
      />
      
      {/* Character count */}
      <div className={`mt-1 text-xs text-end ${isOverLimit ? 'text-red-600' : 'text-neutral-500'}`}>
        {Math.abs(remaining)} {isOverLimit ? content.charactersOver : content.charactersLeft}
      </div>
    </div>
  );
}
