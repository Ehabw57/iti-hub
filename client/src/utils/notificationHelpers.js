import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * @fileoverview Utility function for formatting relative time for notifications
 */

/**
 * Format a timestamp as relative time (e.g., "5m", "2h", "3d")
 *
 * @param {string | Date} timestamp - The timestamp to format
 * @param {object} content - i18n content object (from useIntlayer) - optional for backwards compatibility
 * @param {string} locale - Current locale (en, ar, etc.) - optional for backwards compatibility
 * @returns {string} Formatted relative time string
 *
 * @example
 * formatNotificationTime('2024-01-01T12:00:00Z', content, locale);
 * // Returns: "2h" (if 2 hours ago)
 */
export const formatNotificationTime = (timestamp, content, locale) => {
  const now = dayjs();
  const time = dayjs(timestamp);
  const diffMinutes = now.diff(time, "minute");
  const diffHours = now.diff(time, "hour");
  const diffDays = now.diff(time, "day");
  const diffWeeks = now.diff(time, "week");
  const diffMonths = now.diff(time, "month");
  const diffYears = now.diff(time, "year");

  // If content is not provided, use English defaults for backwards compatibility
  if (!content || !content.timeLabels) {
    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks}w`;
    } else if (diffMonths < 12) {
      return `${diffMonths}mo`;
    } else {
      return `${diffYears}y`;
    }
  }

  // Use i18n content
  const timeLabels = content.timeLabels;
  
  if (diffMinutes < 1) {
    return timeLabels.justNow;
  } else if (diffMinutes === 1) {
    return timeLabels.minuteAgo;
  } else if (diffMinutes < 60) {
    return timeLabels.minutesAgo[locale]({ count: diffMinutes });
  } else if (diffHours === 1) {
    return timeLabels.hourAgo;
  } else if (diffHours < 24) {
    return timeLabels.hoursAgo[locale]({ count: diffHours });
  } else if (diffDays === 1) {
    return timeLabels.dayAgo;
  } else if (diffDays < 7) {
    return timeLabels.daysAgo[locale]({ count: diffDays });
  } else if (diffWeeks === 1) {
    return timeLabels.weekAgo;
  } else if (diffWeeks < 4) {
    return timeLabels.weeksAgo[locale]({ count: diffWeeks });
  } else if (diffMonths === 1) {
    return timeLabels.monthAgo;
  } else if (diffMonths < 12) {
    return timeLabels.monthsAgo[locale]({ count: diffMonths });
  } else if (diffYears === 1) {
    return timeLabels.yearAgo;
  } else {
    return timeLabels.yearsAgo[locale]({ count: diffYears });
  }
};

/**
 * Get notification type display text
 *
 * @param {string} type - Notification type
 * @param {string} actorName - Name of the actor
 * @param {number} actorCount - Number of actors
 * @param {object} content - i18n content object (from useIntlayer)
 * @returns {string} Display text
 */
export const getNotificationText = (
  type,
  actorName,
  actorCount = 1,
  content
) => {
  if (
    !content ||
    !content.notificationTypes ||
    !content.notificationTypes[type]
  ) {
    return "";
  }

  const typeText = content.notificationTypes[type];

  if (actorCount === 1) {
    return typeText.replace("{actor}", actorName);
  } else {
    // For grouped notifications
    const action = content.groupedActions[type] || content.groupedActions.liked;
    return content.multipleActors
      .replace("{actor}", actorName)
      .replace("{count}", actorCount - 1)
      .replace("{action}", action);
  }
};

export default {
  formatNotificationTime,
  getNotificationText,
};
