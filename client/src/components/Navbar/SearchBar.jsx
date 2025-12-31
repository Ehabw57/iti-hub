

import { useState, useRef, useEffect } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useFastSearch } from "@hooks/queries/useFastSearch";
import { ImSpinner2 } from "react-icons/im";
import { UserAvatar } from "../user/UserAvatar";
import clsx from "clsx";
import { useIntlayer } from "react-intlayer";
import navbarContent from "@/content/navbar/navbar.content";

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false); // mobile searchbar expansion
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const inputElementRef = useRef(null);
  const content = useIntlayer(navbarContent.key);

  // Debounce logic
  const [debouncedValue, setDebouncedValue] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchValue.length > 2) {
        setDebouncedValue(searchValue);
      } else {
        setDebouncedValue("");
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue]);

  const { data: fastResults, isLoading: fastLoading } = useFastSearch(debouncedValue);

  // Handle search input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowDropdown(value.trim().length > 0);
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setShowDropdown(false);
      setSearchOpen(false);
      setSearchValue("");
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  return (
    <div className="md:relative h-11 flex items-center w-full lg:w-auto justify-end">
      {/* Search input */}
      <div
        ref={inputRef}
        className={clsx(
          "flex items-center md:relative",
          searchOpen ? "w-full" : "w-0 overflow-hidden lg:w-80 lg:overflow-visible"
        )}
      >
        <input
          ref={inputElementRef}
          type="text"
          className="text-body-2 px-3 py-2 h-7 rounded-lg bg-neutral-50 border border-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 w-full"
          placeholder={content.searchPlaceholder.value}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(searchValue.trim().length > 0)}
          aria-label={content.searchPlaceholder}
          tabIndex={0}
        />
        {/* Collapse button (mobile only) */}
        <button
          type="button"
          className="lg:hidden ms-2 p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500"
          aria-label={content.collapseSearch}
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSearchOpen(false); setShowDropdown(false); setSearchValue(""); } }}
          onClick={() => { setSearchOpen(false); setShowDropdown(false); setSearchValue(""); }}
        >
          <HiXMark className="w-5 h-5" />
        </button>

        {/* Quick results dropdown */}
        {showDropdown && searchValue.trim().length > 0 && (
          <div className="absolute w-screen md:w-81 lg:w-74 top-full rtl:right-1 ltr:left-0  mt-2 bg-white rounded-lg border border-neutral-200 shadow-sm z-10 max-h-96 overflow-y-auto ">
            {fastLoading ? (
              <div className="flex items-center justify-center p-4 text-neutral-500 gap-2">
                <ImSpinner2 className="animate-spin w-5 h-5 text-primary-500" />
                <span>{content.loading}</span>
              </div>
            ) : fastResults && (fastResults.data.users?.length > 0 || fastResults.data.communities?.length > 0) ? (
              <div>
                {fastResults.data.users?.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1 text-xs font-semibold text-neutral-500 uppercase">{content.users}</div>
                    {fastResults.data.users.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100 focus-visible:bg-neutral-100"
                        tabIndex={0}
                        onKeyDown={e => { 
                          if (e.key === 'Enter' || e.key === ' ') { 
                            e.preventDefault();
                            navigate(`/profile/${user.username}`); 
                            setShowDropdown(false); 
                            setSearchOpen(false); 
                            setSearchValue("");
                          } 
                        }}
                        onClick={() => { 
                          navigate(`/profile/${user.username}`); 
                          setShowDropdown(false); 
                          setSearchOpen(false); 
                          setSearchValue("");
                        }}
                      >
                        <UserAvatar src={user.profilePicture} alt={user.fullName} size="sm" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm text-neutral-900 truncate">{user.fullName}</span>
                          <span className="text-xs text-neutral-500 truncate">@{user.username}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {fastResults.data.communities?.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1 text-xs font-semibold text-neutral-500 uppercase">{content.communities}</div>
                    {fastResults.data.communities.map((community) => (
                      <div
                        key={community._id}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100 focus-visible:bg-neutral-100"
                        tabIndex={0}
                        onKeyDown={e => { 
                          if (e.key === 'Enter' || e.key === ' ') { 
                            e.preventDefault();
                            navigate(`/community/${community._id}`); 
                            setShowDropdown(false); 
                            setSearchOpen(false); 
                            setSearchValue("");
                          } 
                        }}
                        onClick={() => { 
                          navigate(`/community/${community._id}`); 
                          setShowDropdown(false); 
                          setSearchOpen(false); 
                          setSearchValue("");
                        }}
                      >
                        {community.profilePicture ? (
                          <img src={community.profilePicture} alt={community.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold text-xs">C</span>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm text-neutral-900 truncate flex-1 min-w-0">{community.name}</span>
                          {typeof community.memberCount !== 'undefined' && (
                            <span className="text-xs text-neutral-500 truncate">{community.memberCount} members</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : debouncedValue.trim().length > 0 && !fastLoading ? (
              <div className="p-4 text-neutral-500 text-sm text-center">{content.noResults}</div>
            ) : null}
          </div>
        )}
      </div>
      {/* Mobile collapsed icon (moved to right) */}
      <button
        type="button"
        className={clsx(
          "lg:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 ml-2",
          { hidden: searchOpen }
        )}
        aria-label={content.expandSearch}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            setSearchOpen(true);
          }
        }}
        onClick={() => {
          setSearchOpen(true);
          setTimeout(() => {
            inputElementRef.current?.focus();
          }, 0);
        }}
      >
        <HiMagnifyingGlass className="w-6 h-6" />
      </button>
    </div>
  );
}
