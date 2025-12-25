import { t } from "intlayer";

export default {
  key: "authProvider",
  content: {
    verifyingSession: t({ en: "Restoring your session...", ar: "استعادة جلستك..." }),
    sessionReady: t({ en: "Session ready", ar: "الجلسة جاهزة" }),
    sessionExpired: t({ en: "Session expired", ar: "انتهت صلاحية الجلسة" }),
    loggingOut: t({ en: "Logging out...", ar: "جارٍ تسجيل الخروج..." }),
    retrying: t({ en: "Retrying...", ar: "إعادة المحاولة..." }),
  }
};
