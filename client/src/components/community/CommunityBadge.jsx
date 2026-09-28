import { HiBuildingLibrary } from 'react-icons/hi2';
import Chip from '@components/common/Chip';

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
      className="inline-flex transition-transform hover:-translate-y-px"
      title={community.name}
    >
      <Chip icon={HiBuildingLibrary} size={size === 'sm' ? 'xs' : 'sm'}>
        {community.name}
      </Chip>
    </button>
  );
}
