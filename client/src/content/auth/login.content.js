import { t } from "intlayer";
export default {
  key: "authLogin",
  content: {
    pageTitle: t({
      en: "Login to ITI Hub",
      ar: "تسجيل الدخول إلى ITI Hub",
    }),
    emailLabel: t({
      en: "Email",
      ar: "البريد الإلكتروني",
    }),
    emailPlaceholder: t({
      en: "Enter your email",
      ar: "أدخل بريدك الإلكتروني",
    }),
    passwordLabel: t({
      en: "Password",
      ar: "كلمة المرور",
    }),
    passwordPlaceholder: t({
      en: "Enter your password",
      ar: "أدخل كلمة المرور",
    }),
    submitButton: t({
      en: "Login",
      ar: "تسجيل الدخول",
    }),
    submittingButton: t({
      en: "Logging in...",
      ar: "جاري تسجيل الدخول...",
    }),
    forgotPassword: t({
      en: "Forgot password?",
      ar: "نسيت كلمة المرور؟",
    }),
    noAccount: t({
      en: "Don't have an account?",
      ar: "ليس لديك حساب؟",
    }),
    registerLink: t({
      en: "Register",
      ar: "التسجيل",
    }),
    errorInvalidCredentials: t({
      en: "Invalid email or password",
      ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    }),
    errorTooManyRequests: t({
      en: "Too many login attempts. Please try again in {minutes} minutes.",
      ar: "محاولات تسجيل دخول كثيرة جداً. يرجى المحاولة مرة أخرى بعد {minutes} دقيقة.",
    }),
    errorNetwork: t({
      en: "Network error. Please check your connection.",
      ar: "خطأ في الشبكة. يرجى التحقق من اتصالك.",
    }),
    cooldownMessage: t({
      en: "Please wait {time} before trying again.",
      ar: "يرجى الانتظار {time} قبل المحاولة مرة أخرى.",
    }),
  },
};
