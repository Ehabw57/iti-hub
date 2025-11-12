import { t, type Dictionary } from "intlayer";

const sidebarContent = {
  key: "sidebar",
  content: {
    title: t({
      en: "Messages",
      ar: "الرسائل",
    }),
    searchPlaceholder: t({
      en: "Search messages",
      ar: "ابحث في الرسائل",
    }),
    noConversations: t({
      en: "No conversations found",
      ar: "لم يتم العثور على محادثات",
    }),
    online: t({
      en: "Online",
      ar: "متصل",
    }),
    offline: t({
      en: "Offline",
      ar: "غير متصل",
    }),
  },
} satisfies Dictionary;

export default sidebarContent;
