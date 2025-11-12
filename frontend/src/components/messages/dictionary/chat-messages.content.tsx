import { t, type Dictionary } from "intlayer";

const chatMessagesContent = {
  key: "chat-messages",
  content: {
    noMessages: t({
      en: "No messages yet. Start the conversation!",
      ar: "لا توجد رسائل بعد. ابدأ المحادثة!",
    }),
    you: t({
      en: "You",
      ar: "أنت",
    }),
  },
} satisfies Dictionary;

export default chatMessagesContent;
