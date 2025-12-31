import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "../common/LanguageSwitcher";

/**
 * Minimal navigation menu for auth pages - only theme and language switchers
 */
export default function MinimalNavMenu() {
  return (
    <div className="flex items-center gap-3">
      <ThemeSwitcher variant="minimal" />
      <LanguageSwitcher />
    </div>
  );
}
