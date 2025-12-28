import { HiBuildingLibrary } from 'react-icons/hi2';

/**
 * CommunityBadge Component
 * Displays community name with icon as a clickable badge
 * Reusable in posts, community lists, search results
 */

/**
 * CommunityBadge - Display community badge with icon
 * @param {Object} props
 * @param {Object} props.community - Community object with name and _id
 * @param {Function} props.onClick - Click handler for navigation
 * @param {string} [props.size='md'] - Size variant (for future use)
 */
export function CommunityBadge({ community, onClick, size = 'md' }) {
  if (!community) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
    >
      <HiBuildingLibrary className="w-4 h-4" />
      <span>{community.name}</span>
    </button>
  );
}
