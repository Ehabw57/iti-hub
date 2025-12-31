import { useNavigate } from "react-router-dom";
import { HiBars3 } from "react-icons/hi2";
import SearchBar from "./SearchBar";
import NavMenu from "./NavMenu";
import MinimalNavMenu from "./MinimalNavMenu";

// SVG Logo (replace with your own or update as needed)
const ItiHubLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="var(--color-primary-500)" />
    <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff" fontFamily="Inter, sans-serif">iti</text>
  </svg>
);

export default function Navbar({
  onOpenSidebar,
  variant = "default" // "default" or "minimal"
}) {
  const navigate = useNavigate();

  // Minimal variant: Only logo, theme switcher, and language switcher
  if (variant === "minimal") {
    return (
      <nav className="sticky top-0 z-4 w-full bg-neutral-50 border-b border-neutral-200 shadow-elevation-1 flex items-center px-2 lg:px-6 py-3">
        {/* Logo */}
        <div className="flex items-center cursor-pointer select-none" onClick={() => navigate("/")}> 
          {/* Show SVG only on mobile, SVG+text on desktop */}
          <span className="block lg:hidden"><ItiHubLogo /></span>
          <span className="hidden lg:flex items-center gap-2">
            <ItiHubLogo />
            <span className="text-heading-4 font-bold text-primary-700 tracking-tight">itiHub</span>
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Minimal menu: only theme and language switchers */}
        <MinimalNavMenu />
      </nav>
    );
  }

  // Default variant: Full navbar with search, sidebar toggle, etc.
  return (
    <nav className="sticky top-0 z-4 w-full bg-neutral-50 border-b border-neutral-200 shadow-elevation-1 flex items-center  px-2 lg:px-6">
      {/* Hamburger (mobile only) */}
      <div className="lg:hidden flex items-center me-2">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500"
          aria-label="Open menu"
        >
          <HiBars3 className="w-6 h-6 text-neutral-700" />
        </button>
      </div>

      {/* Logo */}
      <div className="flex items-center cursor-pointer select-none" onClick={() => navigate("/")}> 
        {/* Show SVG only on mobile, SVG+text on desktop */}
        <span className="block lg:hidden"><ItiHubLogo /></span>
        <span className="hidden lg:flex items-center gap-2">
          <ItiHubLogo />
          <span className="text-heading-4 font-bold text-primary-700 tracking-tight">itiHub</span>
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Searchbar - desktop: expanded, mobile: collapsed icon */}
      <div className="flex items-center gap-9">
        <SearchBar />
        {/* NavMenu: avatar, theme/lang switchers, logout */}
        <NavMenu />
      </div>
    </nav>
  );
}