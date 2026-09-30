import { t } from "intlayer";

export default {
  key: "settings",
  content: {
    // Page title
    pageTitle: t({ en: "Settings", ar: "الإعدادات" }),

    // Tab labels
    profileTab: t({ en: "Profile", ar: "الملف الشخصي" }),
    securityTab: t({ en: "Security", ar: "الأمان" }),
    notificationsTab: t({ en: "Notifications", ar: "الإشعارات" }),
    accountTab: t({ en: "Account", ar: "الحساب" }),

    // Profile section
    editProfile: t({ en: "Edit Profile", ar: "تعديل الملف الشخصي" }),
    fullName: t({ en: "Full Name", ar: "الاسم الكامل" }),
    fullNamePlaceholder: t({ en: "Enter your full name", ar: "أدخل اسمك الكامل" }),
    bio: t({ en: "Bio", ar: "نبذة عنك" }),
    bioPlaceholder: t({ en: "Tell us about yourself", ar: "أخبرنا عن نفسك" }),
    specialization: t({ en: "Specialization", ar: "التخصص" }),
    specializationPlaceholder: t({ en: "Your specialization", ar: "تخصصك" }),
    location: t({ en: "Location", ar: "الموقع" }),
    locationPlaceholder: t({ en: "Your location", ar: "موقعك" }),
    save: t({ en: "Save Changes", ar: "حفظ التغييرات" }),
    saving: t({ en: "Saving...", ar: "جاري الحفظ..." }),
    saveSuccess: t({ en: "Profile updated successfully!", ar: "تم تحديث الملف الشخصي بنجاح!" }),

    // Security section
    changePassword: t({ en: "Change Password", ar: "تغيير كلمة المرور" }),
    currentPassword: t({ en: "Current Password", ar: "كلمة المرور الحالية" }),
    currentPasswordPlaceholder: t({ en: "Enter current password", ar: "أدخل كلمة المرور الحالية" }),
    newPassword: t({ en: "New Password", ar: "كلمة المرور الجديدة" }),
    newPasswordPlaceholder: t({ en: "Enter new password (min 8 characters)", ar: "أدخل كلمة المرور الجديدة (8 أحرف على الأقل)" }),
    confirmPassword: t({ en: "Confirm New Password", ar: "تأكيد كلمة المرور" }),
    confirmPasswordPlaceholder: t({ en: "Confirm new password", ar: "أكد كلمة المرور الجديدة" }),
    updatePassword: t({ en: "Update Password", ar: "تحديث كلمة المرور" }),
    updatingPassword: t({ en: "Updating...", ar: "جاري التحديث..." }),
    passwordSuccess: t({ en: "Password changed successfully!", ar: "تم تغيير كلمة المرور بنجاح!" }),
    passwordsMismatch: t({ en: "New passwords do not match", ar: "كلمات المرور الجديدة غير متطابقة" }),
    passwordMinLength: t({ en: "Password must be at least 8 characters", ar: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }),

    // Notifications section
    notificationPreferences: t({ en: "Notification Preferences", ar: "تفضيلات الإشعارات" }),
    emailNotifications: t({ en: "Email Notifications", ar: "إشعارات البريد الإلكتروني" }),
    emailNotificationsDesc: t({ en: "Receive notifications via email", ar: "استلم إشعارات عبر البريد الإلكتروني" }),
    pushNotifications: t({ en: "Push Notifications", ar: "الإشعارات الفورية" }),
    pushNotificationsDesc: t({ en: "Receive push notifications in your browser", ar: "استلم إشعارات فورية في المتصفح" }),
    mentionNotifications: t({ en: "Mentions", ar: "الإشارات" }),
    mentionNotificationsDesc: t({ en: "Get notified when someone mentions you", ar: "أعلمني عند إشارتي" }),
    messageNotifications: t({ en: "Messages", ar: "الرسائل" }),
    messageNotificationsDesc: t({ en: "Get notified for new messages", ar: "أعلمني ب الرسائل الجديدة" }),
    communityNotifications: t({ en: "Community Updates", ar: "تحديثات المجتمع" }),
    communityNotificationsDesc: t({ en: "Get notified about community activity", ar: "أعلمني بنشاط المجتمع" }),
    savePreferences: t({ en: "Save Preferences", ar: "حفظ التفضيلات" }),
    preferencesSuccess: t({ en: "Notification preferences updated!", ar: "تم تحديث تفضيلات الإشعارات!" }),

    // Account section
    dangerZone: t({ en: "Danger Zone", ar: "منطقة الخطر" }),
    deleteAccount: t({ en: "Delete Account", ar: "حذف الحساب" }),
    deleteAccountDesc: t({ en: "Permanently delete your account and all your data. This action cannot be undone.", ar: "حذف حسابك وجميع بياناتك نهائياً. هذا الإجراء لا يمكن التراجع عنه." }),
    deleteConfirm: t({ en: "Type your password to confirm deletion", ar: "اكتب كلمة المرور لتأكيد الحذف" }),
    deleteButton: t({ en: "Delete My Account", ar: "حذف حسابي" }),
    deleteWarning: t({ en: "This will permanently delete your account, all your posts, and data.", ar: "سيتم حذف حسابك وجميع منشوراتك وبياناتك نهائياً." }),
    deleteSuccess: t({ en: "Account deleted. Goodbye!", ar: "تم حذف الحساب. إلى اللقاء!" }),
  },
};
