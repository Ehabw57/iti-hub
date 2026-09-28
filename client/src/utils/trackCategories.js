import {
  HiOutlineCodeBracket,
  HiOutlineGlobeAlt,
  HiOutlineCommandLine,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineBriefcase,
} from 'react-icons/hi2';

/**
 * Track category wayfinding — ITI Hub design system.
 *
 * Categories live in the dedicated `Track.category` field (enum,
 * default 'Others'), seeded from `server/scripts/data/itiData.js`
 * (ITI_TRACK_CATALOG). Records created before that field existed
 * encode the category as a "[Category] description" prefix, so the
 * prefix parsing below is kept as a legacy fallback only.
 *
 * Each category maps to a `cat-*` "thread" token from the design
 * system (docs/frontEnd/REBUILD_DESIGN_SYSTEM.md §2.3) so track types
 * are recognizable at a glance across courses, branches and track
 * pages (chips, filters, headers, ...).
 *
 * Tailwind requires full literal class names — never build them by
 * concatenation, only select from the maps below.
 */

/** All categories, in ITI_TRACK_CATALOG order. */
export const TRACK_CATEGORIES = [
  'Digital Arts',
  'Information Systems',
  'Infrastructure & Networks',
  'Others',
  'Software Development',
  'Web Development',
];

/**
 * Category → icon (Heroicons v2 outline set) rendered inside the branded
 * Chip. Each category keeps a recognizable glyph across every surface.
 */
export const TRACK_CATEGORY_ICONS = {
  'Software Development': HiOutlineCodeBracket,
  'Web Development': HiOutlineGlobeAlt,
  'Information Systems': HiOutlineCommandLine,
  'Infrastructure & Networks': HiOutlineUserGroup,
  'Digital Arts': HiOutlineSparkles,
  // Neutral fallback also used for unknown categories.
  'Others': HiOutlineBriefcase,
};

/**
 * Get the icon for a parsed category (falls back to "Others").
 *
 * @param {string|null} category - Parsed category (or null)
 * @returns {Component} react-icons component
 */
export function getTrackCategoryIcon(category) {
  return TRACK_CATEGORY_ICONS[category] ?? TRACK_CATEGORY_ICONS.Others;
}

/**
 * Category → chip tone classes built on the per-category `cat-*` thread
 * tokens (text uses the token, background a 10% tint of it, plus a hairline
 * border of the same hue — the branded Chip shape from common/Chip.jsx).
 *
 * The `cat-*` tokens flip automatically in dark mode via the `.dark`
 * overrides in src/index.css, keeping chips legible in both themes.
 */
export const TRACK_CATEGORY_STYLES = {
  'Software Development': 'border-cat-software/25 bg-cat-software/10 text-cat-software',
  'Web Development': 'border-cat-web/25 bg-cat-web/10 text-cat-web',
  'Information Systems': 'border-cat-systems/25 bg-cat-systems/10 text-cat-systems',
  'Infrastructure & Networks': 'border-cat-networks/25 bg-cat-networks/10 text-cat-networks',
  'Digital Arts': 'border-cat-arts/25 bg-cat-arts/10 text-cat-arts',
  // Neutral fallback also used for unknown categories.
  'Others': 'border-cat-other/25 bg-cat-other/10 text-cat-other',
};

/**
 * Legacy helper: parse the "[Category] description" prefix older
 * seeders wrote into track descriptions. Still used to recover the
 * category when `track.category` is missing and to strip the prefix
 * from displayed text.
 *
 * @param {string} description - Raw track description
 * @returns {{ category: string|null, text: string }} Parsed category
 *   (null when absent) and the description without the prefix
 */
export function parseTrackDescription(description) {
  if (!description || typeof description !== 'string') {
    return { category: null, text: '' };
  }

  const match = description.match(/^\s*\[([^\]]+)\]\s*/);
  if (!match) {
    return { category: null, text: description.trim() };
  }

  return {
    category: match[1].trim(),
    text: description.slice(match[0].length).trim(),
  };
}

/**
 * Resolve a track's effective category.
 *
 * Prefers the dedicated `track.category` field; falls back to the
 * legacy "[Category] description" prefix so pre-existing records keep
 * rendering their chip.
 *
 * @param {object|null} track - Track document (API payload)
 * @returns {string|null} Category name, or null when absent
 */
export function getTrackCategory(track) {
  if (track?.category && TRACK_CATEGORY_STYLES[track.category]) {
    return track.category;
  }
  const { category } = parseTrackDescription(track?.description);
  if (category) return category;
  return track?.category || null;
}

/**
 * Chip classes for a parsed category. Unknown categories fall back to
 * the neutral "Others" style.
 *
 * @param {string|null} category - Parsed category (or null)
 * @returns {string} Tailwind class string
 */
export function getTrackCategoryStyle(category) {
  return TRACK_CATEGORY_STYLES[category] ?? TRACK_CATEGORY_STYLES.Others;
}

/**
 * intlayer content key holding the localized label for a category
 * (see src/content/courses/courses.content.js).
 *
 * @param {string|null} category - Parsed category (or null)
 * @returns {string} Content dictionary key
 */
export function getTrackCategoryLabelKey(category) {
  if (!category) return 'categoryOthers';
  return `category${category.replace(/[^a-zA-Z]/g, '')}`;
}