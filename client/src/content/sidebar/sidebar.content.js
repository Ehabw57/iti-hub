import { t } from "intlayer";

export default {
  key: "sidebar",
  content: {
    // Main navigation items
    feed: t({ en: "Feed", ar: "الخلاصة" }),
    explore: t({ en: "Explore", ar: "استكشف" }),
    communities: t({ en: "Communities", ar: "المجتمعات" }),
    notifications: t({ en: "Notifications", ar: "الإشعارات" }),
    messages: t({ en: "Messages", ar: "الرسائل" }),
    profile: t({ en: "Profile", ar: "الملف الشخصي" }),
    
    // Community actions
    createCommunity: t({ en: "Create Community", ar: "إنشاء مجتمع" }),
    myCommunities: t({ en: "My Communities", ar: "مجتمعاتي" }),
    noCommunitiesYet: t({ en: "No communities joined yet", ar: "لم تنضم لأي مجتمعات بعد" }),
    viewAll: t({ en: "View all", ar: "عرض الكل" }),
    
    // Profile menu items
    following: t({ en: "Following", ar: "المتابَعون" }),
    saved: t({ en: "Saved", ar: "المحفوظة" }),
    myProfile: t({ en: "My Profile", ar: "ملفي الشخصي" }),
    logout: t({ en: "Logout", ar: "تسجيل الخروج" }),
    
    // Footer actions
    createPost: t({ en: "Create Post", ar: "إنشاء منشور" }),
    signUp: t({ en: "Sign Up", ar: "التسجيل" }),
    login: t({ en: "Login", ar: "تسجيل الدخول" }),
    
    // Mobile menu
    menu: t({ en: "Menu", ar: "القائمة" }),
    openMenu: t({ en: "Open menu", ar: "فتح القائمة" }),
    closeMenu: t({ en: "Close menu", ar: "إغلاق القائمة" }),
    
    // Badge labels
    unreadNotifications: t({ en: "unread notifications", ar: "إشعارات غير مقروءة" }),
    unreadMessages: t({ en: "unread messages", ar: "رسائل غير مقروءة" }),
  },
};
