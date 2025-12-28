import { t } from "intlayer";

export default {
  key: "feedHome",
  content: {
    // Tab labels
    homeTab: t({ en: "Home", ar: "الرئيسية" }),
    followingTab: t({ en: "Following", ar: "المتابَعون" }),
    trendingTab: t({ en: "Trending", ar: "الرائج" }),
    savedTab: t({ en: "Saved", ar: "المحفوظة" }),
    
    // Loading states
    loadingFeed: t({ en: "Loading feed...", ar: "جاري تحميل الخلاصة..." }),
    loadingMore: t({ en: "Loading more posts...", ar: "جاري تحميل المزيد..." }),
    
    // Empty states
    noPostsTitle: t({ en: "No posts yet", ar: "لا توجد منشورات بعد" }),
    noPostsMessage: t({ en: "Follow users to see their posts in your feed", ar: "تابع المستخدمين لرؤية منشوراتهم في خلاصتك" }),
    noFollowingPostsTitle: t({en: 'No posts from followed users', ar: "لا توجد منشورات من المستخدمين المتابعين"}),
    noFollowingPosts: t({ en: "Follow users or join communities to see posts", ar: "تابع المستخدمين أو انضم إلى المجتمعات لرؤية المنشورات" }),
    noTrendingPostsTitle: t({en: "No Trending Posts", ar: "لا توجد منشورات رائجة"}),
    noTrendingPosts: t({ en: "No trending posts in this period", ar: "لا توجد منشورات رائجة في هذه الفترة" }),
    noSavedPostsTitle: t({en: "No saved posts", ar: "لا توجد منشورات محفوظه"}),
    noSavedPosts: t({ en: "You haven't saved any posts yet", ar: "لم تحفظ أي منشورات بعد" }),
    savedPostsTitle: t({ en: "Saved Posts", ar: "المنشورات المحفوظة" }),
    
    // Errors
    errorLoadingFeed: t({ en: "Failed to load feed", ar: "فشل تحميل الخلاصة" }),
    errorRetry: t({ en: "Retry", ar: "إعادة المحاولة" }),
    
    // Actions
    createPost: t({ en: "Create Post", ar: "إنشاء منشور" }),
    refreshFeed: t({ en: "Refresh", ar: "تحديث" }),
    
    // Post interactions
    like: t({ en: "Like", ar: "إعجاب" }),
    unlike: t({ en: "Unlike", ar: "إلغاء الإعجاب" }),
    comment: t({ en: "Comment", ar: "تعليق" }),
    repost: t({ en: "Repost", ar: "إعادة نشر" }),
    reposted: t({ en: "Reposted", ar: "تمت إعادة النشر" }),
    share: t({ en: "Share", ar: "مشاركة" }),
    save: t({ en: "Save", ar: "حفظ" }),
    unsave: t({ en: "Unsave", ar: "إلغاء الحفظ" }),
    
    // Success messages
    postLiked: t({ en: "Post liked", ar: "تم الإعجاب بالمنشور" }),
    postUnliked: t({ en: "Post unliked", ar: "تم إلغاء الإعجاب" }),
    postSaved: t({ en: "Post saved", ar: "تم حفظ المنشور" }),
    postUnsaved: t({ en: "Post removed from saved", ar: "تم إزالة المنشور من المحفوظات" }),
    linkCopied: t({ en: "Link copied to clipboard", ar: "تم نسخ الرابط" }),
    postReposted: t({ en: "Post reposted successfully", ar: "تم إعادة نشر المنشور بنجاح" }),
    
    // Error messages
    errorLikingPost: t({ en: "Failed to like post", ar: "فشل الإعجاب بالمنشور" }),
    errorSavingPost: t({ en: "Failed to save post", ar: "فشل حفظ المنشور" }),
    errorRepostingPost: t({ en: "Failed to repost", ar: "فشلت إعادة النشر" }),
    errorCopyingLink: t({ en: "Failed to copy link", ar: "فشل نسخ الرابط" }),
    
    // Post menu (edit/delete)
    editPost: t({ en: "Edit", ar: "تعديل" }),
    deletePost: t({ en: "Delete", ar: "حذف" }),
    confirmDeleteTitle: t({ en: "Delete post?", ar: "حذف المنشور؟" }),
    confirmDeleteBody: t({ en: "This action cannot be undone.", ar: "لا يمكن التراجع عن هذا الإجراء." }),
    delete: t({ en: "Delete", ar: "حذف" }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
    updateSuccess: t({ en: "Post updated successfully", ar: "تم تحديث المنشور بنجاح" }),
    updateFailed: t({ en: "Failed to update post", ar: "فشل تحديث المنشور" }),
    edited: t({ en: "edited", ar: "معدّل" }),
    
    // Read more/less
    readMore: t({ en: "Read more", ar: "اقرأ المزيد" }),
    showLess: t({ en: "Show less", ar: "إظهار أقل" }),
  }
};
