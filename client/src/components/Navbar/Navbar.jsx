import { LanguageSwitcher } from "../common";
import ThemeSwitcher from "./ThemeSwitcher"

export default function Navbar() {
  return (
    <nav>
      <LanguageSwitcher />
      <ThemeSwitcher />
    </nav>
  );
}