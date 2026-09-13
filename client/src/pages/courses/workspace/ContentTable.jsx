import { useMemo, useState } from 'react';
import { HiChevronUp, HiChevronDown, HiChevronUpDown, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import { UserAvatar } from '@/components/user/UserAvatar';

/**
 * ContentTable — SharePoint-style table/list for the Track Workspace
 * (reissued work order §1). Shared by the Files and Records tabs:
 * a sortable column header row (Name / Modified / Modified By) followed
 * by rows each with a folder or file-type icon, name, modified date and
 * a "Modified By" avatar chip. Row hover highlights the row.
 *
 * Sorting is type-aware: folders group at the top, then the chosen
 * column sorts within each group (SharePoint behaviour).
 *
 * Row shape:
 *   {
 *     id, name, isFolder,
 *     icon: Component,        // folder or file-type icon
 *     iconTile: string,       // tailwind classes for the icon tile
 *     secondary?: string,     // caption under the name (e.g. description)
 *     modifiedAt: date-ish,   // upload / update timestamp
 *     modifiedBy: { fullName, username, profilePicture } | null,
 *     href?: string,          // makes the name a new-tab link
 *     onOpen?: () => void,    // ...or a button (folders)
 *     onDownload?: () => void, // primary action triggers a blob download
 *     openLabel?: string, openIcon?: Component,  // row's primary action
 *     onDelete?: () => void, deleteLabel?: string, // manager delete
 *     onEdit?: () => void, editLabel?: string,    // manager edit / rename
 *   }
 */

/** Column comparator for the active sort key (1 = a first, -1 = b first). */
function compareBy(key, a, b) {
  if (key === 'name') {
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  }
  if (key === 'modified') {
    return new Date(a.modifiedAt || 0).getTime() - new Date(b.modifiedAt || 0).getTime();
  }
  // modifiedBy — sort by the modifier's display name
  const nameOf = (row) => String(row.modifiedBy?.fullName || row.modifiedBy?.username || '');
  return nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base' });
}

/** Sortable column header button with the tri-state chevron. */
function SortHeader({ label, active, direction, onClick }) {
  const Icon = !active ? HiChevronUpDown : direction === 'asc' ? HiChevronUp : HiChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 text-caption font-semibold transition-colors ${
        active ? 'text-neutral-800' : 'text-neutral-500 hover:text-neutral-800'
      }`}
    >
      <span className="truncate">{label}</span>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    </button>
  );
}

/** Avatar + display-name chip for the "Modified By" column. */
function ModifiedBy({ user }) {
  if (!user) return <span className="text-caption text-neutral-400">—</span>;
  const name = user.fullName || user.username || '';
  return (
    <span className="inline-flex items-center gap-2 min-w-0" title={name}>
      <UserAvatar src={user.profilePicture} alt={name} size="sm" className="shrink-0" />
      <span className="text-caption text-neutral-600 truncate">{name}</span>
    </span>
  );
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');

export default function ContentTable({
  rows,
  columnName,
  columnModified,
  columnModifiedBy,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyHint,
}) {
  // Default sort: newest modified first (matches the old newest-first lists)
  const [sort, setSort] = useState({ key: 'modified', direction: 'desc' });

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Name / Modified By start ascending; Modified starts newest-first
      return { key, direction: key === 'modified' ? 'desc' : 'asc' };
    });
  };

  const sortedRows = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    const cmp = (a, b) => compareBy(sort.key, a, b) * direction;
    const folders = rows.filter((r) => r.isFolder).sort(cmp);
    const items = rows.filter((r) => !r.isFolder).sort(cmp);
    return [...folders, ...items];
  }, [rows, sort]);

  if (rows.length === 0) {
    return (
      <div className="bg-surface-lowest border border-outline rounded-xl py-12 px-6 text-center">
        <EmptyIcon className="w-10 h-10 mx-auto text-neutral-400" strokeWidth={1.3} />
        <p className="text-body-2 text-neutral-500 mt-3">{emptyTitle}</p>
        {emptyHint && <p className="text-caption text-neutral-400 mt-1">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div className="bg-surface-lowest border border-outline rounded-xl overflow-hidden">
      {/* Column header row (desktop) — same grid as the rows below */}
      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_8rem_11rem_12rem] gap-3 items-center px-4 py-2.5 bg-surface border-b border-outline">
        <SortHeader
          label={columnName}
          active={sort.key === 'name'}
          direction={sort.direction}
          onClick={() => toggleSort('name')}
        />
        <SortHeader
          label={columnModified}
          active={sort.key === 'modified'}
          direction={sort.direction}
          onClick={() => toggleSort('modified')}
        />
        <SortHeader
          label={columnModifiedBy}
          active={sort.key === 'modifiedBy'}
          direction={sort.direction}
          onClick={() => toggleSort('modifiedBy')}
        />
        <span />
      </div>

      <ul className="flex flex-col">
        {sortedRows.map((row) => {
          const nameContent = row.href ? (
            <a
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-1 font-semibold text-neutral-900 block truncate hover:text-primary-600 hover:underline underline-offset-2 transition-colors"
            >
              {row.name}
            </a>
          ) : row.onOpen ? (
            <button
              type="button"
              onClick={row.onOpen}
              className="text-start text-body-1 font-semibold text-neutral-900 block truncate hover:text-primary-600 transition-colors"
            >
              {row.name}
            </button>
          ) : (
            <span className="text-body-1 font-semibold text-neutral-900 block truncate">
              {row.name}
            </span>
          );

          return (
            <li
              key={row.id}
              className="border-b border-outline last:border-b-0 hover:bg-surface-high transition-colors"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_8rem_11rem_12rem] sm:gap-3 sm:items-center">
                {/* Name — icon tile + name + caption */}
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${row.iconTile}`}
                  >
                    <row.icon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    {nameContent}
                    {row.secondary && (
                      <p className="text-caption text-neutral-400 truncate">{row.secondary}</p>
                    )}
                    {/* Mobile meta — Modified By + date under the name */}
                    <div className="sm:hidden mt-0.5 flex items-center gap-2 text-caption text-neutral-500 min-w-0">
                      <ModifiedBy user={row.modifiedBy} />
                      {row.modifiedAt && (
                        <span className="shrink-0">· {formatDate(row.modifiedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modified (desktop) */}
                <div className="hidden sm:block text-caption text-neutral-500 truncate">
                  {formatDate(row.modifiedAt)}
                </div>

                {/* Modified By (desktop) */}
                <div className="hidden sm:flex min-w-0">
                  <ModifiedBy user={row.modifiedBy} />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 flex-wrap shrink-0">
                  {row.openLabel && row.onDownload && (
                    <button
                      type="button"
                      onClick={row.onDownload}
                      className="flex items-center gap-1.5 px-3 h-8 bg-primary-600 text-white rounded-lg text-caption font-semibold hover:bg-primary-700 transition-colors"
                    >
                      {row.openIcon && <row.openIcon className="w-4 h-4" aria-hidden="true" />}
                      <span className="hidden md:inline">{row.openLabel}</span>
                    </button>
                  )}
                  {row.openLabel && !row.onDownload && row.href && (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 h-8 bg-primary-600 text-white rounded-lg text-caption font-semibold hover:bg-primary-700 transition-colors"
                    >
                      {row.openIcon && <row.openIcon className="w-4 h-4" aria-hidden="true" />}
                      <span className="hidden md:inline">{row.openLabel}</span>
                    </a>
                  )}
                  {row.openLabel && !row.onDownload && !row.href && row.onOpen && (
                    <button
                      type="button"
                      onClick={row.onOpen}
                      className="flex items-center gap-1.5 px-3 h-8 bg-primary-600 text-white rounded-lg text-caption font-semibold hover:bg-primary-700 transition-colors"
                    >
                      {row.openIcon && <row.openIcon className="w-4 h-4" aria-hidden="true" />}
                      <span className="hidden md:inline">{row.openLabel}</span>
                    </button>
                  )}
                  {row.onEdit && (
                    <button
                      type="button"
                      onClick={row.onEdit}
                      className="p-2 text-neutral-400 hover:text-primary-600 transition-colors"
                      title={row.editLabel}
                      aria-label={`${row.editLabel}: ${row.name}`}
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                  )}
                  {row.onDelete && (
                    <button
                      type="button"
                      onClick={row.onDelete}
                      className="p-2 text-neutral-400 hover:text-primary-600 transition-colors"
                      title={row.deleteLabel}
                      aria-label={`${row.deleteLabel}: ${row.name}`}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

