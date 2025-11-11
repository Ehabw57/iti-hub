import { t, type Dictionary } from "intlayer";
import type { ReactNode } from "react";

const appContent = {
  key: "app",
  content: {

    title: t({
      en: "TEST",
      ar: "اختبار",
    }),

    welcome: t({
      en: "Welcome ya aboya",
      ar: "احلى مسا ي ابويا",
    }),
    
  },
} satisfies Dictionary;

export default appContent;
