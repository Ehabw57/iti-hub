import { Locales } from "intlayer";
import { useLocale } from "react-intlayer";
import { useIntlayer } from "react-intlayer";
import { Link } from "react-router-dom";
import ThemeSwitch from "../ThemeSwitcher.jsx";

export default function Navbar() {
  const { locale, setLocale } = useLocale();
  const l = useIntlayer("app");
  return (
    <nav className="p-4 border-b mb-4 flex justify-between items-center">
      <ul>
        <li className="inline-block mr-4">
          <Link to="/">{l.home}</Link>
        </li>
        <li className="inline-block mr-4">
          <Link to="/messages">{l.messages}</Link>
        </li>
      </ul>
      <button
        onClick={() =>
          setLocale(
            locale === Locales.ARABIC ? Locales.ENGLISH : Locales.ARABIC
          )
        }
      >
        {locale === Locales.ARABIC ? "EN" : "ع"}
      </button>
      <ThemeSwitch />
    </nav>
  );
}
