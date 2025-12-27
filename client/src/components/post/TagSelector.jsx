import { useState } from 'react';
import { HiXMark } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';

/**
 * Tag selector component
 * @param {Object} props
 * @param {string[]} props.tags - Array of selected tags
 * @param {Function} props.onChange - Change handler (tags) => void
 * @param {number} props.maxTags - Maximum number of tags allowed
 */
export default function TagSelector({ tags = [], onChange, maxTags = 5 }) {
  const  content  = useIntlayer('postComposer');
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    
    if (!tag) return;
    
    if (tags.length >= maxTags) {
      alert(content.tooManyTags);
      return;
    }
    
    if (tags.includes(tag)) {
      setInputValue('');
      return;
    }
    
    onChange([...tags, tag]);
    setInputValue('');
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {content.addTags} ({tags.length}/{maxTags})
      </label>
      
      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                aria-label="Remove tag"
              >
                <HiXMark className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      {tags.length < maxTags && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={content.enterTag.value}
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
