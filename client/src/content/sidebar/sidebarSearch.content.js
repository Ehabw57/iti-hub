import { t } from "intlayer";

/**
 * Site-wide sidebar search (Round 3 work order §1).
 * Dictionary for the SidebarSearch component.
 */
export default {
  key: "sidebarSearch",
  content: {
    searchPlaceholder: t({ en: "Search ITI Hub", ar: "ابحث في ITI Hub" }),
    clear: t({ en: "Clear search", ar: "مسح البحث" }),
    searching: t({ en: "Searching...", ar: "جارٍ البحث..." }),
    startTyping: t({ en: "Start typing to search", ar: "ابدأ الكتابة للبحث" }),
    noResults: t({ en: "No results for", ar: "لا توجد نتائج عن" }),
    seeAllResults: t({ en: "See all results for", ar: "عرض كل النتائج عن" }),

    // Result group labels
    branches: t({ en: "Branches", ar: "الفروع" }),
    tracks: t({ en: "Tracks", ar: "المسارات" }),
    users: t({ en: "Users", ar: "المستخدمون" }),
    communities: t({ en: "Communities", ar: "المجتمعات" }),
    jobs: t({ en: "Jobs", ar: "الوظائف" }),
    posts: t({ en: "Posts", ar: "المنشورات" }),
    members: t({ en: "members", ar: "أعضاء" }),
  },
};