import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBell, HiOutlineEnvelope, HiOutlineEllipsisVertical } from "react-icons/hi2";
import { useAuthStore } from "@/store/auth";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { HiOutlineLogout } from "react-icons/hi";
import { useIntlayer } from "react-intlayer";
import { useSidebarStore } from "@hooks/useSidebarStore";

function IconButton({ icon, badge = 0, onClick, label }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative p-2 rounded-full text-neutral-700 hover:bg-neutral-200/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Icon className="w-6 h-6" strokeWidth={1.5} />
      {badge > 0 && (
        <span className="absolute top-0.5 ltr:right-0.5 rtl:left-0.5 min-w-4.5 h-4.5 px-1 inline-flex items-center justify-center bg-primary-600 text-white text-[10px] font-semibold rounded-full">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export default function NavMenu() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadNotifications, unreadMessages } = useSidebarStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const content = useIntlayer('navbar');

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
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
      {isAuthenticated && (
        <>
          <IconButton
            icon={HiOutlineBell}
            badge={unreadNotifications}
            label={content.notifications?.value || "Notifications"}
            onClick={() => navigate("/notifications")}
          />
          <IconButton
            icon={HiOutlineEnvelope}
            badge={unreadMessages}
            label={content.messages?.value || "Messages"}
            onClick={() => navigate("/messages")}
          />
        </>
      )}

      {/* Avatar / account menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ring-2 transition-shadow ${
            open ? "ring-primary-400 shadow-elevation-2" : "ring-transparent hover:ring-neutral-300"
          }`}
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
            <span className="w-9 h-9 rounded-full bg-surface-high flex items-center justify-center text-neutral-600">
              <HiOutlineEllipsisVertical className="w-5 h-5" />
            </span>
          )}
        </button>

        {open && (
          <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-56 bg-surface-lowest rounded-xl border border-outline shadow-elevation-3 z-10 overflow-hidden">
            {/* User info header */}
            {isAuthenticated && user && (
              <div className="px-4 py-3 border-b border-outline">
                <p className="text-sm font-semibold text-neutral-900 truncate">{user.fullName}</p>
                <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
              </div>
            )}

            <div className="p-3 flex flex-col items-stretch gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/profile/${user?.username || ""}`);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors flex items-center gap-2"
                >
                  {content.myProfile?.value || "My Profile"}
                </button>
              )}
              <ThemeSwitcher />
              <LanguageSwitcher />
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <HiOutlineLogout className="w-5 h-5" />
                  <span>{content.logout?.value || "Logout"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
