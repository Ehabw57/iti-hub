import { t } from "intlayer";

export default {
  key: "authResendVerification",
  content: {
    title: t({
      en: "Resend Verification Email",
      ar: "إعادة إرسال بريد التحقق",
    }),
    description: t({
      en: "Click the button below to receive a new verification email. Make sure you're logged in.",
      ar: "انقر على الزر أدناه لاستلام بريد تحقق جديد. تأكد من تسجيل الدخول.",
    }),
    buttonText: t({
      en: "Resend Email",
      ar: "إعادة الإرسال",
    }),
    sending: t({
      en: "Sending...",
      ar: "جاري الإرسال...",
    }),
    successMessage: t({
      en: "Verification email sent successfully! Please check your inbox.",
      ar: "تم إرسال بريد التحقق بنجاح! يرجى التحقق من صندوق الوارد.",
    }),
    errorMessage: t({
      en: "Failed to send verification email. Please try again.",
      ar: "فشل في إرسال بريد التحقق. يرجى المحاولة مرة أخرى.",
    }),
    backToLogin: t({
      en: "Back to Login",
      ar: "العودة لتسجيل الدخول",
    }),
  },
};
