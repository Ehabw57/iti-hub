import { t } from "intlayer";

export default {
  key: "branches",
  content: {
    // Branches list page
    title: t({ en: "Branches", ar: "الفروع" }),
    subtitle: t({
      en: "ITI training branches across Egypt — pick a branch to explore its rounds and tracks.",
      ar: "فروع معهد تكنولوجيا المعلومات في جميع أنحاء مصر — اختر فرعاً لاستكشاف دفعاته ومساراته.",
    }),
    searchPlaceholder: t({ en: "Search branches...", ar: "ابحث عن الفروع..." }),
    coreBranch: t({ en: "Core", ar: "أساسي" }),
    extensionBranch: t({ en: "Extension", ar: "امتداد" }),
    activeTracksLabel: t({ en: "active tracks", ar: "مسارات نشطة" }),
    studentsLabel: t({ en: "students", ar: "طالب" }),
    noBranchesTitle: t({ en: "No branches found", ar: "لم يتم العثور على فروع" }),
    noBranchesMessage: t({
      en: "Try a different search, or check back later.",
      ar: "جرّب بحثاً مختلفاً، أو تحقق لاحقاً.",
    }),
    errorLoadingBranches: t({ en: "Failed to load branches", ar: "فشل تحميل الفروع" }),
    loadingMore: t({ en: "Loading more...", ar: "جاري تحميل المزيد..." }),
    loadMore: t({ en: "Load more", ar: "تحميل المزيد" }),

    // Branch detail page
    backToBranches: t({ en: "Back to branches", ar: "العودة إلى الفروع" }),
    roundsTitle: t({ en: "Rounds", ar: "الدفعات" }),
    active: t({ en: "Active", ar: "نشطة" }),
    closed: t({ en: "Closed", ar: "مغلقة" }),
    tracksCount: t({ en: "tracks", ar: "مسارات" }),
    viewTracks: t({ en: "View tracks", ar: "عرض المسارات" }),
    noRoundsTitle: t({ en: "No rounds yet", ar: "لا توجد دفعات بعد" }),
    noRoundsMessage: t({
      en: "This branch has no rounds yet. Check back later!",
      ar: "لا توجد دفعات لهذا الفرع بعد. تحقق لاحقاً!",
    }),
    errorLoadingBranch: t({ en: "Failed to load branch details", ar: "فشل تحميل تفاصيل الفرع" }),

    // Round tracks page
    backToBranch: t({ en: "Back to branch", ar: "العودة إلى الفرع" }),
    noTracksTitle: t({ en: "No tracks in this round", ar: "لا توجد مسارات في هذه الدفعة" }),
    noTracksMessage: t({
      en: "This round has no tracks yet. Check back later!",
      ar: "لا توجد مسارات في هذه الدفعة بعد. تحقق لاحقاً!",
    }),
    errorLoadingTracks: t({ en: "Failed to load tracks", ar: "فشل تحميل المسارات" }),
  },
};
