import { t, insert } from "intlayer";

export default {
  key: "notificationsCenter",
  content: {
    pageTitle: t({ en: "Notifications", ar: "الإشعارات" }),

    markAllAsRead: t({ en: "Mark all as read", ar: "وضع علامة مقروءة على الكل" }),
    refresh: t({ en: "Refresh", ar: "تحديث" }),

    noNotifications: t({ en: "No notifications yet", ar: "لا توجد إشعارات بعد" }),
    noNotificationsDescription: t({
      en: "When someone interacts with your content, you'll see it here",
      ar: "عندما يتفاعل أحدهم مع محتواك، سترى ذلك هنا",
    }),

    loadingNotifications: t({ en: "Loading notifications...", ar: "جاري تحميل الإشعارات..." }),
    loadingMore: t({ en: "Loading more...", ar: "جاري تحميل المزيد..." }),

    errorLoadingNotifications: t({ en: "Failed to load notifications", ar: "فشل تحميل الإشعارات" }),
    errorMarkingAsRead: t({ en: "Failed to mark as read", ar: "فشل وضع علامة مقروءة" }),
    tryAgain: t({ en: "Try again", ar: "حاول مرة أخرى" }),

    notificationTypes: {
      like: insert({ en: "{{actor}} liked your post", ar: "{{actor}} أعجب بمنشورك" }),
      comment: insert({ en: "{{actor}} commented on your post", ar: "{{actor}} علّق على منشورك" }),
      reply: insert({ en: "{{actor}} replied to your comment", ar: "{{actor}} رد على تعليقك" }),
      repost: insert({ en: "{{actor}} reposted your post", ar: "{{actor}} أعاد نشر منشورك" }),
      follow: insert({ en: "{{actor}} started following you", ar: "{{actor}} بدأ بمتابعتك" }),
      comment_like: insert({ en: "{{actor}} liked your comment", ar: "{{actor}} أعجب بتعليقك" }),
    },

    actorGroupingTwo: insert({ en: "{{actor1}} and {{actor2}}", ar: "{{actor1}} و {{actor2}}" }),
    actorGroupingMultiple: insert({ en: "{{actor1}} and {{count}} others", ar: "{{actor1}} و {{count}} آخرون" }),
    
    oneOther: t({ en: "1 other", ar: "آخر" }),
    defaultInteraction: t({ en: "interacted with your content", ar: "تفاعل مع محتواك" }),

    groupedActions: {
      liked: t({ en: "liked", ar: "أعجبوا" }),
      commented: t({ en: "commented", ar: "علّقوا" }),
      reposted: t({ en: "reposted", ar: "أعادوا النشر" }),
      followedYou: t({ en: "followed you", ar: "تابعوك" }),
      likedComment: t({ en: "liked your comment", ar: "أعجبوا بتعليقك" }),
    },

    timeLabels: {
      justNow: t({ en: "Just now", ar: "الآن" }),
      minuteAgo: t({ en: "1m", ar: "1د" }),
      minutesAgo: insert({ en: "{{count}}m", ar: "{{count}}د" }),
      hourAgo: t({ en: "1h", ar: "1س" }),
      hoursAgo: insert({ en: "{{count}}h", ar: "{{count}}س" }),
      dayAgo: t({ en: "1d", ar: "1ي" }),
      daysAgo: insert({ en: "{{count}}d", ar: "{{count}}ي" }),
      weekAgo: t({ en: "1w", ar: "1أ" }),
      weeksAgo: insert({ en: "{{count}}w", ar: "{{count}}أ" }),
      monthAgo: t({ en: "1mo", ar: "1ش" }),
      monthsAgo: insert({ en: "{{count}}mo", ar: "{{count}}ش" }),
      yearAgo: t({ en: "1y", ar: "1س" }),
      yearsAgo: insert({ en: "{{count}}y", ar: "{{count}}س" }),
    },

    newBadge: t({ en: "New", ar: "جديد" }),
    unreadCount: insert({ en: "{{count}} unread", ar: "{{count}} غير مقروء" }),

    markAsRead: t({ en: "Mark as read", ar: "وضع علامة مقروءة" }),
    viewPost: t({ en: "View post", ar: "عرض المنشور" }),
    viewProfile: t({ en: "View profile", ar: "عرض الملف الشخصي" }),
    unknownUser: t({ en: "Unknown user", ar: "مستخدم غير معروف" }),
    loading: t({ en: "...", ar: "..." }),

    markedAsRead: t({ en: "Marked as read", ar: "تم وضع علامة مقروءة" }),
    allMarkedAsRead: t({ en: "All notifications marked as read", ar: "تم وضع علامة مقروءة على جميع الإشعارات" }),
  },
};
