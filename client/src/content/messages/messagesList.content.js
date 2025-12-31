import { t, insert } from "intlayer";

export default {
  key: "messagesList",
  content: {
    pageTitle: t({ en: "Messages", ar: "الرسائل" }),

    // Action buttons
    newMessage: t({ en: "New message", ar: "رسالة جديدة" }),
    newGroup: t({ en: "New group", ar: "مجموعة جديدة" }),
    addMembers: t({ en: "Add members", ar: "إضافة أعضاء" }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
    // Empty states
    noConversations: t({ en: "No messages yet", ar: "لا توجد رسائل بعد" }),
    noConversationsDescription: t({
      en: "Start a conversation with someone to see it here",
      ar: "ابدأ محادثة مع شخص ما لرؤيتها هنا",
    }),

    // Loading states
    loadingConversations: t({ en: "Loading conversations...", ar: "جاري تحميل المحادثات..." }),
    loadingMore: t({ en: "Loading more...", ar: "جاري تحميل المزيد..." }),
    editGroup: t({ en: "Editing group...", ar: "جاري تعديل المجموعة..." }),
    // Error messages
    errorLoadingConversations: t({
      en: "Failed to load conversations",
      ar: "فشل تحميل المحادثات",
    }),
    errorCreatingConversation: t({
      en: "Failed to create conversation",
      ar: "فشل إنشاء المحادثة",
    }),
    tryAgain: t({ en: "Try again", ar: "حاول مرة أخرى" }),

    // Search
    searchPlaceholder: t({ en: "Search conversations...", ar: "البحث في المحادثات..." }),

    // Time labels
    timeLabels: {
      justNow: t({ en: "Just now", ar: "الآن" }),
      minute: t({ en: "1m", ar: "1د" }),
      minutes: insert({ en: "{{count}}m", ar: "{{count}}د" }),
      hour: t({ en: "1h", ar: "1س" }),
      hours: insert({ en: "{{count}}h", ar: "{{count}}س" }),
      day: t({ en: "1d", ar: "1ي" }),
      days: insert({ en: "{{count}}d", ar: "{{count}}ي" }),
      week: t({ en: "1w", ar: "1أ" }),
      weeks: insert({ en: "{{count}}w", ar: "{{count}}أ" }),
      month: t({ en: "1mo", ar: "1ش" }),
      months: insert({ en: "{{count}}mo", ar: "{{count}}ش" }),
      year: t({ en: "1y", ar: "1س" }),
      years: insert({ en: "{{count}}y", ar: "{{count}}س" }),
    },

    // Conversation labels
    you: t({ en: "You", ar: "أنت" }),
    youPrefix: insert({ en: "You: {{message}}", ar: "أنت: {{message}}" }),
    typing: t({ en: "Typing...", ar: "يكتب..." }),
    groupMembers: insert({ en: "{{count}} members", ar: "{{count}} أعضاء" }),
    member: t({ en: "1 member", ar: "عضو واحد" }),
    initialMessage: t({ en: "Group created", ar: "تم إنشاء المجموعة" }),

    // Unread badge
    unreadBadge: insert({ en: "{{count}} new", ar: "{{count}} جديد" }),
    newBadge: t({ en: "New", ar: "جديد" }),

    // Message preview
    photoMessage: t({ en: "Photo", ar: "صورة" }),
    deletedMessage: t({ en: "Message deleted", ar: "الرسالة محذوفة" }),

    // Validation messages
    invalidImageType: t({ en: "Please select an image file", ar: "يرجى اختيار ملف صورة" }),
    selectAtLeastTwoMembers: t({ en: "Please select at least 2 members", ar: "يرجى اختيار عضوين على الأقل" }),
  },
};
