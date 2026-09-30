import { t } from "intlayer";

export default {
  key: "sidebar",
  content: {
    // Main navigation items
    feed: t({ en: "Feed", ar: "الخلاصة" }),
    home: t({ en: "Home", ar: "الرئيسية" }),
    explore: t({ en: "Explore", ar: "استكشف" }),
    ask: t({ en: "Ask Community", ar: "اسأل المجتمع" }),
    communities: t({ en: "Communities", ar: "المجتمعات" }),
    notifications: t({ en: "Notifications", ar: "الإشعارات" }),
    messages: t({ en: "Messages", ar: "الرسائل" }),
    profile: t({ en: "Profile", ar: "الملف الشخصي" }),
    
    // Community actions
    createCommunity: t({ en: "Create Community", ar: "إنشاء مجتمع" }),
    myCommunities: t({ en: "My Communities", ar: "مجتمعاتي" }),
    noCommunitiesYet: t({ en: "No communities joined yet", ar: "لم تنضم لأي مجتمعات بعد" }),
    viewAll: t({ en: "View all", ar: "عرض الكل" }),
    
    // Branches & Community (top-level sections)
    branches: t({ en: "Branches", ar: "الفروع" }),
    community: t({ en: "Community", ar: "المجتمع" }),
    courses: t({ en: "Courses", ar: "المسارات" }),
    tracks: t({ en: "Tracks", ar: "المسارات" }),
    groups: t({ en: "Groups", ar: "المجموعات" }),

    // Screens-style labels
    resources: t({ en: "Resources", ar: "الموارد" }),
    jobs: t({ en: "Jobs", ar: "الوظائف" }),
    events: t({ en: "Events", ar: "الأحداث" }),
    helpCenter: t({ en: "Help Center", ar: "مركز المساعدة" }),
    supportSection: t({ en: "SUPPORT", ar: "الدعم" }),

    // Profile menu items
    following: t({ en: "Following", ar: "المتابَعون" }),
    saved: t({ en: "Saved", ar: "المحفوظة" }),
    myProfile: t({ en: "My Profile", ar: "ملفي الشخصي" }),
    settings: t({ en: "Settings", ar: "الإعدادات" }),
    logout: t({ en: "Logout", ar: "تسجيل الخروج" }),
    
    // Footer actions
    createPost: t({ en: "Create Post", ar: "إنشاء منشور" }),
    post: t({ en: "Post", ar: "منشور" }),
    more: t({ en: "More", ar: "المزيد" }),
    account: t({ en: "Account", ar: "الحساب" }),
    darkMode: t({ en: "Dark mode", ar: "الوضع الليلي" }),
    language: t({ en: "Language", ar: "اللغة" }),
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
