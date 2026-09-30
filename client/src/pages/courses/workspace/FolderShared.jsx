import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

/**
 * Shared folder chrome for the workspace Files / Records tabs (reissued work
 * order §1): the SharePoint-style breadcrumb toolbar and the small dialog
 * used for creating / renaming folders. Both tabs render identical folder
 * rows inside ContentTable, so the surrounding UI lives here once.
 */

/**
 * Breadcrumb ("Files / Folder name") + manager action buttons.
 *
 * @param {string} rootLabel - Breadcrumb root label ("Files" / "Records")
 * @param {object|null} folder - The folder currently open (null = root view)
 * @param {Function} onNavigateRoot - Back-to-root handler
 * @param {ReactNode} [actions] - Manager buttons rendered on the trailing side
 */
export function WorkspaceToolbar({ rootLabel, folder, onNavigateRoot, actions }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
      <nav aria-label={rootLabel} className="flex items-center gap-1.5 min-w-0 text-body-2">
        <button
          type="button"
          onClick={onNavigateRoot}
          disabled={!folder}
          className={`flex items-center gap-1 min-w-0 transition-colors ${
            folder
              ? 'text-neutral-500 hover:text-primary-600'
              : 'font-semibold text-neutral-900'
          }`}
        >
          {folder && (
            <HiOutlineChevronLeft
              className="w-3.5 h-3.5 shrink-0 rtl:rotate-180"
              aria-hidden="true"
            />
          )}
          <span className="truncate">{rootLabel}</span>
        </button>
        {folder && (
          <>
            <HiOutlineChevronRight
              className="w-3.5 h-3.5 shrink-0 text-neutral-400 rtl:rotate-180"
              aria-hidden="true"
            />
            <span className="font-semibold text-neutral-900 truncate">{folder.name}</span>
          </>
        )}
      </nav>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Small one-input dialog for creating / renaming a folder. The input resets
 * every time the dialog opens (create starts empty, rename starts from the
 * current name).
 */
export function NameDialog({
  isOpen,
  onClose,
  title,
  label,
  initialValue = '',
  submitLabel,
  cancelLabel = 'Cancel',
  pending = false,
  onSubmit,
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm bg-neutral-100 rounded-lg shadow-elevation-3 p-6">
          <DialogTitle className="text-heading-6 font-bold text-neutral-900 mb-4">
            {title}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={label}
              aria-label={label}
              autoFocus
              className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-9 border border-outline text-neutral-600 rounded-xl text-sm hover:bg-surface-high transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                disabled={pending || !value.trim()}
                className="px-4 h-9 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitLabel}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
