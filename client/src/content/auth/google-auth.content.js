import { t } from "intlayer";

export default {
  key: "authGoogle",
  content: {
    orContinueWith: t({
      en: "or continue with",
      ar: "أو المتابعة باستخدام",
    }),
    buttonLabel: t({
      en: "Continue with Google",
      ar: "المتابعة باستخدام Google",
    }),
    errorNotConfigured: t({
      en: "Google Sign-In is not configured on this device.",
      ar: "تسجيل الدخول عبر Google غير مُهيأ على هذا الجهاز.",
    }),
  },
};
