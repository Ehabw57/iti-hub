import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { HiGlobeAlt } from "react-icons/hi2";
import { useUIStore } from "@store/uiStore";
import { useLocale } from "react-intlayer";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "العربيه", nativeName: "العربية" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useUIStore();
  const { setLocale: setIntlayerLocale } = useLocale();

  const currentLanguage =
    languages.find((lang) => lang.code === locale) || languages[0];

  const handleLocaleChange = (newLocale) => {
    setLocale(newLocale);
    setIntlayerLocale(newLocale);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500">
        <HiGlobeAlt className="h-5 w-5" aria-hidden="true" />
        <span>{currentLanguage.nativeName}</span>
      </MenuButton>

      <MenuItems
        transition
        className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-elevation-2 ring-1 ring-black ring-opacity-5 focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0 z-50"
      >
        <div className="py-1">
          {languages.map((language) => (
            <MenuItem key={language.code}>
              {({ active }) => (
                <button
                  onClick={() => handleLocaleChange(language.code)}
                  className={`${active ? "bg-neutral-100" : ""} ${
                    locale === language.code
                      ? "bg-secondary-50 text-secondary-700 font-semibold"
                      : "text-neutral-900"
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <span className="flex-1 text-left">
                    {language.nativeName}
                  </span>
                </button>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
