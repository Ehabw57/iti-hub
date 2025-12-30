import { Link } from "react-router-dom";
import { HiBars3, HiMagnifyingGlass } from "react-icons/hi2";
import { useAuthStore } from "@store/auth";
import { useState } from "react";
import NavbarMenu from "./NavbarMenu";
import UserMenu from "./UserMenu";
import NavbarSearch from "./NavbarSearch";
import { useUIStore } from "@store/uiStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState("en");

  return (
    <header>
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            <HiBars3 size={24} />
          </button>
     <Link to="/" className="font-extrabold text-xl">
  <span className="text-gray-700 dark:text-dark">ITI</span>
  <span className="text-red-600">Hub</span>
</Link>

        </div>

        {/* Search */}
        <div className="flex flex-1 max-w-md items-center">
          {/* Desktop Search */}
          <div className="relative w-full hidden md:block">
            <NavbarSearch />
          </div>

          {/* Mobile Search */}
          <div className="relative w-full md:hidden flex items-center">
            {mobileSearchOpen ? (
              <div className="flex items-center w-full gap-2">
                <NavbarSearch />
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <HiMagnifyingGlass size={24} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <UserMenu user={user} logout={logout} />
          ) : (
            <NavbarMenu />
          )}
        </div>
      </nav>
    </header>
  );
}
