/**
 * TagList Component
 * Displays a list of tags with overflow indicator
 * Reusable for posts, communities, search results
 */

/**
 * TagList - Display tags with optional max visible limit
 * @param {Object} props
 * @param {string[]} props.tags - Array of tag strings
 * @param {number} [props.maxVisible=5] - Maximum tags to display before showing "+N more"
 */
export function TagList({ tags, maxVisible = 5 }) {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTags.map((tag, idx) => (
        <span 
          key={idx}
          className="px-2 py-1 bg-primary-100 text-primary-600 text-sm rounded-full"
        >
          #{tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-neutral-500">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
