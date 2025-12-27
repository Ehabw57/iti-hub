import React from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { 
  HiEllipsisHorizontal, 
  HiBookmark, 
  HiOutlineBookmark,
  HiPencil,
  HiTrash,
  HiFlag
} from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer'

/**
 * PostMenu - Enhanced menu component with save/unsave, edit, delete actions
 * 
 * @component
 * @example
 * // Post menu for owner
 * <PostMenu
 *   isOwnPost={true}
 *   isSaved={false}
 *   onSave={handleSave}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * 
 * // Post menu for other users
 * <PostMenu
 *   isOwnPost={false}
 *   isSaved={true}
 *   onSave={handleUnsave}
 * />
 * 
 * @param {Object} props
 * @param {boolean} props.isOwnPost - Whether the current user owns this post
 * @param {boolean} [props.isSaved=false] - Whether post is saved by current user
 * @param {Function} props.onSave - Handler for save/unsave action
 * @param {Function} [props.onEdit] - Handler for edit action (owner only)
 * @param {Function} [props.onDelete] - Handler for delete action (owner only)
 * @param {Function} [props.onReport] - Handler for report action (non-owners)
 * @param {string} [props.className] - Additional CSS classes
 */
export function PostMenu({
  isOwnPost,
  isSaved = false,
  onSave,
  onEdit,
  onDelete,
  onReport,
  className = '',
}) {
  const content = useIntlayer('post-menu');

  return (
    <Menu as="div" className={`relative ${className}`}>
      <MenuButton className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
        <HiEllipsisHorizontal className="w-5 h-5 text-neutral-600" />
      </MenuButton>

      <MenuItems 
        anchor="bottom end"
        className="w-48 bg-neutral-100 rounded-lg shadow-elevation-2 border border-neutral-200 py-1 z-50 [--anchor-gap:4px]"
      >
        {/* Save/Unsave - Available to all users */}
        <MenuItem>
          {({ focus }) => (
            <button
              onClick={onSave}
              className={`w-full px-4 py-2 text-start text-body-2 flex items-center gap-3 ${
                focus ? 'bg-neutral-50' : ''
              }`}
            >
              {isSaved ? (
                <>
                  <HiBookmark className="w-5 h-5 text-primary-600" />
                  <span>{content.unsave}</span>
                </>
              ) : (
                <>
                  <HiOutlineBookmark className="w-5 h-5" />
                  <span>{content.save}</span>
                </>
              )}
            </button>
          )}
        </MenuItem>

        {/* Edit - Only for own posts */}
        {isOwnPost && onEdit && (
          <MenuItem>
            {({ focus }) => (
              <button
                onClick={onEdit}
                className={`w-full px-4 py-2 text-start text-body-2 flex items-center gap-3 ${
                  focus ? 'bg-neutral-50' : ''
                }`}
              >
                <HiPencil className="w-5 h-5" />
                <span>{content.editPost}</span>
              </button>
            )}
          </MenuItem>
        )}

        {/* Delete - Only for own posts */}
        {isOwnPost && onDelete && (
          <MenuItem>
            {({ focus }) => (
              <button
                onClick={onDelete}
                className={`w-full px-4 py-2 text-start text-body-2 flex items-center gap-3 text-red-600 ${
                  focus ? 'bg-neutral-50' : ''
                }`}
              >
                <HiTrash className="w-5 h-5" />
                <span>{content.deletePost}</span>
              </button>
            )}
          </MenuItem>
        )}

        {/* Report - For other users' posts */}
        {!isOwnPost && (
          <MenuItem>
            {({ focus }) => (
              <button
                onClick={onReport || (() => {/* TODO: Report functionality */})}
                className={`w-full px-4 py-2 text-start text-body-2 flex items-center gap-3 ${
                  focus ? 'bg-neutral-50' : ''
                }`}
              >
                <HiFlag className="w-5 h-5" />
                <span>{content.reportPost}</span>
              </button>
            )}
          </MenuItem>
        )}
      </MenuItems>
    </Menu>
  );
}
