import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HiChevronDown } from 'react-icons/hi2';
import SidebarItem from './SidebarItem';

/**
 * @fileoverview Expandable sidebar group component
 * Renders a collapsible group with nested items
 */

/**
 * SidebarGroup Component
 * 
 * Renders an expandable group of menu items
 * Auto-expands if current route matches a child item
 * 
 * @param {Object} props
 * @param {string} props.id - Group identifier
 * @param {string} props.label - Group label
 * @param {React.Component} props.icon - Icon component
 * @param {Array} props.children - Child menu items
 * @param {Function} [props.onNavigate] - Callback fired after navigation
 * @param {Function} [props.renderCustomChild] - Custom renderer for special child types
 * 
 * @example
 * <SidebarGroup
 *   id="profile"
 *   label="Profile"
 *   icon={HiUser}
 *   children={profileItems}
 * />
 */
const SidebarGroup = ({
  id,
  label,
  icon: Icon,
  children = [],
  onNavigate,
  renderCustomChild,
}) => {
  const location = useLocation();

  // Check if any child path matches current route
  const isChildActive = children.some(
    (child) => child.path && location.pathname === child.path
  );

  // Auto-expand if a child is active
  const [isExpanded, setIsExpanded] = useState(isChildActive);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="space-y-1">
      {/* Group header (clickable to expand/collapse) */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={`
          group
          flex items-center gap-3
          w-full px-4 py-3
          rounded-lg
          transition-all duration-150 ease-in-out
          hover:bg-neutral-100
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
          ${isExpanded ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-700 hover:text-neutral-900'}
        `}
      >
        {/* Icon */}
        <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />

        {/* Label */}
        <span className="flex-1 text-left rtl:text-right text-sm font-medium">{label}</span>

        {/* Chevron indicator */}
        <HiChevronDown
          className={`
            w-5 h-5 shrink-0
            transition-transform duration-200
            ${isExpanded ? 'rotate-180' : 'rotate-0'}
          `}
          aria-hidden="true"
        />
      </button>

      {/* Expanded children */}
      {isExpanded && (
        <div
          className="
            pl-4
            space-y-1
            animate-in slide-in-from-top-2 fade-in
            duration-200
          "
        >
          {children.map((child) => {
            // Allow custom rendering for special child types (user-info, community list, etc.)
            if (renderCustomChild && child.type === 'component') {
              return renderCustomChild(child);
            }

            // Regular menu item
            return (
              <SidebarItem
                key={child.id}
                id={child.id}
                label={child.label}
                path={child.path}
                icon={child.icon}
                onClick={child.onClick}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarGroup;
