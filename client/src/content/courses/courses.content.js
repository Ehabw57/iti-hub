import { t } from "intlayer";

export default {
  key: "courses",
  content: {
    // Page titles
    allCourses: t({ en: "All Courses", ar: "جميع المسارات" }),
    pageSubtitle: t({ en: "Level up with structured learning tracks.", ar: "طوّر مهاراتك عبر مسارات تعلّم منظمة." }),
    continueLearning: t({ en: "Continue", ar: "متابعة" }),
    trackDetail: t({ en: "Track Details", ar: "تفاصيل المسار" }),
    branches: t({ en: "Branches", ar: "الفروع" }),
    enrollments: t({ en: "My Enrollments", ar: "تسجيلاتي" }),

    // Loading states
    loadingCourses: t({ en: "Loading courses...", ar: "جاري تحميل المسارات..." }),
    loadingMore: t({ en: "Loading more...", ar: "جاري تحميل المزيد..." }),

    // Empty states
    noCoursesTitle: t({ en: "No courses found", ar: "لم يتم العثور على مسارات" }),
    noCoursesMessage: t({ en: "Check back later for new training tracks.", ar: "تحقق لاحقاً من المسارات التدريبية الجديدة." }),
    noEnrollmentsTitle: t({ en: "No enrollments yet", ar: "لا توجد تسجيلات بعد" }),
    noEnrollmentsMessage: t({ en: "Enroll in a track to get started!", ar: "سجّل في مسار لتبدأ!" }),

    // Errors
    errorLoadingCourses: t({ en: "Failed to load courses", ar: "فشل تحميل المسارات" }),
    errorRetry: t({ en: "Retry", ar: "إعادة المحاولة" }),

    // Actions
    enroll: t({ en: "Enroll", ar: "تسجيل" }),
    enrolled: t({ en: "Enrolled", ar: "مسجّل" }),
    unenroll: t({ en: "Unenroll", ar: "إلغاء التسجيل" }),
    enrollSuccess: t({ en: "Enrolled successfully!", ar: "تم التسجيل بنجاح!" }),
    enrollError: t({ en: "Failed to enroll", ar: "فشل التسجيل" }),

    // Enrollment request flow (request → manager approval)
    requestEnrollment: t({ en: "Request to enroll", ar: "طلب الانضمام" }),
    requestPending: t({ en: "Request pending review", ar: "طلبك قيد المراجعة" }),
    requestPendingHint: t({
      en: "A track manager will review your request and notify you.",
      ar: "سيراجع مسؤول المسار طلبك ويخطرك بالنتيجة.",
    }),
    requestSubmitted: t({ en: "Request submitted! You'll be notified once reviewed.", ar: "تم إرسال الطلب! سيتم إخطارك عند مراجعته." }),
    requestCancelled: t({ en: "Request cancelled", ar: "تم إلغاء الطلب" }),
    requestError: t({ en: "Failed to submit request", ar: "فشل إرسال الطلب" }),
    cancelRequest: t({ en: "Cancel request", ar: "إلغاء الطلب" }),
    pendingRequests: t({ en: "Pending enrollment requests", ar: "طلبات الانضمام المعلّقة" }),
    noPendingRequests: t({ en: "No pending requests", ar: "لا توجد طلبات معلّقة" }),
    approveRequest: t({ en: "Approve", ar: "قبول" }),
    rejectRequest: t({ en: "Reject", ar: "رفض" }),
    requestApproved: t({ en: "Request approved", ar: "تم قبول الطلب" }),
    requestRejected: t({ en: "Request rejected", ar: "تم رفض الطلب" }),
    requestedAt: t({ en: "Requested", ar: "طُلب" }),
    decideError: t({ en: "Failed to update request", ar: "فشل تحديث الطلب" }),

    // Track workspace
    workspace: t({ en: "Workspace", ar: "مساحة العمل" }),
    openWorkspace: t({ en: "Open workspace", ar: "فتح مساحة العمل" }),
    workspaceMembersOnly: t({ en: "This workspace is available to approved track members only.", ar: "مساحة العمل متاحة لأعضاء المسار المقبولين فقط." }),
    tabChat: t({ en: "Chat", ar: "المحادثة" }),
    tabRecords: t({ en: "Records", ar: "التسجيلات" }),
    tabFiles: t({ en: "Files", ar: "الملفات" }),
    tabVideos: t({ en: "Videos", ar: "الفيديوهات" }),
    chatPlaceholder: t({ en: "Message the track...", ar: "اكتب رسالة للمسار..." }),
    chatEmpty: t({ en: "No messages yet — start the conversation.", ar: "لا رسائل بعد — ابدأ المحادثة." }),
    chatSend: t({ en: "Send", ar: "إرسال" }),
    save: t({ en: "Save", ar: "حفظ" }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
    recordsEmpty: t({ en: "No session records yet.", ar: "لا توجد تسجيلات بعد." }),
    recordsHint: t({ en: "Session recordings and Teams meeting links.", ar: "تسجيلات الجلسات وروابط اجتماعات Teams." }),
    openRecord: t({ en: "Open link", ar: "فتح الرابط" }),
    addRecord: t({ en: "Add record", ar: "إضافة تسجيل" }),
    recordTitle: t({ en: "Record title", ar: "عنوان التسجيل" }),
    recordUrl: t({ en: "Teams / meeting link", ar: "رابط Teams / الاجتماع" }),
    filesEmpty: t({ en: "No files yet.", ar: "لا توجد ملفات بعد." }),
    filesRoot: t({ en: "All files", ar: "كل الملفات" }),
    folderCount: t({ en: "files", ar: "ملف" }),
    download: t({ en: "Download", ar: "تنزيل" }),
    downloadError: t({ en: "Failed to download file", ar: "فشل تنزيل الملف" }),
    memberAvatarStack: t({ en: "members", ar: "عضواً" }),

    // Files tab — manager actions (work order §2)
    uploadFile: t({ en: "Upload file", ar: "رفع ملف" }),
    uploading: t({ en: "Uploading...", ar: "جاري الرفع..." }),
    createFolder: t({ en: "Create folder", ar: "إنشاء مجلد" }),
    folderName: t({ en: "Folder name", ar: "اسم المجلد" }),
    folderCreated: t({ en: "Folder created", ar: "تم إنشاء المجلد" }),
    folderCreateError: t({ en: "Failed to create folder", ar: "فشل إنشاء المجلد" }),
    rootLevel: t({ en: "Track root (no folder)", ar: "جذر المسار (بدون مجلد)" }),
    markShared: t({ en: "Add to the shared resource library", ar: "إضافة إلى مكتبة الموارد المشتركة" }),
    fileUploaded: t({ en: "File uploaded", ar: "تم رفع الملف" }),
    fileUploadError: t({ en: "Failed to upload file", ar: "فشل رفع الملف" }),
    deleteFile: t({ en: "Delete file", ar: "حذف الملف" }),
    deleteFolder: t({ en: "Delete folder", ar: "حذف المجلد" }),
    deleted: t({ en: "Deleted", ar: "تم الحذف" }),
    deleteError: t({ en: "Failed to delete", ar: "فشل الحذف" }),
    confirmDeleteTitle: t({ en: "Delete?", ar: "حذف؟" }),
    confirmDeleteFile: t({ en: "This file will be permanently removed.", ar: "سيُحذف هذا الملف نهائيًا." }),
    confirmDeleteFolder: t({
      en: "Files inside will be kept and moved to the track root.",
      ar: "سيُحتفظ بالملفات داخله ونقلها إلى جذر المسار.",
    }),

    // SharePoint-style workspace tables + folder records UI (reissued work order §1)
    columnName: t({ en: "Name", ar: "الاسم" }),
    columnModified: t({ en: "Modified", ar: "آخر تعديل" }),
    columnModifiedBy: t({ en: "Modified By", ar: "عدّله" }),
    delete: t({ en: "Delete", ar: "حذف" }),
    folderLabel: t({ en: "Folder", ar: "المجلد" }),
    folderEmpty: t({ en: "This folder is empty", ar: "هذا المجلد فارغ" }),
    recordCountLabel: t({ en: "records", ar: "تسجيل" }),
    renameFolder: t({ en: "Rename folder", ar: "إعادة تسمية المجلد" }),
    folderRenamed: t({ en: "Folder renamed", ar: "تمت إعادة تسمية المجلد" }),
    folderRenameError: t({ en: "Failed to rename folder", ar: "فشلت إعادة تسمية المجلد" }),
    recordAdded: t({ en: "Record added", ar: "تمت إضافة التسجيل" }),
    recordUpdated: t({ en: "Record updated", ar: "تم تحديث التسجيل" }),
    recordSaveError: t({ en: "Failed to save record", ar: "فشل حفظ التسجيل" }),
    editRecord: t({ en: "Edit record", ar: "تعديل التسجيل" }),
    deleteRecord: t({ en: "Delete record", ar: "حذف التسجيل" }),
    confirmDeleteRecord: t({ en: "This record will be permanently removed.", ar: "سيُحذف هذا التسجيل نهائيًا." }),
    confirmDeleteFolderRecords: t({
      en: "Records inside will be kept and moved to the track root.",
      ar: "سيُحتفظ بالتسجيلات داخله ونقلها إلى جذر المسار.",
    }),
    sessionDate: t({ en: "Session date", ar: "تاريخ الجلسة" }),
    recordDescription: t({ en: "Description (optional)", ar: "الوصف (اختياري)" }),

    // Videos tab (work order §3)
    videosEmpty: t({ en: "No videos yet.", ar: "لا توجد فيديوهات بعد." }),
    addVideo: t({ en: "Add video", ar: "إضافة فيديو" }),
    videoTitle: t({ en: "Video title", ar: "عنوان الفيديو" }),
    videoUrl: t({ en: "Video URL (YouTube, Drive, ...)", ar: "رابط الفيديو (YouTube، Drive، ...)" }),
    thumbnailUrl: t({ en: "Thumbnail URL (optional)", ar: "رابط الصورة المصغرة (اختياري)" }),
    videoAdded: t({ en: "Video added", ar: "تمت إضافة الفيديو" }),
    videoAddError: t({ en: "Failed to add video", ar: "فشلت إضافة الفيديو" }),
    videoDeleted: t({ en: "Video deleted", ar: "تم حذف الفيديو" }),
    videoDeleteError: t({ en: "Failed to delete video", ar: "فشل حذف الفيديو" }),
    openVideo: t({ en: "Open video", ar: "فتح الفيديو" }),
    deleteVideo: t({ en: "Delete video", ar: "حذف الفيديو" }),
    confirmDeleteVideo: t({ en: "This video will be permanently removed.", ar: "سيُحذف هذا الفيديو نهائيًا." }),

    // Track members panel (work order §5c client side)
    manageMembers: t({ en: "Members", ar: "الأعضاء" }),
    manageMembersHint: t({ en: "Add or remove students and instructors on this track.", ar: "أضف أو أزل الطلاب والمدربين في هذا المسار." }),
    instructorsLabel: t({ en: "Instructors", ar: "المدربون" }),
    studentsLabel: t({ en: "Students", ar: "الطلاب" }),
    searching: t({ en: "Searching...", ar: "جاري البحث..." }),
    loadingMembers: t({ en: "Loading members...", ar: "جاري تحميل الأعضاء..." }),
    noMembersYet: t({ en: "None yet", ar: "لا يوجد بعد" }),
    searchUsers: t({ en: "Search users by name or username...", ar: "ابحث بالاسم أو اسم المستخدم..." }),
    searchUsersRole: t({ en: "Find", ar: "بحث عن" }),
    noSearchResults: t({ en: "No results", ar: "لا توجد نتائج" }),
    startTyping: t({ en: "Start typing to search", ar: "ابدأ الكتابة للبحث" }),
    addAsStudent: t({ en: "Add as student", ar: "إضافة كطالب" }),
    addAsInstructor: t({ en: "Add as instructor", ar: "إضافة كمدرب" }),
    remove: t({ en: "Remove", ar: "إزالة" }),
    membersUpdated: t({ en: "Members updated", ar: "تم تحديث الأعضاء" }),
    membersUpdateError: t({ en: "Failed to update members", ar: "فشل تحديث الأعضاء" }),
    searchError: t({ en: "Search failed", ar: "فشل البحث" }),

    // Labels
    track: t({ en: "Track", ar: "المسار" }),
    branch: t({ en: "Branch", ar: "الفرع" }),
    enrolledCount: t({ en: "enrolled", ar: "مسجّل" }),
    selectBranch: t({ en: "Select a branch", ar: "اختر فرع" }),
    searchCourses: t({ en: "Search courses...", ar: "ابحث عن مسارات..." }),

    // Track categories — localized labels for the wayfinding chips.
    // Colors are mapped to design tokens in src/utils/trackCategories.js.
    categorySoftwareDevelopment: t({ en: "Software Development", ar: "تطوير البرمجيات" }),
    categoryWebDevelopment: t({ en: "Web Development", ar: "تطوير الويب" }),
    categoryInformationSystems: t({ en: "Information Systems", ar: "نظم المعلومات" }),
    categoryInfrastructureNetworks: t({ en: "Infrastructure & Networks", ar: "البنية التحتية والشبكات" }),
    categoryDigitalArts: t({ en: "Digital Arts", ar: "الفنون الرقمية" }),
    categoryOthers: t({ en: "Others", ar: "أخرى" }),

    // Skeleton
    skeletonCourse: t({ en: "Course", ar: "مسار" }),
  },
};
