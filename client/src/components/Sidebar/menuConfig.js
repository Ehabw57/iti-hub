import { 
  HiHome, 
  HiMagnifyingGlass, 
  HiUserGroup, 
  HiBell, 
  HiChatBubbleLeftRight,
  HiUser,
  HiBookmark,
  HiArrowRightOnRectangle,
  HiPlus,
  HiUsers
} from 'react-icons/hi2';

/**
 * @fileoverview Sidebar menu configuration
 * Defines the navigation structure with routes, icons, and permissions
 */

/**
 * Menu item configuration
 * @typedef {Object} MenuItem
 * @property {string} id - Unique identifier
 * @property {string} label - Display label (will use i18n content)
 * @property {string} [path] - Navigation path (optional for groups)
 * @property {React.Component} icon - Icon component from react-icons
 * @property {boolean} [isPublic=false] - Whether item is visible when unauthenticated
 * @property {string} [badgeKey] - Key to read badge count from store (e.g., 'unreadNotifications')
 * @property {MenuItem[]} [children] - Nested menu items for expandable groups
 * @property {string} [type] - Item type: 'link', 'group', 'action', 'component'
 * @property {Function} [onClick] - Custom click handler for action items
 */

/**
 * Main navigation menu configuration
 * Items are shown/hidden based on authentication state
 * Badge counts are read from Zustand store selectors
 * 
 * Note: Labels use content keys that will be translated via i18n in components
 */
export const menuItems = [
  // Public items (visible to all users)
  {
    id: 'feed',
    labelKey: 'feed', // i18n key
    path: '/',
    icon: HiHome,
    isPublic: true,
    type: 'link',
  },
  {
    id: 'explore',
    labelKey: 'explore',
    path: '/explore',
    icon: HiMagnifyingGlass,
    isPublic: true,
    type: 'link',
  },

  // Private items (require authentication)
  {
    id: 'communities',
    labelKey: 'communities',
    icon: HiUserGroup,
    isPublic: false,
    type: 'group',
    children: [
      {
        id: 'create-community',
        labelKey: 'createCommunity',
        icon: HiPlus,
        type: 'action',
        // onClick will be set dynamically in component
      },
      {
        id: 'user-communities',
        labelKey: 'myCommunities',
        type: 'component', // Special type: renders custom component with community list
      },
    ],
  },
  {
    id: 'notifications',
    labelKey: 'notifications',
    path: '/notifications',
    icon: HiBell,
    isPublic: false,
    badgeKey: 'unreadNotifications',
    type: 'link',
  },
  {
    id: 'messages',
    labelKey: 'messages',
    path: '/messages',
    icon: HiChatBubbleLeftRight,
    isPublic: false,
    badgeKey: 'unreadMessages',
    type: 'link',
  },
  {
    id: 'profile',
    labelKey: 'profile',
    icon: HiUser,
    isPublic: false,
    type: 'group',
    children: [
      {
        id: 'user-info',
        labelKey: 'myProfile',
        type: 'component', // Special: renders user avatar + name
      },
      {
        id: 'following',
        labelKey: 'following',
        icon: HiUsers,
        type: 'action',
        // Opens FollowingList modal
      },
      {
        id: 'saved',
        labelKey: 'saved',
        path: '/saved',
        icon: HiBookmark,
        type: 'link',
      },
      {
        id: 'my-profile',
        labelKey: 'myProfile',
        path: '/profile/:username', // Will be replaced with actual username
        icon: HiUser,
        type: 'link',
      },
      {
        id: 'logout',
        labelKey: 'logout',
        icon: HiArrowRightOnRectangle,
        type: 'action',
        // Calls logout from auth store
      },
    ],
  },
];

export default menuItems;
