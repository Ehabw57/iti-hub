import { t } from "intlayer";

export default {
  key: "jobs",
  content: {
    pageTitle: t({ en: "Jobs", ar: "الوظائف" }),
    pageSubtitle: t({
      en: "Opportunities posted by ITI instructors and admins",
      ar: "فرص عمل نشرها مدربو ومشرفو ITI",
    }),
    emptyTitle: t({ en: "No jobs posted yet", ar: "لا توجد وظائف منشورة بعد" }),
    emptyMessage: t({
      en: "New opportunities from ITI partners will appear here.",
      ar: "ستظهر هنا الفرص الجديدة من شركاء ITI.",
    }),
    errorLoading: t({
      en: "Could not load jobs. Please try again.",
      ar: "تعذر تحميل الوظائف. حاول مرة أخرى.",
    }),
    signInToView: t({
      en: "Sign in to view job postings",
      ar: "سجّل الدخول لعرض الوظائف",
    }),
    apply: t({ en: "Apply", ar: "تقدّم" }),
    signIpRequired: t({ en: "Sign in required", ar: "مطلوب تسجيل الدخول" }),
    signIpRequiredMessage: t({
      en: "Job postings are only visible to signed-in members.",
      ar: "إعلانات الوظائف متاحة للأعضاء المسجّلين فقط.",
    }),
    signIn: t({ en: "Sign in", ar: "تسجيل الدخول" }),
    postedBy: t({ en: "Posted by", ar: "نشرها" }),
  },
};