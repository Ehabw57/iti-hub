import {
  HiOutlineHome,
  HiHome,
  HiOutlineBuildingOffice2,
  HiBuildingOffice2,
  HiOutlineAcademicCap,
  HiAcademicCap,
  HiOutlineUserGroup,
  HiUserGroup,
  HiOutlineBriefcase,
  HiBriefcase,
  HiOutlineCalendarDays,
  HiCalendarDays,
  HiOutlineBell,
  HiBell,
  HiOutlineEnvelope,
  HiEnvelope,
  HiOutlineBookmark,
  HiBookmark,
} from 'react-icons/hi2';

/**
 * @fileoverview X-style left rail + mobile tab bar menu configuration.
 *
 * Each item pairs an outline icon (inactive) with its filled icon
 * (active — rendered in the red accent). `end` forces exact NavLink
 * matching (Home must not stay active on every route). Labels resolve
 * from sidebar.content via `labelKey`.
 *
 * MobileTabBar renders the subset with ids in its TAB_IDS list; the
 * Sidebar rail renders everything (auth items only when logged in).
 */
export const menuItems = [
  // Public core navigation
  {
    id: 'home',
    labelKey: 'home',
    path: '/',
    icon: HiOutlineHome,
    activeIcon: HiHome,
    end: true,
    isPublic: true,
  },
  {
    // Consolidated Communities (work-order §2): All tab is a public browse
    // grid; the My Communities tab prompts guests to sign in.
    id: 'communities',
    labelKey: 'communities',
    path: '/communities',
    icon: HiOutlineUserGroup,
    activeIcon: HiUserGroup,
    isPublic: true,
  },
  {
    id: 'branches',
    labelKey: 'branches',
    path: '/branches',
    icon: HiOutlineBuildingOffice2,
    activeIcon: HiBuildingOffice2,
    isPublic: true,
  },
  {
    id: 'tracks',
    labelKey: 'tracks',
    path: '/tracks',
    icon: HiOutlineAcademicCap,
    activeIcon: HiAcademicCap,
    isPublic: true,
  },
  {
    id: 'jobs',
    labelKey: 'jobs',
    path: '/jobs',
    icon: HiOutlineBriefcase,
    activeIcon: HiBriefcase,
    isPublic: true,
  },
  {
    id: 'events',
    labelKey: 'events',
    path: '/events',
    icon: HiOutlineCalendarDays,
    activeIcon: HiCalendarDays,
    isPublic: true,
  },

  // Authenticated utilities (badge keys map to useSidebarStore counters)
  {
    id: 'notifications',
    labelKey: 'notifications',
    path: '/notifications',
    icon: HiOutlineBell,
    activeIcon: HiBell,
    badgeKey: 'unreadNotifications',
    isPublic: false,
  },
  {
    id: 'messages',
    labelKey: 'messages',
    path: '/messages',
    icon: HiOutlineEnvelope,
    activeIcon: HiEnvelope,
    badgeKey: 'unreadMessages',
    isPublic: false,
  },
  {
    id: 'saved',
    labelKey: 'saved',
    path: '/saved',
    icon: HiOutlineBookmark,
    activeIcon: HiBookmark,
    isPublic: false,
  },
];

export default menuItems;
