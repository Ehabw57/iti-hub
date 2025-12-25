import { t } from 'intlayer';
export default {
  key: "loginModal",
  content: {
    title: t({ en: "Login Required", ar: "تسجيل الدخول مطلوب" }),
    message: t({ en: "You need to be logged in to perform this action.", ar: "يجب أن تكون مسجلاً للدخول لتنفيذ هذا الإجراء." }),
    loginButton: t({ en: "Login", ar: "تسجيل الدخول" }),
    registerButton: t({ en: "Create Account", ar: "إنشاء حساب" }),
    cancel: t({ en: "Cancel", ar: "إلغاء" }),
  }
};