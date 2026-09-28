import { t } from "intlayer";

export default {
  key: "navbar",
  content: {
    searchPlaceholder: t({ en: "Quick search...", ar: "بحث سريع..." }),
    loading: t({ en: "Loading...", ar: "جارٍ التحميل..." }),
    noResults: t({ en: "No results", ar: "لا توجد نتائج" }),
    users: t({ en: "Users", ar: "المستخدمون" }),
    communities: t({ en: "Communities", ar: "المجتمعات" }),
    expandSearch: t({ en: "Expand search", ar: "توسيع البحث" }),
    collapseSearch: t({ en: "Collapse search", ar: "إغلاق البحث" }),
    logout: t({ en: "Logout", ar: "تسجيل الخروج" }),
    notifications: t({ en: "Notifications", ar: "الإشعارات" }),
    messages: t({ en: "Messages", ar: "الرسائل" }),
    myProfile: t({ en: "My Profile", ar: "ملفي الشخصي" }),
  },
};
