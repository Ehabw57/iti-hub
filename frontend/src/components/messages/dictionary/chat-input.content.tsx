import { t, type Dictionary } from "intlayer";

const chatInputContent = {
  key: "chat-input",
  content: {
    placeholder: t({
      en: "Type a message...",
      ar: "اكتب رسالة...",
    }),
    addEmoji: t({
      en: "Add emoji",
      ar: "إضافة رمز تعبيري",
    }),
    attachFile: t({
      en: "Attach file",
      ar: "إرفاق ملف",
    }),
    sendMessage: t({
      en: "Send message",
      ar: "إرسال رسالة",
    }),
  },
} satisfies Dictionary;

export default chatInputContent;
