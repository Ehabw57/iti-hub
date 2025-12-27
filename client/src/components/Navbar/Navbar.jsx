import { Link } from "react-router-dom";
import { HiBars3, HiMagnifyingGlass, HiBell, HiChatBubbleBottomCenter, HiUserGroup } from "react-icons/hi2";
import { useAuthStore } from "@store/auth";
import { useState, useEffect } from "react";
import ThemeSwitcher from "../Navbar/ThemeSwitcher";
import SearchInput from "./SearchInput";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { Menu } from "@headlessui/react";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // Language state
  const [locale, setLocale] = useState("en");

  // Apply theme to root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-neutral-700 dark:text-neutral-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <HiBars3 size={24} />
          </button>
          <Link to="/" className="font-extrabold text-xl text-black dark:text-white">
            ITI<span className="text-red-600">Hub</span>
          </Link>
        </div>

        {/* Search (Desktop) */}
          <div className="flex flex-1 max-w-md">
            <div className="relative w-full">
              <SearchInput />
            </div>
          </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher locale={locale} setLocale={setLocale} />
          <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />


          {/* User Menu / Auth Buttons */}
          {isAuthenticated ? <UserMenu user={user} logout={logout} /> : <AuthButtons />}
        </div>
      </nav>
    </header>
  );
}

/* ---------- Auth Buttons ---------- */
function AuthButtons({ mobile }) {
  return (
    <div className={`flex gap-3 ${mobile ? "flex-col" : ""}`}>
      <Link to="/login" className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm text-center">Login</Link>
      <Link to="/register" className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm text-center">Register</Link>
    </div>
  );
}
