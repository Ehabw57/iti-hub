import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import {
  HiMagnifyingGlass,
  HiXMark,
  HiBuildingOffice2,
  HiAcademicCap,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineChatBubbleLeftEllipsis,
  HiArrowLongRight,
} from 'react-icons/hi2';
import { useGlobalSearch } from '@hooks/queries/useGlobalSearch';
import { UserAvatar } from '../user/UserAvatar';

/**
 * @fileoverview Site-wide search pinned in the sidebar (work order §1).
 *
 * Renders three CSS-controlled variants of the same search:
 *  - xl+ rail          → full-width input pill with a live results dropdown
 *  - lg…xl icon rail   → circular search button opening a floating panel
 *  - below lg (drawer) → full-width input row with a results dropdown
 *
 * Results come from GET /search/all (debounced ~300ms), grouped by type:
 * Branches, Tracks, Users, Communities, Jobs, Posts — up to 5 per group,
 * with a "see all results" link on the search page when more exist.
 */

const GROUPS = [
  {
    key: 'branches',
    labelKey: 'branches',
    Icon: HiBuildingOffice2,
    to: (item) => `/branches/${item._id}`,
    title: (item) => item.name,
    sub: (item) => item.location || '',
  },
  {
    key: 'tracks',
    labelKey: 'tracks',
    Icon: HiAcademicCap,
    to: (item) => `/tracks/${item._id}`,
    title: (item) => item.name,
    sub: (item) => item.category || '',
  },
  {
    key: 'users',
    labelKey: 'users',
    Icon: HiOutlineUser,
    to: (item) => `/profile/${item.username}`,
    title: (item) => item.fullName || item.username,
    sub: (item) => `@${item.username}`,
    avatar: true,
  },
  {
    key: 'communities',
    labelKey: 'communities',
    Icon: HiOutlineUserGroup,
    // Specialization groups have no detail page — the browse grid is their target
    to: (item) => (item.kind === 'group' ? '/communities' : `/community/${item._id}`),
    title: (item) => item.name,
    sub: (item) => item.sub,
    avatar: true,
  },
  {
    key: 'jobs',
    labelKey: 'jobs',
    Icon: HiOutlineBriefcase,
    to: () => '/jobs',
    title: (item) => item.title,
    sub: (item) => item.company || '',
  },
  {
    key: 'posts',
    labelKey: 'posts',
    Icon: HiOutlineChatBubbleLeftEllipsis,
    to: (item) => `/posts/${item._id}`,
    title: (item) => item.content,
    sub: () => '',
    clamp: true,
  },
];

/**
 * Grouped results list — no hooks, receives everything as props.
 */
