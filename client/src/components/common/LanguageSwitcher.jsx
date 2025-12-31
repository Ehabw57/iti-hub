
import { useUIStore } from "@store/uiStore";
import { useLocale } from "react-intlayer";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useUIStore();
  const { setLocale: setIntlayerLocale } = useLocale();

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
    setIntlayerLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLocale}
      className="px-3 py-1 w-full rounded-md text-sm bg-neutral-100 text-neutral-700 shadow-elevation-1 hover:bg-neutral-200 focus:outline-none"
      aria-label={locale === "en" ? "عربى" : "English"}
      tabIndex={0}
    >
      {locale === "en" ? "عربى" : "English"}
    </button>
  );
}
