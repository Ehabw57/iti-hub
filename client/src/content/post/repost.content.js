import { t } from "intlayer";

export default {
  key: "repostComposer",
  content: {
    // Menu options
    repost: t({ en: "Repost", ar: "إعادة نشر" }),
    repostNow: t({ en: "Repost now", ar: "إعادة نشر الآن" }),
    repostWithComment: t({ en: "Repost with comment", ar: "إعادة نشر مع تعليق" }),
    
    // Modal labels
    addACommentOptional: t({ en: "Add a comment (optional)", ar: "إضافة تعليق (اختياري)" }),
    selectCommunityOptional: t({ en: "Select community (optional)", ar: "اختر المجتمع (اختياري)" }),
    writeYourThoughts: t({ en: "Write your thoughts...", ar: "اكتب أفكارك..." }),
    
    // Actions
    reposting: t({ en: "Reposting...", ar: "جارٍ إعادة النشر..." }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
    
    // Messages
    repostSuccess: t({ en: "Reposted successfully!", ar: "تمت إعادة النشر بنجاح!" }),
    repostFailed: t({ en: "Failed to repost", ar: "فشل إعادة النشر" }),
    
    // Validation
    commentTooLong: t({ en: "Comment is too long (max 5000 characters)", ar: "التعليق طويل جدًا (الحد الأقصى 5000 حرف)" }),
  }
};
