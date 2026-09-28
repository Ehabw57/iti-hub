import { useNavigate } from "react-router-dom";
import { HiBars3 } from "react-icons/hi2";
import SearchBar from "./SearchBar";
import NavMenu from "./NavMenu";
import MinimalNavMenu from "./MinimalNavMenu";
import BrandLogo from '../common/BrandLogo';

export default function Navbar({
  onOpenSidebar,
  variant = "default" // "default" or "minimal"
}) {
  const navigate = useNavigate();

  // Minimal variant: Only logo, theme switcher, and language switcher
  if (variant === "minimal") {
    return (
      <nav className="sticky top-0 z-20 h-16 w-full bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200 flex items-center px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center cursor-pointer select-none" onClick={() => navigate("/")}>
          <BrandLogo />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Minimal menu: only theme and language switchers */}
        <MinimalNavMenu />
      </nav>
    );
  }

  // Default variant: Full navbar with search, nav links, notification & message icons
  return (
    <nav className="sticky top-0 z-20 h-16 w-full bg-neutral-100/95 backdrop-blur-md border-b border-neutral-200 flex items-center gap-4 px-4 lg:px-6">
      {/* Hamburger (mobile only) */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-neutral-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label="Open menu"
      >
        <HiBars3 className="w-6 h-6 text-neutral-700" />
      </button>

      {/* Logo — red wordmark */}
      <div
        className="flex items-center cursor-pointer select-none shrink-0"
        onClick={() => navigate("/")}
      >
        <BrandLogo />
      </div>

      {/* Searchbar */}
      <SearchBar />

      {/* Spacer pushes actions to the right */}
      <div className="flex-1" />

      {/* Right side: notifications, messages, avatar menu */}
      <NavMenu />
    </nav>
  );
}
