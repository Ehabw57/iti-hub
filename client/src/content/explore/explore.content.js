import { t } from "intlayer";

export default {
  key: "exploreCommunities",
  content: {
    // Page title
    pageTitle: t({ en: "Explore Communities", ar: "استكشف المجتمعات" }),
    
    // Loading states
    loadingCommunities: t({ en: "Loading communities...", ar: "جاري تحميل المجتمعات..." }),
    loadingMore: t({ en: "Loading more communities...", ar: "جاري تحميل المزيد..." }),
    
    // Empty states
    noCommunitiesTitle: t({ en: "No communities found", ar: "لم يتم العثور على مجتمعات" }),
    noCommunitiesMessage: t({ 
      en: "Be the first to create a community!", 
      ar: "كن أول من ينشئ مجتمعًا!" 
    }),
    noSearchResultsTitle: t({ en: "No communities match your search", ar: "لا توجد مجتمعات تطابق بحثك" }),
    noSearchResultsMessage: t({ 
      en: "Try adjusting your search terms or filters", 
      ar: "حاول تعديل مصطلحات البحث أو الفلاتر" 
    }),
    
    // Errors
    errorLoadingCommunities: t({ 
      en: "Failed to load communities", 
      ar: "فشل تحميل المجتمعات" 
    }),
    errorRetry: t({ en: "Retry", ar: "إعادة المحاولة" }),
    
    // Actions
    createCommunity: t({ en: "Create Community", ar: "إنشاء مجتمع" }),
    refreshCommunities: t({ en: "Refresh", ar: "تحديث" }),
    
    // Search and filters
    searchPlaceholder: t({ en: "Search communities...", ar: "ابحث عن المجتمعات..." }),
    filterByTag: t({ en: "Filter by tag", ar: "تصفية حسب الوسم" }),
    allTags: t({ en: "All tags", ar: "جميع الوسوم" }),
  }
};
