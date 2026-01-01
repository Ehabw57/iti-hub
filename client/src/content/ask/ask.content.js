import { t } from 'intlayer';

export default {
  key: 'askCommunity',
  content: {
    // Page title & branding
    brandName: t({
      en: 'itiHub answers',
      ar: 'إجابات itiHub',
    }),
    pageSubtitle: t({
      en: 'Got a question? Ask it and get answers, perspectives, and recommendations from all of itiHub',
      ar: 'لديك سؤال؟ اطرحه واحصل على إجابات ووجهات نظر وتوصيات من مجتمع itiHub',
    }),

    // Input
    questionPlaceholder: t({
      en: 'Ask a question',
      ar: 'اطرح سؤالاً',
    }),
    followupPlaceholder: t({
      en: 'Ask a again',
      ar: 'اسأل سؤال اخر',
    }),
    askButton: t({
      en: 'Ask',
      ar: 'اسأل',
    }),
    askingButton: t({
      en: 'Searching posts...',
      ar: 'جاري البحث في المنشورات...',
    }),
    newQuestion: t({
      en: 'New question',
      ar: 'سؤال جديد',
    }),

    // Suggestion chips
    suggestionChips: [
      t({ en: 'best coding practices', ar: 'أفضل ممارسات البرمجة' }),
      t({ en: 'career advice for developers', ar: 'نصائح مهنية للمطورين' }),
      t({ en: 'how to learn React', ar: 'كيفية تعلم React' }),
      t({ en: 'best programming languages 2025', ar: 'أفضل لغات البرمجة 2025' }),
      t({ en: 'tips for remote work', ar: 'نصائح للعمل عن بعد' }),
      t({ en: 'interview preparation', ar: 'التحضير للمقابلات' }),
      t({ en: 'freelancing tips', ar: 'نصائح العمل الحر' }),
      t({ en: 'best tech courses', ar: 'أفضل الدورات التقنية' }),
    ],

    // Results
    answerTitle: t({
      en: 'Answer',
      ar: 'الإجابة',
    }),
    sourcesTitle: t({
      en: 'Generated from these posts:',
      ar: 'تم إنشاء الإجابة من هذه المنشورات:',
    }),
    viewPost: t({
      en: 'View Post',
      ar: 'عرض المنشور',
    }),
    viewAll: t({
      en: 'View all',
      ar: 'عرض الكل',
    }),
    by: t({
      en: 'by',
      ar: 'بواسطة',
    }),

    // Feedback
    isAnswerHelpful: t({
      en: 'Is this answer helpful?',
      ar: 'هل هذه الإجابة مفيدة؟',
    }),
    helpful: t({
      en: 'Helpful',
      ar: 'مفيدة',
    }),
    unhelpful: t({
      en: 'Unhelpful',
      ar: 'غير مفيدة',
    }),

    // Related questions
    relatedTitle: t({
      en: 'Related',
      ar: 'ذات صلة',
    }),

    // Empty state
    emptyStateTitle: t({
      en: 'Ask the Community',
      ar: 'اسأل المجتمع',
    }),
    emptyStateDescription: t({
      en: 'Type your question above and get AI-powered answers based on community posts.',
      ar: 'اكتب سؤالك أعلاه واحصل على إجابات مدعومة بالذكاء الاصطناعي من منشورات المجتمع.',
    }),

    // Errors
    questionTooShort: t({
      en: 'Please enter at least 3 characters',
      ar: 'يرجى إدخال 3 أحرف على الأقل',
    }),
    errorTitle: t({
      en: 'Failed to get answer',
      ar: 'فشل في الحصول على إجابة',
    }),

    // No results
    noRelevantPosts: t({
      en: 'No relevant posts found for your question.',
      ar: 'لم يتم العثور على منشورات ذات صلة بسؤالك.',
    }),

    // Stats
    upvotes: t({
      en: 'upvotes',
      ar: 'تصويت',
    }),
    comments: t({
      en: 'comments',
      ar: 'تعليق',
    }),
  },
};
