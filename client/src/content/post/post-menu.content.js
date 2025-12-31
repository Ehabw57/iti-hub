import { t } from 'intlayer';

export default {
  key: 'post-menu',
  content: {
    save: t({
      en: 'Save',
      ar: 'حفظ',
    }),
    unsave: t({
      en: 'Unsave',
      ar: 'إلغاء الحفظ',
    }),
    editPost: t({
      en: 'Edit post',
      ar: 'تعديل المنشور',
    }),
    deletePost: t({
      en: 'Delete post',
      ar: 'حذف المنشور',
    }),
    reportPost: t({
      en: 'Report post',
      ar: 'الإبلاغ عن المنشور',
    }),
    confirmDeleteTitle: t({
      en: 'Delete post?',
      ar: 'حذف المنشور؟',
    }),
    confirmDeleteMessage: t({
      en: 'Are you sure you want to delete this post? This action cannot be undone.',
      ar: 'هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.',
    }),
  },
};
