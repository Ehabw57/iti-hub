import { t } from "intlayer";

export default {
  key: "search-page",
  content: {
    title: t({
      en: "Search",
      ar: "بحث",
    }),

    searchPlaceholder: t({
      en: "Type something in the search box and press Enter.",
      ar: "اكتب شيئًا في مربع البحث ثم اضغط Enter",
    }),

    searchResultsFor: t({
      en: "Search results for",
      ar: "نتائج البحث عن",
    }),

    back: t({
      en: "Back",
      ar: "رجوع",
    }),

    usersTab: t({
      en: "Users",
      ar: "المستخدمون",
    }),
    postsTab: t({
      en: "Posts",
      ar: "المنشورات",
    }),
    communitiesTab: t({
      en: "Communities",
      ar: "المجتمعات",
    }),

    loading: t({
      en: "Loading results...",
      ar: "جاري تحميل النتائج...",
    }),

    errorLoading: t({
      en: "Error loading results",
      ar: "خطأ أثناء تحميل النتائج",
    }),

    noResults: t({
      en: "No results found.",
      ar: "لا توجد نتائج.",
    }),

    prev: t({
      en: "Prev",
      ar: "السابق",
    }),
    next: t({
      en: "Next",
      ar: "التالي",
    }),
    page: t({
      en: "Page",
      ar: "صفحة",
    }),
  },
};
