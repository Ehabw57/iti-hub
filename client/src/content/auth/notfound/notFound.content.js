import { t } from "intlayer";

export default {
  key: "notFound",
  content: {
    title: t({
      en: "Page Not Found",
      ar: "الصفحة غير موجودة",
    }),
    description: t({
      en: "Sorry, the page you are looking for does not exist or has been moved.",
      ar: "للأسف الصفحة اللي بتحاولي توصلّي لها مش موجودة أو اتنقلت.",
    }),
    home: t({
      en: "Back to Home",
      ar: "الرجوع للرئيسية",
    }),
    search: t({
      en: "Search",
      ar: "البحث",
    }),
    langSwitch: t({
      en: "AR",
      ar: "EN",
    }),
  },
};
