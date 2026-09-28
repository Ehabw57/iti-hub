/**
 * TagList Component
 * Displays a list of tags with overflow indicator
 * Reusable for posts, communities, search results
 */

import { Chip } from '@components/common';

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
        <Chip key={idx} hash size="xs">
          {tag}
        </Chip>
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-neutral-500">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
