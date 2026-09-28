import { HiSun, HiMoon } from "react-icons/hi2";
import useUIStore from "@/store/uiStore";

export default function ThemeSwitcher({ variant = "default" }) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  // Minimal variant: Simple icon button
  if (variant === "minimal") {
    return (
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        className="w-20 h-10 rounded-full flex items-center justify-center shadow-elevation-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500"
        tabIndex={0}
      >
        {theme === "dark" ? (
          <HiMoon className="w-5 h-5 text-neutral-700" />
        ) : (
          <HiSun className="w-5 h-5 text-primary-600" />
        )}
      </button>
    );
  }

  // Default variant: Toggle switch
  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="relative w-20 h-8 flex items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 border border-neutral-200 bg-neutral-100 shadow-elevation-1"
      tabIndex={0}
    >
      {/* Track */}
      <span className="absolute left-0 top-0 w-full h-full rounded-full pointer-events-none opacity-70" />
      {/* Thumb */}
      <span
        className={`absolute top-1 start-1 w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center transition-transform duration-300
          ${theme === "dark" ? "ltr:translate-x-12 rtl:-translate-x-12" : "translate-x-0"}`}
      >
        {theme === "dark" ? (
          <HiMoon className="w-5 h-5 text-warning" />
        ) : (
          <HiSun className="w-5 h-5 text-primary-500" />
        )}
      </span>
      {/* Icons on track */}
      <span className="absolute start-2 top-1.5 text-warning">
        <HiSun className="w-4 h-4" />
      </span>
      <span className="absolute end-2 top-1.5 text-secondary-400 dark:text-warning">
        <HiMoon className="w-4 h-4" />
      </span>
    </button>
  );
}
