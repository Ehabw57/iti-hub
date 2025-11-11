import { t, type Dictionary } from "intlayer";

const appContent = {
  key: "app",
  content: {

    messages: t({
      en: "messages",
      ar: "الرسائل",
    }),

    home: t({
      en: "Home",
      ar: "الصفحة الرئيسية",
    }),
    
  },
} satisfies Dictionary;

export default appContent;
