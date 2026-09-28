import { t } from "intlayer";

export default {
  key: "events",
  content: {
    pageTitle: t({ en: "Events", ar: "الأحداث" }),
    pageSubtitle: t({
      en: "Hackathons, sessions and gatherings across ITI branches.",
      ar: "هاكاثونات وجلسات ولقاءات عبر فروع ITI.",
    }),
    signInToView: t({
      en: "Sign in to view events",
      ar: "سجّل الدخول لعرض الأحداث",
    }),
    signInRequiredMessage: t({
      en: "Events are only visible to signed-in members.",
      ar: "الأحداث متاحة للأعضاء المسجّلين فقط.",
    }),
    signIn: t({ en: "Sign in", ar: "تسجيل الدخول" }),
    errorLoading: t({
      en: "Could not load events. Please try again.",
      ar: "تعذر تحميل الأحداث. حاول مرة أخرى.",
    }),
    emptyTitle: t({ en: "No events yet", ar: "لا توجد أحداث بعد" }),
    emptyMessage: t({
      en: "Upcoming ITI events will appear here.",
      ar: "ستظهر هنا أحداث ITI القادمة.",
    }),
    upcoming: t({ en: "Upcoming", ar: "القادمة" }),
    past: t({ en: "Past", ar: "الماضية" }),
    allEvents: t({ en: "All", ar: "الكل" }),
    register: t({ en: "Register", ar: "سجّل" }),
    unregister: t({ en: "Unregister", ar: "إلغاء التسجيل" }),
    registered: t({ en: "Registered", ar: "تم التسجيل" }),
    attendees: t({ en: "attendees", ar: "حاضرًا" }),
    branches: t({ en: "Branches", ar: "الفروع" }),
    branchCount: t({ en: "branches participating", ar: "فرعًا مشاركًا" }),
    viewDetails: t({ en: "Details", ar: "التفاصيل" }),
    hideDetails: t({ en: "Hide details", ar: "إخفاء التفاصيل" }),
    location: t({ en: "Location", ar: "المكان" }),
    createdBy: t({ en: "Organized by", ar: "ينظمه" }),
    registerError: t({
      en: "Failed to update registration",
      ar: "فشل تحديث التسجيل",
    }),
    registerSuccess: t({ en: "Registration updated", ar: "تم تحديث التسجيل" }),
    externalLink: t({ en: "Open event page", ar: "فتح صفحة الحدث" }),
  },
};
