import { t } from "intlayer";

export default {
  key: "authEmailVerification",
  content: {
    title: t({
      en: "Verify Your Email",
      ar: "تأكيد البريد الإلكتروني",
    }),
    description: t({
      en: "We are verifying your email address. Please wait...",
      ar: "جاري التحقق من بريدك الإلكتروني، يرجى الانتظار...",
    }),
    successMessage: t({
      en: "Your email has been verified successfully. You can now log in.",
      ar: "تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول.",
    }),
    errorInvalidToken: t({
      en: "This verification link is invalid or has expired.",
      ar: "رابط التحقق غير صالح أو منتهي الصلاحية.",
    }),
    errorAlreadyVerified: t({
      en: "This email is already verified.",
      ar: "هذا البريد الإلكتروني مؤكد بالفعل.",
    }),
    networkError: t({
      en: "Network error. Please try again.",
      ar: "خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
    }),
    backToLogin: t({
      en: "Back to Login",
      ar: "العودة لتسجيل الدخول",
    }),
    resendLink: t({
      en: "Resend verification email",
      ar: "إعادة إرسال بريد التحقق",
    }),
  },
};
