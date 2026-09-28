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
        branches: 'Branches & Tracks',
        users: 'Users',
        enrollmentRequests: 'Enrollment Requests',
        jobs: 'Jobs',
        events: 'Events',
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
        role_student: 'Student',
        role_instructor: 'Instructor',
        role_branch_admin: 'Branch Admin',
        role_super_admin: 'Super Admin',
        role_user_legacy: 'Student (legacy)',
        role_admin_legacy: 'Super Admin (legacy)',
        selectBranch: 'Select branch…',
        branchRequired: 'A branch must be selected for the Branch Admin role',
        rolePermissionDenied: 'Only Super Admins can assign Branch Admin or Super Admin roles',
        roleUpdateFailed: 'Failed to update role',
        instructorHint: 'After setting this role, add them to a specific track from that track\u2019s page.',
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
      // Enrollment Requests (tracks system)
      enrollmentRequests: {
        title: 'Enrollment Requests',
        subtitle: 'Review and decide student requests to join tracks',
        requester: 'Requester',
        track: 'Track',
        branch: 'Branch',
        status: 'Status',
        requestedAt: 'Requested',
        decidedAt: 'Decided',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        approve: 'Approve',
        reject: 'Reject',
        confirmApprove: 'Are you sure you want to approve this enrollment request?',
        confirmReject: 'Are you sure you want to reject this enrollment request?',
        requestApproved: 'Enrollment request approved',
        requestRejected: 'Enrollment request rejected',
        noRequests: 'No enrollment requests found',
        refresh: 'Refresh'
      },
      // Jobs management (work order §4)
      jobs: {
        title: 'Jobs',
        subtitle: 'Create and manage job board postings',
        jobTitle: 'Job title',
        company: 'Company',
        location: 'Location',
        description: 'Description',
        tags: 'Tags (comma-separated, e.g. Full Stack .NET, AI & ML)',
        applyUrl: 'Apply URL',
        postedBy: 'Posted by',
        postedAt: 'Posted',
        createJob: 'Post job',
        noJobs: 'No job postings yet',
        confirmDelete: 'Are you sure you want to delete this job posting?',
        jobCreated: 'Job posted successfully',
        jobDeleted: 'Job deleted',
        jobError: 'Failed to save job posting',
        hintCreate: 'Postings appear instantly on the student Jobs page.'
      },
      // Events management (work order §1)
      events: {
        title: 'Events',
        subtitle: 'Create and manage events',
        eventTitle: 'Event title',
        description: 'Description',
        date: 'Date',
        endDate: 'End date (optional)',
        location: 'Location',
        branches: 'Participating branches',
        registerUrl: 'External registration URL (optional)',
        organizer: 'Organized by',
        attendees: 'Attendees',
        createEvent: 'Create event',
        noEvents: 'No events yet',
        confirmDelete: 'Are you sure you want to delete this event?',
        eventCreated: 'Event created successfully',
        eventDeleted: 'Event deleted',
        eventError: 'Failed to save event'
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
      },
      // Structure (Branches → Rounds → Tracks)
      structure: {
        title: 'Branches & Tracks',
        subtitle: 'Manage ITI branches, rounds, tracks and their members',
        branches: 'Branches',
        branchName: 'Branch name',
        branchType: 'Type',
        core: 'Core',
        extension: 'Extension',
        location: 'Location',
        rounds: 'Rounds',
        round: 'Round',
        roundName: 'Round name',
        tracks: 'Tracks',
        track: 'Track',
        trackName: 'Track name',
        category: 'Category',
        categorySoftwareDevelopment: 'Software Development',
        categoryWebDevelopment: 'Web Development',
        categoryInformationSystems: 'Information Systems',
        categoryInfrastructureNetworks: 'Infrastructure & Networks',
        categoryDigitalArts: 'Digital Arts',
        categoryOthers: 'Others',
        description: 'Description',
        status: 'Status',
        active: 'Active',
        inactive: 'Closed',
        members: 'Members',
        instructors: 'Instructors',
        students: 'Students',
        addBranch: 'Add Branch',
        editBranch: 'Edit Branch',
        addRound: 'Add Round',
        editRound: 'Edit Round',
        addTrack: 'Add Track',
        editTrack: 'Edit Track',
        manageTracks: 'Manage Tracks',
        closeRound: 'Close Round',
        reopenRound: 'Reopen Round',
        assignMember: 'Assign',
        removeMember: 'Remove',
        searchUsers: 'Search users...',
        noMembers: 'No members assigned yet',
        noSearchResults: 'No matching users found. Try a different name or username.',
        confirmDeleteBranch: 'Are you sure you want to delete this branch? All of its rounds and tracks will be permanently deleted. This cannot be undone.',
        confirmDeleteRound: 'Are you sure you want to delete this round? All of its tracks will be permanently deleted. This cannot be undone.',
        confirmDeleteTrack: 'Are you sure you want to delete this track? Its content will be removed and members will be unassigned. This cannot be undone.',
        branchCreated: 'Branch created',
        branchUpdated: 'Branch updated',
        branchDeleted: 'Branch deleted',
        roundCreated: 'Round created',
        roundUpdated: 'Round updated',
        roundDeleted: 'Round deleted',
        trackCreated: 'Track created',
        trackUpdated: 'Track updated',
        trackDeleted: 'Track deleted',
        membersUpdated: 'Track members updated',
        backToBranches: 'Back to branches',
        backToRounds: 'Back to rounds',
        viewPublicBranches: 'View public branches page in client app'
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
        branches: 'الفروع والمسارات',
        users: 'المستخدمون',
        enrollmentRequests: 'طلبات الالتحاق',
        jobs: 'الوظائف',
        events: 'الأحداث',
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
        role_student: 'طالب',
        role_instructor: 'مدرّس',
        role_branch_admin: 'مسؤول فرع',
        role_super_admin: 'مسؤول عام',
        role_user_legacy: 'طالب (قديم)',
        role_admin_legacy: 'مسؤول عام (قديم)',
        selectBranch: 'اختر الفرع…',
        branchRequired: 'يجب اختيار فرع لدور مسؤول الفرع',
        rolePermissionDenied: 'فقط المسؤول العام يمكنه منح دور مسؤول الفرع أو المسؤول العام',
        roleUpdateFailed: 'فشل تحديث الدور',
        instructorHint: 'بعد منح هذا الدور، أضفهم إلى مسار محدد من صفحة ذلك المسار.',
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
      // Enrollment Requests (tracks system)
      enrollmentRequests: {
        title: 'طلبات الالتحاق',
        subtitle: 'مراجعة والبت في طلبات الطلاب للانضمام إلى المسارات',
        requester: 'مقدم الطلب',
        track: 'المسار',
        branch: 'الفرع',
        status: 'الحالة',
        requestedAt: 'تاريخ الطلب',
        decidedAt: 'تاريخ القرار',
        pending: 'قيد الانتظار',
        approved: 'تمت الموافقة',
        rejected: 'مرفوض',
        approve: 'موافقة',
        reject: 'رفض',
        confirmApprove: 'هل أنت متأكد من الموافقة على طلب الالتحاق هذا؟',
        confirmReject: 'هل أنت متأكد من رفض طلب الالتحاق هذا؟',
        requestApproved: 'تمت الموافقة على طلب الالتحاق',
        requestRejected: 'تم رفض طلب الالتحاق',
        noRequests: 'لا توجد طلبات التحاق',
        refresh: 'تحديث'
      },
      // Jobs management (work order §4)
      jobs: {
        title: 'الوظائف',
        subtitle: 'إنشاء وإدارة إعلانات الوظائف',
        jobTitle: 'المسمى الوظيفي',
        company: 'الشركة',
        location: 'المكان',
        description: 'الوصف',
        tags: 'الوسوم (مفصولة بفواصل، مثل: Full Stack .NET، AI & ML)',
        applyUrl: 'رابط التقديم',
        postedBy: 'نشرها',
        postedAt: 'تاريخ النشر',
        createJob: 'نشر وظيفة',
        noJobs: 'لا توجد وظائف منشورة بعد',
        confirmDelete: 'هل أنت متأكد من حذف هذا الإعلان الوظيفي؟',
        jobCreated: 'تم نشر الوظيفة بنجاح',
        jobDeleted: 'تم حذف الوظيفة',
        jobError: 'فشل حفظ الإعلان الوظيفي',
        hintCreate: 'تظهر الإعلانات فورًا في صفحة الوظائف لدى الطلاب.'
      },
      // Events management (work order §1)
      events: {
        title: 'الأحداث',
        subtitle: 'إنشاء وإدارة الأحداث',
        eventTitle: 'عنوان الحدث',
        description: 'الوصف',
        date: 'التاريخ',
        endDate: 'تاريخ الانتهاء (اختياري)',
        location: 'المكان',
        branches: 'الفروع المشاركة',
        registerUrl: 'رابط التسجيل الخارجي (اختياري)',
        organizer: 'ينظمه',
        attendees: 'الحاضرون',
        createEvent: 'إنشاء حدث',
        noEvents: 'لا توجد أحداث بعد',
        confirmDelete: 'هل أنت متأكد من حذف هذا الحدث؟',
        eventCreated: 'تم إنشاء الحدث بنجاح',
        eventDeleted: 'تم حذف الحدث',
        eventError: 'فشل حفظ الحدث'
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
      },
      // Structure (Branches → Rounds → Tracks)
      structure: {
        title: 'الفروع والمسارات',
        subtitle: 'إدارة فروع ITI والجولات والمسارات وأعضائها',
        branches: 'الفروع',
        branchName: 'اسم الفرع',
        branchType: 'النوع',
        core: 'أساسي',
        extension: 'امتداد',
        location: 'الموقع',
        rounds: 'الجولات',
        round: 'الجولة',
        roundName: 'اسم الجولة',
        tracks: 'المسارات',
        track: 'المسار',
        trackName: 'اسم المسار',
        category: 'الفئة',
        categorySoftwareDevelopment: 'تطوير البرمجيات',
        categoryWebDevelopment: 'تطوير الويب',
        categoryInformationSystems: 'نظم المعلومات',
        categoryInfrastructureNetworks: 'البنية التحتية والشبكات',
        categoryDigitalArts: 'الفنون الرقمية',
        categoryOthers: 'أخرى',
        description: 'الوصف',
        status: 'الحالة',
        active: 'نشطة',
        inactive: 'مغلقة',
        members: 'الأعضاء',
        instructors: 'المدربون',
        students: 'الطلاب',
        addBranch: 'إضافة فرع',
        editBranch: 'تعديل الفرع',
        addRound: 'إضافة جولة',
        editRound: 'تعديل الجولة',
        addTrack: 'إضافة مسار',
        editTrack: 'تعديل المسار',
        manageTracks: 'إدارة المسارات',
        closeRound: 'إغلاق الجولة',
        reopenRound: 'إعادة فتح الجولة',
        assignMember: 'إسناد',
        removeMember: 'إزالة',
        searchUsers: 'ابحث عن المستخدمين...',
        noMembers: 'لا يوجد أعضاء بعد',
        noSearchResults: 'لا يوجد مستخدمون مطابقون. جرّب اسمًا آخر أو اسم مستخدم مختلف.',
        confirmDeleteBranch: 'هل أنت متأكد من حذف هذا الفرع؟ سيتم حذف جميع جولاته ومساراته نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
        confirmDeleteRound: 'هل أنت متأكد من حذف هذه الجولة؟ سيتم حذف جميع مساراتها نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
        confirmDeleteTrack: 'هل أنت متأكد من حذف هذا المسار؟ سيتم إزالة محتواه وإلغاء إسناد أعضائه. لا يمكن التراجع عن هذا الإجراء.',
        branchCreated: 'تم إنشاء الفرع',
        branchUpdated: 'تم تحديث الفرع',
        branchDeleted: 'تم حذف الفرع',
        roundCreated: 'تم إنشاء الجولة',
        roundUpdated: 'تم تحديث الجولة',
        roundDeleted: 'تم حذف الجولة',
        trackCreated: 'تم إنشاء المسار',
        trackUpdated: 'تم تحديث المسار',
        trackDeleted: 'تم حذف المسار',
        membersUpdated: 'تم تحديث أعضاء المسار',
        backToBranches: 'العودة إلى الفروع',
        backToRounds: 'العودة إلى الجولات',
        viewPublicBranches: 'عرض صفحة الفروع في تطبيق العميل'
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
