import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { useIntlayer } from "react-intlayer";
import searchContent from "@/content/search/search.content";

export default function SearchInput() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const  t = useIntlayer("search-page");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  return (
    <div>
      <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        placeholder={t.title.value}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}
