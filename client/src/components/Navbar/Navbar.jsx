import { LanguageSwitcher } from "../common";
import ThemeSwitcher from "./ThemeSwitcher"

export default function Navbar() {
  return (
    <nav className="bg-neutral-50 border-b border-black z-4">
      <LanguageSwitcher />
      <ThemeSwitcher />
    </nav>
  );
}