import { NavLink } from 'react-router-dom';

/**
 * @fileoverview Single sidebar navigation item component
 * Renders a clickable link with icon, label, and optional badge
 */

/**
 * SidebarItem Component
 * 
 * Renders a single navigation item with icon, label, and badge
 * Uses NavLink for active state highlighting
 * 
 * @param {Object} props
 * @param {string} props.id - Item identifier
 * @param {string} props.label - Display label
 * @param {string} [props.path] - Navigation path (optional for action items)
 * @param {React.Component} props.icon - Icon component
 * @param {number} [props.badgeCount=0] - Badge count to display
 * @param {Function} [props.onClick] - Custom click handler
 * @param {boolean} [props.isActive=false] - Whether item is currently active
 * @param {Function} [props.onNavigate] - Callback fired after navigation (for mobile drawer close)
 * 
 * @example
 * <SidebarItem
 *   id="notifications"
 *   label="Notifications"
 *   path="/notifications"
 *   icon={HiBell}
 *   badgeCount={5}
 * />
 */
const SidebarItem = ({
  id,
  label,
  path,
  icon: Icon,
  badgeCount = 0,
  onClick,
  isActive = false,
  onNavigate,
}) => {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
    if (onNavigate) {
      onNavigate();
    }
  };

  // Shared classes for both link and button variants
  const baseClasses = `
    group
    flex items-center gap-3
    w-full px-4 py-3
    rounded-lg
    transition-all duration-150 ease-in-out
    hover:bg-neutral-100
    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
  `;

  const activeClasses = `
    bg-primary-50 text-primary-700 font-medium
  `;

  const inactiveClasses = `
    text-neutral-700 hover:text-neutral-900
  `;

  const content = (
    <>
      {/* Icon */}
      <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />

      {/* Label */}
      <span className="flex-1 text-sm rtl:text-right ltr:text-left">{label}</span>

      {/* Badge */}
      {badgeCount > 0 && (
        <span
          className="
            inline-flex items-center justify-center
            min-w-5 h-5 px-1.5
            bg-primary-600 text-white
            rounded-full
            text-xs font-semibold
          "
          aria-label={`${badgeCount} unread`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </>
  );

  // If path is provided, render as NavLink for automatic active state
  if (path && !onClick) {
    return (
      <NavLink
        to={path}
        className={({ isActive: navIsActive }) =>
          `${baseClasses} ${navIsActive || isActive ? activeClasses : inactiveClasses}`
        }
        onClick={onNavigate}
      >
        {content}
      </NavLink>
    );
  }

  // Otherwise render as button (for action items)
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {content}
    </button>
  );
};

export default SidebarItem;
