import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { HiEllipsisHorizontal, HiMoon, HiSun } from "react-icons/hi2";
import { useUIStore } from "@store/uiStore";
import { useLocale } from "react-intlayer";
import { useEffect, useState } from "react";
import { useAuthStore } from "@store/auth";

const languages = [
  { code: "en", nativeName: "English" },
  { code: "ar", nativeName: "العربية" },
];

export default function NavbarMenu() {
  const { user, logout } = useAuthStore();

  /* 🌐 Language */
  const { locale, setLocale } = useUIStore();
  const { setLocale: setIntlayerLocale } = useLocale();

  const handleLocaleChange = (newLocale) => {
    setLocale(newLocale);
    setIntlayerLocale(newLocale);
  };

  /* 🌙 Theme */
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;
    theme === "dark"
      ? root.classList.add("dark")
      : root.classList.remove("dark");
  }, [theme]);

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center focus:outline-none">
        {!user ? (
          <HiEllipsisHorizontal className="h-6 w-6 text-neutral-600 dark:text-white" />
        ) : (
          <img
            src={user.avatar || "/avatar.png"}
            alt="profile"
            className="h-9 w-9 rounded-full object-cover cursor-pointer"
          />
        )}
      </MenuButton>

      <MenuItems className="absolute right-0 mt-2 w-56 rounded-lg bg-neutral-100 dark:bg-neutral-900 shadow-lg ring-1 ring-black/5 z-50 overflow-hidden">
        
        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b dark:border-neutral-700">
            <p className="text-sm font-semibold">{user.username}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
        )}

        {/* 🌐 Language */}
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLocaleChange(language.code)}
            className={`px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800
              ${
                locale === language.code
                  ? "font-semibold text-red-600"
                  : "text-neutral-800 dark:text-neutral-200"
              }`}
          >
            {language.nativeName}
          </button>
        ))}

        <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />

        {/* 🌙 Theme */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
        >
          {theme === "light" ? (
            <>
              <HiMoon className="h-4 w-4" /> Dark Mode
            </>
          ) : (
            <>
              <HiSun className="h-4 w-4" /> Light Mode
            </>
          )}
        </button>

        {/* Logout */}
        {user && (
          <>
            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </button>
          </>
        )}
      </MenuItems>
    </Menu>
  );
}
