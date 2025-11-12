import { Locales, type IntlayerConfig } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    locales: [
      Locales.ENGLISH,
      Locales.ARABIC,
      // Your other locales
    ],
    defaultLocale: Locales.ENGLISH,
  },
};

export default config;