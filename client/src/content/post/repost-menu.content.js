import { t } from 'intlayer';

export default {
  key: 'repost-menu',
  content: {
    repost: t({
      en: 'Repost',
      ar: 'إعادة نشر',
    }),
    repostNow: t({
      en: 'Repost now',
      ar: 'إعادة النشر الآن',
    }),
    repostNowDescription: t({
      en: 'Instantly share to your followers',
      ar: 'مشاركة فورية مع متابعيك',
    }),
    repostWithComment: t({
      en: 'Repost with comment',
      ar: 'إعادة النشر مع تعليق',
    }),
    repostWithCommentDescription: t({
      en: 'Add your thoughts before sharing',
      ar: 'أضف رأيك قبل المشاركة',
    }),
    confirmDeleteTitle: t({
      en: 'Delete repost?',
      ar: 'حذف إعادة النشر؟',
    }),
    confirmDeleteMessage: t({
      en: 'Are you sure you want to delete this repost? This action cannot be undone.',
      ar: 'هل أنت متأكد من حذف إعادة النشر؟ لا يمكن التراجع عن هذا الإجراء.',
    }),
  },
};
