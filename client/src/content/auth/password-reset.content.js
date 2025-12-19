import { t } from "intlayer";

export default {
  key: "authPasswordReset",
  content: {
    // Request Page
    requestTitle: t({
      en: "Reset Your Password",
      ar: "إعادة تعيين كلمة المرور",
    }),
    requestDescription: t({
      en: "Enter your email address and we'll send you a link to reset your password.",
      ar: "أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.",
    }),
    emailLabel: t({
      en: "Email Address",
      ar: "عنوان البريد الإلكتروني",
    }),
    emailPlaceholder: t({
      en: "your.email@example.com",
      ar: "your.email@example.com",
    }),
    requestButton: t({
      en: "Send Reset Link",
      ar: "إرسال رابط إعادة التعيين",
    }),
    requestingButton: t({
      en: "Sending...",
      ar: "جاري الإرسال...",
    }),
    requestSuccess: t({
      en: "If an account exists with this email, you will receive a password reset link shortly.",
      ar: "إذا كان هناك حساب بهذا البريد الإلكتروني، ستتلقى رابط إعادة تعيين كلمة المرور قريبًا.",
    }),
    backToLogin: t({
      en: "Back to Login",
      ar: "العودة لتسجيل الدخول",
    }),

    // Confirm Page
    confirmTitle: t({
      en: "Create New Password",
      ar: "إنشاء كلمة مرور جديدة",
    }),
    confirmDescription: t({
      en: "Enter your new password below.",
      ar: "أدخل كلمة المرور الجديدة أدناه.",
    }),
    passwordLabel: t({
      en: "New Password",
      ar: "كلمة المرور الجديدة",
    }),
    passwordPlaceholder: t({
      en: "Enter your new password",
      ar: "أدخل كلمة المرور الجديدة",
    }),
    confirmPasswordLabel: t({
      en: "Confirm Password",
      ar: "تأكيد كلمة المرور",
    }),
    confirmPasswordPlaceholder: t({
      en: "Re-enter your password",
      ar: "أعد إدخال كلمة المرور",
    }),
    confirmButton: t({
      en: "Reset Password",
      ar: "إعادة تعيين كلمة المرور",
    }),
    confirmingButton: t({
      en: "Resetting...",
      ar: "جاري إعادة التعيين...",
    }),
    confirmSuccess: t({
      en: "Your password has been reset successfully. You can now login with your new password.",
      ar: "تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    }),

    // Password Policy
    passwordPolicyTitle: t({
      en: "Password must contain:",
      ar: "يجب أن تحتوي كلمة المرور على:",
    }),
    policyMinLength: t({
      en: "At least 8 characters",
      ar: "8 أحرف على الأقل",
    }),
    policyLetter: t({
      en: "At least one letter",
      ar: "حرف واحد على الأقل",
    }),
    policyNumber: t({
      en: "At least one number",
      ar: "رقم واحد على الأقل",
    }),
    policySpecial: t({
      en: "At least one special character (!@#$%^&*)",
      ar: "حرف خاص واحد على الأقل (!@#$%^&*)",
    }),

    // Errors
    errorEmailInvalid: t({
      en: "Please enter a valid email address",
      ar: "يرجى إدخال عنوان بريد إلكتروني صالح",
    }),
    errorPasswordMatch: t({
      en: "Passwords do not match",
      ar: "كلمات المرور غير متطابقة",
    }),
    errorPasswordPolicy: t({
      en: "Password does not meet requirements",
      ar: "كلمة المرور لا تستوفي المتطلبات",
    }),
    errorInvalidToken: t({
      en: "This reset link is invalid or has expired. Please request a new one.",
      ar: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.",
    }),
    errorNetwork: t({
      en: "Network error. Please try again.",
      ar: "خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
    }),
    errorTooManyRequests: t({
      en: "Too many attempts. Please try again in {minutes} minutes.",
      ar: "محاولات كثيرة جدًا. يرجى المحاولة مرة أخرى بعد {minutes} دقيقة.",
    }),
    cooldownMessage: t({
      en: "Please wait {time} before trying again.",
      ar: "يرجى الانتظار {time} قبل المحاولة مرة أخرى.",
    }),
  },
};
