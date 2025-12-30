import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { HiXMark } from 'react-icons/hi2';
import { useSidebarStore } from '../../hooks/useSidebarStore';
import { menuItems } from './menuConfig';
import SidebarItem from './SidebarItem';
import SidebarGroup from './SidebarGroup';
import SidebarFooter from './SidebarFooter';
import { useUserCommunities } from '@hooks/queries/useUserCommunities';
import FollowingList from '../profile/FollowingList';
import sidebarContents from '@/content/sidebar/sidebar.content';
import CommunityCard from '../community/CommunityCard';

/**
 * @fileoverview Main Sidebar component
 * Handles navigation, groups, badges, and responsive drawer behavior
 */

/**
 * Sidebar Component
 * 
 * Responsive sidebar navigation:
 * - Desktop: Always visible vertical bar on left
 * - Mobile: Hidden by default, slides in as drawer
 * 
 * Features:
 * - Shows public items to all users
 * - Shows private items only when authenticated
 * - Displays live unread badges for notifications and messages
 * - Expandable groups (Communities, Profile)
 * - Custom components (user communities list, user info)
 * 
 * @param {Object} props
 * @param {boolean} [props.mobileOpen=false] - Whether mobile drawer is open
 * @param {Function} [props.onMobileClose] - Handler to close mobile drawer
 * @param {Function} [props.onCreatePost] - Handler for create post action
 * @param {Function} [props.onLogin] - Handler for login action
 * @param {Function} [props.onSignUp] - Handler for sign up action
 * 
 * @example
 * <Sidebar
 *   mobileOpen={isMobileMenuOpen}
 *   onMobileClose={() => setIsMobileMenuOpen(false)}
 *   onCreatePost={() => setShowComposer(true)}
 * />
 */
const Sidebar = ({
  mobileOpen = false,
  onMobileClose,
  onCreatePost,
  onLogin,
  onSignUp,
}) => {
  const navigate = useNavigate();
  const content = useIntlayer(sidebarContents.key);
  const { isAuthenticated, user, unreadNotifications, unreadMessages, logout } = useSidebarStore();
  const { data: communitiesData } = useUserCommunities();
  const [showFollowingList, setShowFollowingList] = useState(false);

  const communities = communitiesData || [];

  // Handle navigation (closes mobile drawer)
  const handleNavigate = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  // Handle logout action
  const handleLogout = () => {
    logout();
    handleNavigate();
    navigate('/');
  };

  // Render custom child components for special menu items
  const renderCustomChild = (child) => {
    switch (child.id) {
      case 'user-info':
        // Render user profile info (avatar + name + username)
        if (!user) return null;
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => {
              navigate(`/profile/${user.username}`);
              handleNavigate();
            }}
            className="
              group
              flex items-center gap-3
              w-full px-4 py-3
              rounded-lg
              transition-all duration-150 ease-in-out
              hover:bg-neutral-100
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
              text-neutral-700 hover:text-neutral-900
            "
          >
            {/* User Avatar */}
            <img
              src={user.profilePicture || '/default-avatar.png'}
              alt={user.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0 rtl:text-right ltr:text-left">
              <p className="text-sm font-medium text-neutral-900 truncate">{user.fullName}</p>
              <p className="text-xs text-neutral-600 truncate">@{user.username}</p>
            </div>
          </button>
        );

      case 'user-communities':
        // Render user's joined communities as a list
        if (!isAuthenticated || communities.length === 0) {
          return (
            <div key={child.id} className="px-4 py-2 text-xs text-neutral-500">
              {content.noCommunitiesYet}
            </div>
          );
        }
        return (
          <div key={child.id} className="space-y-1">
            {communities.slice(0, 8).map(({community}) => (
              <CommunityCard
                key={community._id}
                community={community}
                size="small"
              />
            ))}
            {communities.length > 8 && (
              <button
                type="button"
                onClick={() => {
                  navigate('/communities');
                  handleNavigate();
                }}
                className="px-4 py-2 text-xs text-primary-600 hover:text-primary-700"
              >
                {content.viewAll} ({communities.length})
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Prepare menu items with dynamic values
  const preparedMenuItems = menuItems.map((item) => {
    const preparedItem = { 
      ...item,
      label: content[item.labelKey] || item.labelKey, // Translate label
    };

    // Add badge counts
    if (item.badgeKey === 'unreadNotifications') {
      preparedItem.badgeCount = unreadNotifications;
    } else if (item.badgeKey === 'unreadMessages') {
      preparedItem.badgeCount = unreadMessages;
    }

    // Add click handlers for action items
    if (item.type === 'group' && item.children) {
      preparedItem.children = item.children.map((child) => {
        const preparedChild = { 
          ...child,
          label: content[child.labelKey] || child.labelKey, // Translate label
        };

        if (child.id === 'logout') {
          preparedChild.onClick = handleLogout;
        } else if (child.id === 'following') {
          preparedChild.onClick = () => setShowFollowingList(true);
        } else if (child.id === 'create-community') {
          preparedChild.onClick = () => {
            // TODO: Open create community modal
            console.log('Create community clicked');
          };
        } else if (child.path && child.path.includes(':username')) {
          preparedChild.path = child.path.replace(':username', user?.username || '');
        }

        return preparedChild;
      });
    }

    return preparedItem;
  });

  // Filter menu items by authentication state
  const visibleItems = preparedMenuItems.filter(
    (item) => item.isPublic || isAuthenticated
  );

  // Sidebar content (same for desktop and mobile)
  const sidebarContent = (
    <>
      {/* Header (mobile only) */}
      {mobileOpen && (
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{content.menu}</h2>
          <button
            type="button"
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={content.closeMenu}
          >
            <HiXMark className="w-6 h-6 text-neutral-600" />
          </button>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Main navigation">
        {visibleItems.map((item) => {
          if (item.type === 'group') {
            return (
              <SidebarGroup
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                children={item.children}
                onNavigate={handleNavigate}
                renderCustomChild={renderCustomChild}
              />
            );
          }

          return (
            <SidebarItem
              key={item.id}
              id={item.id}
              label={item.label}
              path={item.path}
              icon={item.icon}
              badgeCount={item.badgeCount}
              onClick={item.onClick}
              onNavigate={handleNavigate}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <SidebarFooter
        onCreatePost={() => {
          if (onCreatePost) onCreatePost();
          handleNavigate();
        }}
        onSignUp={() => {
        navigate('/register');
          handleNavigate();
        }}
        onLogin={() => {
            navigate('/login');
          handleNavigate();
        }}
      />
    </>
  );

  return (
    <>
         <div
        className={`
          fixed inset-0
          z-4
          bg-black/30 
          transition-opacity duration-300
          lg:hidden
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={handleNavigate}
        aria-hidden={!mobileOpen}
      />
      {/* Desktop sidebar (always visible on lg+) */}
      <aside
        className={`
          min-w-70
          z-4
          fixed inset-y-0 ltr:left-0 rtl:right-0
          lg:sticky lg:top-0 lg:h-[92vh] lg:inset-auto
          bg-neutral-50 
          ltr:border-r rtl:border-l border-neutral-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}
          lg:translate-x-0!
        `}
      >
        {sidebarContent}
      </aside>

      {/* Following List Modal */}
      {showFollowingList && user && (
        <FollowingList userId={user._id} onClose={() => setShowFollowingList(false)} />
      )}
    </>
  );
};

export default Sidebar;
