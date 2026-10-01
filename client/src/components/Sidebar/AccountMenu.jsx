import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineEllipsisHorizontal,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiMoon,
  HiSun,
  HiOutlineLanguage,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import { useIntlayer, useLocale } from 'react-intlayer';
import { useSidebarStore } from '@hooks/useSidebarStore';
import useUIStore from '@store/uiStore';
import { UserAvatar } from '@components/user/UserAvatar';

// Popover geometry — the menu is portaled to document.body and positioned
// from the chip's getBoundingClientRect(), so no scrollable / overflow-hidden
// ancestor in the rail can clip or shift it (fixes the mis-positioned
// dropdown). Values in px.
const MENU_WIDTH = 300;
const ANCHOR_GAP = 8;
const VIEWPORT_GAP = 8;

/**
 * @fileoverview Account chip pinned to the bottom of the left rail (X
 * pattern). Opens a popover with profile/settings links, the dark-mode
 * toggle, the EN/AR language switcher, and logout — absorbing the old
 * NavMenu / ThemeSwitcher / LanguageSwitcher shell responsibilities.
 */
export default function AccountMenu() {
  const navigate = useNavigate();
  const content = useIntlayer('sidebar');
  const { setLocale: setIntlayerLocale } = useLocale();
  const { user, logout } = useSidebarStore();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Close on outside click / Escape. The popover is portaled to document.body,
  // so both the chip button and the rendered menu count as "inside".
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        buttonRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Anchor the fixed-position popover to the chip. Portaling to document.body
  // escapes every overflow-hidden / transformed ancestor in the sidebar rail;
  // coordinates are recomputed on scroll + resize so the menu tracks the chip.
  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      const chip = buttonRef.current;
      if (!chip) return;
      const rect = chip.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 400;

      // Vertical: prefer opening upward (the chip sits at the bottom of the
      // rail); flip downward when there is not enough room above.
      let top;
      if (rect.top >= menuHeight + ANCHOR_GAP + VIEWPORT_GAP) {
        top = rect.top - menuHeight - ANCHOR_GAP;
      } else {
        top = Math.min(
          rect.bottom + ANCHOR_GAP,
          window.innerHeight - menuHeight - VIEWPORT_GAP
        );
      }

      // Horizontal: align the menu with the chip's leading edge (RTL mirrors
      // the anchor side), then clamp it into the viewport.
      const isRtl = locale === 'ar';
      let left = isRtl ? rect.right - MENU_WIDTH : rect.left;
      left = Math.min(
        Math.max(VIEWPORT_GAP, left),
        window.innerWidth - MENU_WIDTH - VIEWPORT_GAP
      );

      setMenuStyle({
        top: Math.max(VIEWPORT_GAP, top),
        left,
      });
    };

    // First pass runs before paint; a rAF pass re-measures once the menu
    // content has fully laid out (offsetHeight is reliable then).
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, locale]);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  // uiStore persists locale + dir; intlayer swaps the rendered dictionaries
  const switchLocale = (newLocale) => {
    setLocale(newLocale);
    setIntlayerLocale(newLocale);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-full">
      {/* Chip — avatar only between lg and xl, full identity otherwise */}
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={content.account?.value || 'Account'}
        className="
          flex items-center gap-2
          w-full py-2 px-2.5
          rounded-full
          hover:bg-neutral-100
          transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
        "
      >
        <UserAvatar
          src={user?.profilePicture}
          alt={user?.fullName || 'User'}
          size="md"
          className="shrink-0"
        />
        <span className="flex lg:hidden xl:flex flex-col items-start min-w-0 flex-1">
          <span className="text-[15px] font-bold text-neutral-900 leading-5 truncate w-full">
            {user?.fullName}
          </span>
          <span className="text-[15px] text-neutral-500 leading-5 truncate w-full">
            @{user?.username}
          </span>
        </span>
        <HiOutlineEllipsisHorizontal
          className="hidden xl:block w-5 h-5 text-neutral-800 shrink-0"
          aria-hidden="true"
        />
      </button>

      {/* Popover — portaled to <body> and fixed-positioned from the chip's
          rect; flips down when there is no room above and clamps to the
          viewport (RTL-aware). */}
      {open &&
        createPortal(
          <div
            role="menu"
            aria-label={content.account?.value || 'Account'}
            ref={menuRef}
            style={menuStyle ?? undefined}
            className="
              fixed
              w-[300px] max-w-[calc(100vw-2rem)]
              bg-neutral-50 border border-outline shadow-elevation-3
              rounded-2xl py-2 z-50
            "
          >
          {/* Account header */}
          <div className="px-4 py-3 flex flex-col items-start gap-0.5">
            <span className="text-[15px] font-bold text-neutral-900 truncate w-full">
              {user?.fullName}
            </span>
            <span className="text-[15px] text-neutral-500 truncate w-full">
              @{user?.username}
            </span>
          </div>

          <div className="border-t border-outline my-2" />

          {/* Links */}
          <button
            type="button"
            role="menuitem"
            onClick={() => goTo(`/profile/${user?.username || ''}`)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <HiOutlineUser className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-[15px] text-neutral-900">{content.myProfile}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => goTo('/settings')}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <HiOutlineCog6Tooth className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-[15px] text-neutral-900">{content.settings}</span>
          </button>

          {/* Dark mode toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            {theme === 'dark' ? (
              <HiMoon className="w-5 h-5 shrink-0" aria-hidden="true" />
            ) : (
              <HiSun className="w-5 h-5 shrink-0 text-primary-600" aria-hidden="true" />
            )}
            <span className="text-[15px] text-neutral-900 flex-1 text-start">
              {content.darkMode}
            </span>
            <span
              className={`
                w-10 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors
                ${theme === 'dark' ? 'bg-primary-600 justify-end' : 'bg-neutral-200 justify-start'}
              `}
              aria-hidden="true"
            >
              <span className="w-5 h-5 rounded-full bg-neutral-50 shadow-elevation-1" />
            </span>
          </button>

          {/* Language switcher (EN / AR) */}
          <div className="px-4 py-3 flex items-center gap-3">
            <HiOutlineLanguage className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-[15px] text-neutral-900 flex-1">{content.language}</span>
            <div className="flex rounded-full border border-outline overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => switchLocale('en')}
                aria-pressed={locale === 'en'}
                className={`
                  px-3 h-8 text-[13px] font-bold transition-colors
                  ${locale === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'}
                `}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => switchLocale('ar')}
                aria-pressed={locale === 'ar'}
                className={`
                  px-3 h-8 text-[13px] font-bold transition-colors
                  ${locale === 'ar'
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'}
                `}
              >
                عربي
              </button>
            </div>
          </div>

          <div className="border-t border-outline my-2" />

          {/* Logout */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <HiOutlineArrowRightOnRectangle
              className="w-5 h-5 shrink-0 rtl:-scale-x-100"
              aria-hidden="true"
            />
            <span className="text-[15px] text-primary-600 font-bold">{content.logout}</span>
          </button>
            </div>,
            document.body
          )}
    </div>
  );
}