function SearchResults({ data, loading, query, content, onSelect, onSeeAll }) {
  const t = (key, fallback = '') => content[key]?.value ?? fallback;

  if (query.length < 2) {
    return (
      <div className="px-4 py-6 text-center text-body-2 text-neutral-500">
        {t('startTyping')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-6 text-center text-body-2 text-neutral-500">
        {t('searching')}
      </div>
    );
  }

  const results = data?.results;
  const visibleGroups = GROUPS.filter((g) => (results?.[g.key] ?? []).length > 0);

  if (visibleGroups.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-body-2 text-neutral-500">
        <p>
          {t('noResults')} &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-1">
      {visibleGroups.map((group) => {
        const Icon = group.Icon;
        const items = results[group.key];
        const hasMore = data.hasMore?.[group.key];
        return (
          <div key={group.key}>
            <div className="flex items-center gap-2 px-4 pt-2 pb-1 text-caption font-semibold text-neutral-500 uppercase tracking-wide">
              <Icon className="w-4 h-4" aria-hidden="true" />
              {t(group.labelKey)}
            </div>
            {items.map((item) => (
              <button
                key={`${group.key}-${item._id}`}
                type="button"
                onClick={() => onSelect(group, item)}
                className="w-full flex items-center gap-3 px-4 py-2 text-start hover:bg-neutral-100 focus:outline-none focus-visible:bg-neutral-100 transition-colors"
              >
                {group.avatar ? (
                  <UserAvatar
                    src={item.profilePicture || null}
                    alt={group.title(item)}
                    size="sm"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-neutral-600" aria-hidden="true" />
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-body-2 text-neutral-900 ${
                      group.clamp ? 'line-clamp-1' : 'truncate'
                    }`}
                  >
                    {group.title(item)}
                  </span>
                  {group.sub(item) && (
                    <span className="block text-caption text-neutral-500 truncate">
                      {group.sub(item)}
                    </span>
                  )}
                </span>
              </button>
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={onSeeAll}
                className="w-full flex items-center gap-1.5 px-4 py-2 text-start text-body-2 font-semibold text-primary-600 hover:text-primary-700 hover:bg-neutral-100 transition-colors"
              >
                <HiArrowLongRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                {t('seeAllResults')} &quot;{query}&quot;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main search control. One instance renders all breakpoint variants;
 * CSS decides which is visible (xl pill, lg→xl floating panel, mobile row).
 */
export default function SidebarSearch({ compact = false }) {
  const navigate = useNavigate();
  const content = useIntlayer('sidebarSearch');

  const [value, setValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const panelInputRef = useRef(null);

  // Debounce typed input ~300ms before querying
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const searchActive = dropdownOpen || panelOpen;

  const { data, isFetching } = useGlobalSearch(debounced, {
    enabled: searchActive,
  });

  const closeAll = () => {
    setDropdownOpen(false);
    setPanelOpen(false);
  };

  // Click-outside closes the dropdown / floating panel
  useEffect(() => {
    if (!searchActive) return;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        closeAll();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchActive]);

  // Escape closes too
  useEffect(() => {
    if (!searchActive) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeAll();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchActive]);

  const seeAll = () => {
    const query = value.trim();
    if (query.length < 2) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setValue('');
    closeAll();
  };

  const selectItem = (group, item) => {
    navigate(group.to(item));
    setValue('');
    closeAll();
  };

  const clearValue = (ref) => {
    setValue('');
    ref.current?.focus();
  };

  const renderInput = (ref, id) => (
    <div className="relative">
      <HiMagnifyingGlass
        className="w-5 h-5 text-neutral-500 absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        id={id}
        ref={ref}
        type="text"
        role="searchbox"
        aria-label={content.searchPlaceholder?.value}
        placeholder={content.searchPlaceholder?.value}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setDropdownOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim().length >= 2) {
            seeAll();
          }
        }}
        className="text-body-2 ps-12 pe-10 h-11 rounded-full bg-surface border border-transparent text-neutral-700 placeholder:text-neutral-500 focus:outline-none focus:border-primary-400 focus:bg-surface-lowest focus-visible:ring-2 focus-visible:ring-primary-100 w-full transition-colors"
      />
      {value && (
        <button
          type="button"
          aria-label={content.clear?.value}
          onClick={() => clearValue(ref)}
          className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        >
          <HiXMark className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  const results = (
    <SearchResults
      data={data}
      loading={isFetching}
      query={debounced}
      content={content}
      onSelect={selectItem}
      onSeeAll={seeAll}
    />
  );

  if (compact) return <div ref={rootRef} className="relative">
    <button type="button" aria-label={content.searchPlaceholder?.value} aria-expanded={panelOpen} aria-controls="mobile-search-panel" onClick={() => { setPanelOpen(!panelOpen); setTimeout(() => panelInputRef.current?.focus(), 0); }} className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"><HiMagnifyingGlass className="h-6 w-6" aria-hidden="true" /></button>
    {panelOpen && <section id="mobile-search-panel" aria-label={content.searchPlaceholder?.value} className="fixed inset-x-0 top-16 z-40 border-b border-outline bg-neutral-50 p-4 shadow-elevation-3">
      {renderInput(panelInputRef, 'mobile-search-input')}
      {value.trim() && <div className="mt-2 max-h-[60dvh] overflow-y-auto">{results}</div>}
    </section>}
  </div>;

  return (
    <div ref={rootRef} className="relative w-full">
      {/* xl+ rail — full-width input pill with dropdown */}
      <div className="hidden xl:block">
        {renderInput(inputRef, 'sidebar-search-xl')}
        {dropdownOpen && value.trim().length > 0 && (
          <div className="absolute z-40 mt-2 w-full bg-neutral-50 border border-outline rounded-2xl shadow-elevation-3 overflow-hidden">
            {results}
          </div>
        )}
      </div>

      {/* lg→xl icon rail — circular button (opens the floating panel) */}
      <div className="hidden lg:flex xl:hidden">
        <button
          type="button"
          aria-label={content.searchPlaceholder?.value}
          aria-expanded={panelOpen}
          onClick={() => {
            setPanelOpen((prev) => !prev);
            setTimeout(() => panelInputRef.current?.focus(), 0);
          }}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          <HiMagnifyingGlass className="w-[26px] h-[26px]" aria-hidden="true" />
        </button>
      </div>

      {/* Below lg (mobile drawer) — full-width input row with dropdown */}
      <div className="lg:hidden">
        {renderInput(inputRef, 'sidebar-search-mobile')}
        {dropdownOpen && value.trim().length > 0 && (
          <div className="absolute z-40 mt-2 w-full bg-neutral-50 border border-outline rounded-2xl shadow-elevation-3 overflow-hidden">
            {results}
          </div>
        )}
      </div>

      {/* Floating panel for the lg→xl collapsed rail (fixed overlay) */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 hidden lg:flex xl:hidden items-start pointer-events-none">
          <div
            className="pointer-events-auto lg:ms-[76px] w-[min(340px,calc(100vw-96px))] bg-neutral-50 border border-outline rounded-2xl shadow-elevation-3 p-3"
            role="dialog"
            aria-modal="false"
            aria-label={content.searchPlaceholder?.value}
          >
            {renderInput(panelInputRef, 'sidebar-search-panel')}
            <div className="mt-2 bg-neutral-50 border border-outline rounded-2xl overflow-hidden">
              {results}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


