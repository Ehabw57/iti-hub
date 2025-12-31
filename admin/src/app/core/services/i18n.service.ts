/**
 * i18n Service
 * Handles language switching and RTL support
 */
import { Injectable, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'en' | 'ar';

export interface Translation {
  [key: string]: string | Translation;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly LANG_KEY = 'admin_language';
  private isBrowser: boolean;
  
  // Current language signal
  private currentLangSignal = signal<Language>('en');
  
  // Computed values
  currentLang = computed(() => this.currentLangSignal());
  isRtl = computed(() => this.currentLangSignal() === 'ar');
  dir = computed(() => this.isRtl() ? 'rtl' : 'ltr');

  // Translations
  private translations: Record<Language, Translation> = {
    en: {
      // Common
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        noResults: 'No results found',
        actions: 'Actions',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        all: 'All',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        showing: 'Showing',
        of: 'of',
        items: 'items',
        page: 'Page',
        perPage: 'Per page',
        from: 'From',
        to: 'To'
      },
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        users: 'Users',
        posts: 'Posts',
        comments: 'Comments',
        communities: 'Communities',
        settings: 'Settings',
        logout: 'Logout'
      },
      // Auth
      auth: {
        login: 'Login',
        email: 'Email',
        password: 'Password',
        loginTitle: 'Admin Login',
        loginSubtitle: 'Sign in to access the admin dashboard',
        invalidCredentials: 'Invalid email or password',
        accessDenied: 'Access denied. Admin role required.'
      },
      // Dashboard
      dashboard: {
        title: 'Dashboard',
        overview: 'Overview',
        totalUsers: 'Total Users',
        totalPosts: 'Total Posts',
        totalComments: 'Total Comments',
        totalCommunities: 'Total Communities',
        activeUsersToday: 'Active Today',
        activeUsers: 'Active Users',
        blockedUsers: 'Blocked Users',
        newUsersThisWeek: 'New This Week',
        postsThisWeek: 'Posts This Week',
        commentsThisWeek: 'Comments This Week',
        registrations: 'User Registrations',
        growth: 'Platform Growth',
        topTags: 'Top Tags',
        activeCommunities: 'Top Communities',
        mostActiveUsers: 'Most Active Users',
        onlineUsers: 'Online Users',
        onlineNow: 'Online Now',
        noOnlineUsers: 'No users currently online',
        timeRange: 'Time Range',
        interval: 'Interval',
        last7Days: 'Last 7 Days',
        last30Days: 'Last 30 Days',
        last90Days: 'Last 90 Days',
        lastYear: 'Last Year',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        users: 'Users',
        posts: 'Posts',
        communities: 'Communities',
        comments: 'Comments'
      },
      // Users
      users: {
        title: 'User Management',
        username: 'Username',
        email: 'Email',
        fullName: 'Full Name',
        role: 'Role',
        status: 'Status',
        createdAt: 'Joined',
        lastSeen: 'Last Seen',
        posts: 'Posts',
        followers: 'Followers',
        following: 'Following',
        blocked: 'Blocked',
        active: 'Active',
        block: 'Block User',
        unblock: 'Unblock User',
        deleteUser: 'Delete User',
        changeRole: 'Change Role',
        confirmBlock: 'Are you sure you want to block this user?',
        confirmUnblock: 'Are you sure you want to unblock this user?',
        confirmDelete: 'Are you sure you want to delete this user? This action cannot be undone.',
        userBlocked: 'User has been blocked',
        userUnblocked: 'User has been unblocked',
        userDeleted: 'User has been deleted',
        roleUpdated: 'User role has been updated',
        filterByRole: 'Filter by Role',
        filterByStatus: 'Filter by Status',
        viewProfile: 'View Profile in Client App'
      },
      // Posts
      posts: {
        title: 'Post Management',
        content: 'Content',
        author: 'Author',
        community: 'Community',
        likes: 'Likes',
        comments: 'Comments',
        reposts: 'Reposts',
        createdAt: 'Created',
        deletePost: 'Delete Post',
        confirmDelete: 'Are you sure you want to delete this post? This action cannot be undone.',
        postDeleted: 'Post has been deleted',
        filterByAuthor: 'Filter by Author',
        filterByCommunity: 'Filter by Community',
        viewPost: 'View Post in Client App'
      },
      // Comments
      comments: {
        title: 'Comment Management',
        content: 'Content',
        author: 'Author',
        post: 'Post',
        likes: 'Likes',
        createdAt: 'Created',
        deleteComment: 'Delete Comment',
        confirmDelete: 'Are you sure you want to delete this comment? This action cannot be undone.',
        commentDeleted: 'Comment has been deleted',
        filterByAuthor: 'Filter by Author',
        filterByPost: 'Filter by Post',
        viewComment: 'View Comment in Client App'
      },
      // Communities
      communities: {
        title: 'Community Management',
        name: 'Name',
        description: 'Description',
        owner: 'Owner',
        members: 'Members',
        posts: 'Posts',
        createdAt: 'Created',
        deleteCommunity: 'Delete Community',
        confirmDelete: 'Are you sure you want to delete this community? All posts and members will be removed. This action cannot be undone.',
        communityDeleted: 'Community has been deleted',
        filterByOwner: 'Filter by Owner',
        viewCommunity: 'View Community in Client App'
      }
    },
    ar: {
      // Common
      common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        view: 'عرض',
        search: 'بحث',
        filter: 'تصفية',
        loading: 'جاري التحميل...',
        noResults: 'لا توجد نتائج',
        actions: 'الإجراءات',
        confirm: 'تأكيد',
        yes: 'نعم',
        no: 'لا',
        all: 'الكل',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',
        showing: 'عرض',
        of: 'من',
        items: 'عناصر',
        page: 'صفحة',
        perPage: 'لكل صفحة',
        from: 'من',
        to: 'إلى'
      },
      // Navigation
      nav: {
        dashboard: 'لوحة التحكم',
        users: 'المستخدمون',
        posts: 'المنشورات',
        comments: 'التعليقات',
        communities: 'المجتمعات',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج'
      },
      // Auth
      auth: {
        login: 'تسجيل الدخول',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        loginTitle: 'دخول المدير',
        loginSubtitle: 'سجل الدخول للوصول إلى لوحة التحكم',
        invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        accessDenied: 'تم رفض الوصول. يتطلب صلاحيات المدير.'
      },
      // Dashboard
      dashboard: {
        title: 'لوحة التحكم',
        overview: 'نظرة عامة',
        totalUsers: 'إجمالي المستخدمين',
        totalPosts: 'إجمالي المنشورات',
        totalComments: 'إجمالي التعليقات',
        totalCommunities: 'إجمالي المجتمعات',
        activeUsersToday: 'نشط اليوم',
        activeUsers: 'المستخدمون النشطون',
        blockedUsers: 'المستخدمون المحظورون',
        newUsersThisWeek: 'جديد هذا الأسبوع',
        postsThisWeek: 'منشورات هذا الأسبوع',
        commentsThisWeek: 'تعليقات هذا الأسبوع',
        registrations: 'تسجيلات المستخدمين',
        growth: 'نمو المنصة',
        topTags: 'أهم الوسوم',
        activeCommunities: 'أفضل المجتمعات',
        mostActiveUsers: 'المستخدمون الأكثر نشاطاً',
        onlineUsers: 'المستخدمون المتصلون',
        onlineNow: 'متصل الآن',
        noOnlineUsers: 'لا يوجد مستخدمون متصلون حالياً',
        timeRange: 'النطاق الزمني',
        interval: 'الفترة',
        last7Days: 'آخر 7 أيام',
        last30Days: 'آخر 30 يوم',
        last90Days: 'آخر 90 يوم',
        lastYear: 'السنة الماضية',
        daily: 'يومي',
        weekly: 'أسبوعي',
        monthly: 'شهري',
        users: 'المستخدمون',
        posts: 'المنشورات',
        communities: 'المجتمعات',
        comments: 'التعليقات'
      },
      // Users
      users: {
        title: 'إدارة المستخدمين',
        username: 'اسم المستخدم',
        email: 'البريد الإلكتروني',
        fullName: 'الاسم الكامل',
        role: 'الدور',
        status: 'الحالة',
        createdAt: 'تاريخ الانضمام',
        lastSeen: 'آخر ظهور',
        posts: 'المنشورات',
        followers: 'المتابعون',
        following: 'يتابع',
        blocked: 'محظور',
        active: 'نشط',
        block: 'حظر المستخدم',
        unblock: 'إلغاء الحظر',
        deleteUser: 'حذف المستخدم',
        changeRole: 'تغيير الدور',
        confirmBlock: 'هل أنت متأكد من حظر هذا المستخدم؟',
        confirmUnblock: 'هل أنت متأكد من إلغاء حظر هذا المستخدم؟',
        confirmDelete: 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
        userBlocked: 'تم حظر المستخدم',
        userUnblocked: 'تم إلغاء حظر المستخدم',
        userDeleted: 'تم حذف المستخدم',
        roleUpdated: 'تم تحديث دور المستخدم',
        filterByRole: 'تصفية حسب الدور',
        filterByStatus: 'تصفية حسب الحالة',
        viewProfile: 'عرض الملف الشخصي في تطبيق العميل'
      },
      // Posts
      posts: {
        title: 'إدارة المنشورات',
        content: 'المحتوى',
        author: 'الكاتب',
        community: 'المجتمع',
        likes: 'الإعجابات',
        comments: 'التعليقات',
        reposts: 'إعادة النشر',
        createdAt: 'تاريخ الإنشاء',
        deletePost: 'حذف المنشور',
        confirmDelete: 'هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.',
        postDeleted: 'تم حذف المنشور',
        filterByAuthor: 'تصفية حسب الكاتب',
        filterByCommunity: 'تصفية حسب المجتمع',
        viewPost: 'عرض المنشور في تطبيق العميل'
      },
      // Comments
      comments: {
        title: 'إدارة التعليقات',
        content: 'المحتوى',
        author: 'الكاتب',
        post: 'المنشور',
        likes: 'الإعجابات',
        createdAt: 'تاريخ الإنشاء',
        deleteComment: 'حذف التعليق',
        confirmDelete: 'هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.',
        commentDeleted: 'تم حذف التعليق',
        filterByAuthor: 'تصفية حسب الكاتب',
        filterByPost: 'تصفية حسب المنشور',
        viewComment: 'عرض التعليق في تطبيق العميل'
      },
      // Communities
      communities: {
        title: 'إدارة المجتمعات',
        name: 'الاسم',
        description: 'الوصف',
        owner: 'المالك',
        members: 'الأعضاء',
        posts: 'المنشورات',
        createdAt: 'تاريخ الإنشاء',
        deleteCommunity: 'حذف المجتمع',
        confirmDelete: 'هل أنت متأكد من حذف هذا المجتمع؟ سيتم إزالة جميع المنشورات والأعضاء. لا يمكن التراجع عن هذا الإجراء.',
        communityDeleted: 'تم حذف المجتمع',
        filterByOwner: 'تصفية حسب المالك',
        viewCommunity: 'عرض المجتمع في تطبيق العميل'
      }
    }
  };

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initLanguage();
  }

  /**
   * Initialize language from storage or browser
   */
  private initLanguage(): void {
    if (!this.isBrowser) return;
    
    const storedLang = localStorage.getItem(this.LANG_KEY) as Language;
    if (storedLang && (storedLang === 'en' || storedLang === 'ar')) {
      this.setLanguage(storedLang);
    } else {
      // Try to detect from browser
      const browserLang = navigator.language.split('-')[0];
      this.setLanguage(browserLang === 'ar' ? 'ar' : 'en');
    }
  }

  /**
   * Set current language
   */
  setLanguage(lang: Language): void {
    this.currentLangSignal.set(lang);
    
    if (this.isBrowser) {
      localStorage.setItem(this.LANG_KEY, lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }

  /**
   * Toggle between languages
   */
  toggleLanguage(): void {
    const newLang = this.currentLangSignal() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  /**
   * Get translation by key path
   * @param path Dot-notation path like 'nav.dashboard' or 'common.save'
   */
  t(path: string): string {
    const keys = path.split('.');
    let result: Translation | string = this.translations[this.currentLangSignal()];
    
    for (const key of keys) {
      if (typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        // Fallback to English
        result = this.translations.en;
        for (const k of keys) {
          if (typeof result === 'object' && k in result) {
            result = result[k];
          } else {
            return path; // Return key if not found
          }
        }
        break;
      }
    }
    
    return typeof result === 'string' ? result : path;
  }
}
