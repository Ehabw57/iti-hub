import { t, type Dictionary } from "intlayer";

const messagesPageContent = {
  key: "messages-page",
  content: {
    emptyStateIcon: t({
      en: "💬",
      ar: "💬",
    }),
    emptyStateText: t({
      en: "Select a conversation to start chatting",
      ar: "اختر محادثة لبدء الدردشة",
    }),
  },
} satisfies Dictionary;

export default messagesPageContent;
