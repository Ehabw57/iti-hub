import { t } from "intlayer";

export default {
  key: "commentForm",
  content: {
    title: t({ en: "Comments", ar: "التعليقات" }),
    placeholder: t({ en: "Write a comment...", ar: "اكتب تعليقًا..." }),
    submit: t({ en: "Submit", ar: "إرسال" }),
    submitLoading: t({ en: "Committing...", ar: "جارٍ النشر..." }),
    noComments: t({ en: "No comments yet. Be the first to comment!", ar: "لا توجد تعليقات بعد. كن أول من يعلق!" }),
    
    // Comment interactions
    like: t({ en: "Like", ar: "إعجاب" }),
    liked: t({ en: "Liked", ar: "معجب به" }),
    likes: t({ en: "likes", ar: "إعجابات" }),
    likeFailed: t({ en: "Failed to like comment", ar: "فشل الإعجاب بالتعليق" }),
    reply: t({ en: "Reply", ar: "رد" }),
    replies: t({ en: "Replies", ar: "ردود" }),
    view: t({ en: "View", ar: "عرض" }),
    edited: t({ en: "edited", ar: "معدل" }),
    
    // Loading states
    loadingComments: t({ en: "Loading comments...", ar: "جارٍ تحميل التعليقات..." }),
    loadingReplies: t({ en: "Loading replies...", ar: "جارٍ تحميل الردود..." }),
    submittingComment: t({ en: "Submitting...", ar: "جارٍ الإرسال..." }),
    viewReplies: t({ en: "View replies", ar: "عرض الردود" }),
    hideReplies: t({ en: "Hide replies", ar: "إخفاء الردود" }),
    
    // Comment menu (edit/delete)
    editComment: t({ en: "Edit", ar: "تعديل" }),
    deleteComment: t({ en: "Delete", ar: "حذف" }),
    reportComment: t({ en: "Report", ar: "إبلاغ" }),
    save: t({ en: "Save", ar: "حفظ" }),
    saving: t({ en: "Saving...", ar: "جارٍ الحفظ..." }),
    confirmDeleteTitle: t({ en: "Delete comment?", ar: "حذف التعليق؟" }),
    confirmDeleteBody: t({ en: "This action cannot be undone.", ar: "لا يمكن التراجع عن هذا الإجراء." }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
    delete: t({ en: "Delete", ar: "حذف" }),
    commentUpdated: t({ en: "Comment updated successfully", ar: "تم تحديث التعليق بنجاح" }),
    commentDeleted: t({ en: "Comment deleted successfully", ar: "تم حذف التعليق بنجاح" }),
    updateFailed: t({ en: "Failed to update comment", ar: "فشل تحديث التعليق" }),
    deleteFailed: t({ en: "Failed to delete comment", ar: "فشل حذف التعليق" }),
    
    // Validation
    contentRequired: t({ en: "Please write something", ar: "الرجاء كتابة شيء" }),
    contentTooLong: t({ en: "Comment is too long (max 5000 characters)", ar: "التعليق طويل جدًا (الحد الأقصى 5000 حرف)" }),
  }
};
