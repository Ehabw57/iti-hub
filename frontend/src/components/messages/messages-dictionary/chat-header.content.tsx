import { t, type Dictionary } from "intlayer";

const chatHeaderContent = {
  key: "chat-header",
  content: {
    online: t({
      en: "Online",
      ar: "متصل",
    }),
    offline: t({
      en: "Offline",
      ar: "غير متصل",
    }),
    backButton: t({
      en: "Back to conversations",
      ar: "العودة إلى المحادثات",
    }),
    videoCall: t({
      en: "Video call",
      ar: "مكالمة فيديو",
    }),
    voiceCall: t({
      en: "Voice call",
      ar: "مكالمة صوتية",
    }),
    moreOptions: t({
      en: "More options",
      ar: "المزيد من الخيارات",
    }),
  },
} satisfies Dictionary;

export default chatHeaderContent;
