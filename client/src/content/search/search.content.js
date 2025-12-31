import { t } from 'intlayer';

export default {
  key: 'search',
  content: {
    // Page title
    pageTitle: t({
      en: 'Search',
      ar: 'بحث',
    }),
    
    // Search input
    searchPlaceholder: t({
      en: 'Search users, communities, or posts...',
      ar: 'ابحث عن المستخدمين أو المجتمعات أو المنشورات...',
    }),
    searchResultsFor: t({
      en: 'Search Results for:',
      ar: 'نتائج البحث عن:',
    }),
    
    // Tabs
    usersTab: t({
      en: 'Users',
      ar: 'المستخدمون',
    }),
    communitiesTab: t({
      en: 'Communities',
      ar: 'المجتمعات',
    }),
    postsTab: t({
      en: 'Posts',
      ar: 'المنشورات',
    }),
    
    // Empty states
    emptyStateTitle: t({
      en: 'Search ITI Hub',
      ar: 'ابحث في ITI Hub',
    }),
    emptyStateDescription: t({
      en: 'Find users, communities, and posts. Enter at least 2 characters to search.',
      ar: 'ابحث عن المستخدمين والمجتمعات والمنشورات. أدخل حرفين على الأقل للبحث.',
    }),
    
    // No results
    noUsersFound: t({
      en: 'No users found for',
      ar: 'لم يتم العثور على مستخدمين لـ',
    }),
    noCommunitiesFound: t({
      en: 'No communities found for',
      ar: 'لم يتم العثور على مجتمعات لـ',
    }),
    noPostsFound: t({
      en: 'No posts found for',
      ar: 'لم يتم العثور على منشورات لـ',
    }),
    
    // Query validation
    queryTooShort: t({
      en: 'Please enter at least 2 characters to search',
      ar: 'يرجى إدخال حرفين على الأقل للبحث',
    }),
    
    // Loading states
    loadingResults: t({
      en: 'Loading search results...',
      ar: 'جاري تحميل نتائج البحث...',
    }),
    loadingMore: t({
      en: 'Loading more...',
      ar: 'جاري تحميل المزيد...',
    }),
    
    // Error states
    errorLoadingResults: t({
      en: 'Failed to load search results. Please try again.',
      ar: 'فشل تحميل نتائج البحث. يرجى المحاولة مرة أخرى.',
    }),
    retry: t({
      en: 'Retry',
      ar: 'إعادة المحاولة',
    }),
  },
};
