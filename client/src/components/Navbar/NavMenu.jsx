import { useRef, useState, useEffect } from "react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { useAuthStore } from "@/store/auth";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { HiOutlineLogout } from "react-icons/hi";
import { useIntlayer } from "react-intlayer";
import navbarContent from "@/content/navbar/navbar.content";

export default function NavMenu() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const content = useIntlayer(navbarContent.key);

  // Close menu on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-elevation-1 ${isAuthenticated && user?.profilePicture ? 'bg-neutral-400' : 'bg-transparent'}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        tabIndex={0}
      >
        {isAuthenticated && user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.fullName || user.username || "User"}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <HiOutlineDotsVertical className="w-6 h-6 text-neutral-500" />
        )}
      </button>
      {open && (
        <div className="absolute ltr:right-0 rtl:left-0 mt-2 min-w-43 bg-white rounded-lg border border-neutral-200 shadow-md z-10 p-4 flex flex-col items-center gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {isAuthenticated && (
            <button
              onClick={logout}
              className="w-full px-3 py-2 rounded-md text-sm  text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <HiOutlineLogout className="w-5 h-5" />
              <span>{content.logout?.value || "Logout"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
