import { t } from "intlayer";

export default {
  key: "groups",
  content: {
    // Page title
    pageTitle: t({ en: "Communities", ar: "المجتمعات" }),
    pageSubtitle: t({
      en: "Connect with peers, share knowledge, and grow together.",
      ar: "تواصل مع زملائك، شارك المعرفة، وانمُ معًا.",
    }),

    // Sections
    myGroups: t({ en: "My Groups", ar: "مجموعاتي" }),
    viewAll: t({ en: "View All", ar: "عرض الكل" }),
    discover: t({ en: "Discover Communities", ar: "اكتشف المجتمعات" }),

    // Tabs (consolidated Communities page — work-order §2)
    tabAll: t({ en: "All", ar: "الكل" }),
    tabMyCommunities: t({ en: "My Communities", ar: "مجتمعاتي" }),

    // My Communities empty state
    noMyCommunitiesTitle: t({
      en: "You haven't joined any communities yet",
      ar: "لم تنضم إلى أي مجتمعات بعد",
    }),
    noMyCommunitiesMessage: t({
      en: "Browse the All tab and join ones that interest you!",
      ar: "تصفح تبويب الكل وانضم إلى ما يهمك!",
    }),

    // Guest sign-in prompt (My Communities tab)
    signInTitle: t({
      en: "Sign in to view your communities",
      ar: "سجّل الدخول لعرض مجتمعاتك",
    }),
    signInMessage: t({
      en: "Join communities to connect with peers and share knowledge.",
      ar: "انضم إلى المجتمعات للتواصل مع الزملاء ومشاركة المعرفة.",
    }),
    signIn: t({ en: "Sign in", ar: "تسجيل الدخول" }),

    // Loading
    loadingGroups: t({ en: "Loading groups...", ar: "جاري تحميل المجموعات..." }),

    // Empty
    noGroupsTitle: t({ en: "No groups found", ar: "لم يتم العثور على مجموعات" }),
    noGroupsMessage: t({ en: "Be the first to create a group!", ar: "كن أول من ينشئ مجموعة!" }),

    // Errors
    errorLoading: t({ en: "Failed to load groups", ar: "فشل تحميل المجموعات" }),
    errorRetry: t({ en: "Retry", ar: "إعادة المحاولة" }),

    // Actions
    createGroup: t({ en: "Create Group", ar: "إنشاء مجموعة" }),
    joinGroup: t({ en: "Join", ar: "انضمام" }),
    leaveGroup: t({ en: "Leave", ar: "مغادرة" }),
    members: t({ en: "members", ar: "أعضاء" }),

    // Search
    searchGroups: t({ en: "Search groups...", ar: "ابحث عن مجموعات..." }),
  },
};
