import React from 'react';

/**
 * InteractionButton - Generic reusable button for post interactions
 * 
 * @component
 * @example
 * // Like button
 * <InteractionButton
 *   icon={<HiHeart />}
 *   activeIcon={<HiHeart className="fill-current" />}
 *   count={42}
 *   isActive={true}
 *   onClick={handleLike}
 *   label="Like"
 *   activeColor="text-red-500"
 * />
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon to display when inactive
 * @param {React.ReactNode} [props.activeIcon] - Icon to display when active (defaults to icon)
 * @param {number} [props.count] - Count to display next to icon
 * @param {boolean} [props.isActive=false] - Whether button is in active state
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.label] - Accessible label for button
 * @param {string} [props.activeColor] - Tailwind color class when active
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 */
export function InteractionButton({
  icon,
  activeIcon,
  count,
  isActive = false,
  onClick,
  label,
  activeColor = 'text-primary-600',
  className = '',
  disabled = false,
}) {
  const displayIcon = isActive && activeIcon ? activeIcon : icon;
  const colorClass = isActive ? activeColor : 'text-neutral-600';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        flex items-center gap-2 
        hover:bg-neutral-50 
        px-3 py-2 rounded-full 
        transition-colors
        ${colorClass}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {displayIcon}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-sm font-medium">
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </button>
  );
}
