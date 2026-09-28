import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlineXMark, HiOutlineTrash, HiOutlineCamera } from 'react-icons/hi2';
import { useIntlayer, useLocale } from 'react-intlayer';
import toast from 'react-hot-toast';
import { UserAvatar } from '@/components/user/UserAvatar';
import Button from '@/components/common/Button';
import {
  useUpdateGroup,
  useAddGroupMember,
  useRemoveGroupMember,
  useLeaveGroup,
  useDeleteGroup,
} from '@hooks/mutations/useConversationMutations';
import { useSearchUsers } from '@hooks/queries/useSearchUsers';
import { Chip } from '@components/common';

/**
 * @fileoverview Group settings panel for group conversations (admin controls)
 *
 * Features:
 * - Rename group (admin)
 * - Change group photo (admin)
 * - Member list with remove-member action (admin)
 * - Add members via user search (admin)
 * - Leave group (any member; admin role auto-transfers server-side)
 * - Delete group with confirmation (admin)
 */

/**
 * GroupSettingsModal — settings panel for a group conversation
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.conversation - Conversation object (formatted)
 * @param {string} props.currentUserId - Current user ID
 * @returns {JSX.Element}
 */
export function GroupSettingsModal({ isOpen, onClose, conversation, currentUserId }) {
  const content = useIntlayer('conversationDetail');
  const { locale } = useLocale();
  const [name, setName] = useState(conversation?.name || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState(null);

  // Admin search state (add-member picker)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const isAdmin =
    !!currentUserId && String(conversation?.admin?._id) === String(currentUserId);

  // Mutations
  const updateGroup = useUpdateGroup();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  // Reset local state when the modal opens with a fresh conversation
  useEffect(() => {
    if (isOpen) {
      setName(conversation?.name || '');
      setImageFile(null);
      setImagePreview(null);
      setConfirmDeleteOpen(false);
      setConfirmRemoveUser(null);
      setSearchQuery('');
      setDebouncedSearch('');
    }
  }, [isOpen, conversation]);

  // Debounce admin user search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search users (only for admins picking new members)
  const { data: searchData, isLoading: isSearching } = useSearchUsers({
    query: debouncedSearch,
    limit: 20,
  });

  const memberIds = new Set(
    (conversation?.participants || []).map((p) => String(p._id))
  );

  const searchResults = (searchData?.data?.users || []).filter(
    (user) => !memberIds.has(user._id)
  );

  // Handlers

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(content.invalidImageType.value);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name || !name.trim()) {
      toast.error(content.groupName.value);
      return;
    }

    updateGroup.mutate(
      {
        conversationId: conversation._id,
        name: name.trim(),
        image: imageFile || undefined,
      },
      {
        onSuccess: () => {
          setImageFile(null);
          setImagePreview(null);
        },
      }
    );
  };

  const handleAddMember = (user) => {
    addMember.mutate({
      conversationId: conversation._id,
      userId: user._id,
    });
    setSearchQuery('');
  };

  const handleRemoveMember = (user) => {
    removeMember.mutate(
      {
        conversationId: conversation._id,
        userId: user._id,
      },
      {
        onSuccess: () => {
          setConfirmRemoveUser(null);
        },
      }
    );
  };

  const handleLeave = () => {
    leaveGroup.mutate(conversation._id);
    onClose();
  };

  const handleDelete = () => {
    deleteGroup.mutate(conversation._id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Panel container — scrollable on small screens */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
        <DialogPanel className="w-full max-w-md bg-neutral-50 rounded-2xl shadow-elevation-3 border border-outline flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline shrink-0">
            <DialogTitle className="text-heading-6 text-neutral-900">
              {content.groupSettingsTitle.value}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={content.cancel.value}
              className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-surface-high rounded-lg transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-6">
            {/* Photo + name (admin editable; read-only for members) */}
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={imagePreview || conversation?.image}
                      alt={conversation?.name}
                      size="lg"
                      className="ring-2 ring-surface-lowest"
                    />
                    <label
                      htmlFor="group-photo-input"
                      className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors"
                      aria-label={content.changePhoto.value}
                    >
                      <HiOutlineCamera className="w-4 h-4" />
                      <input
                        id="group-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="group-name-input"
                      className="block text-sm font-medium text-neutral-900 mb-1"
                    >
                      {content.groupName.value}
                    </label>
                    <input
                      id="group-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={updateGroup.isPending}
                      className="w-full h-11 px-3 py-2.5 rounded-md border border-neutral-200 hover:border-neutral-300 text-neutral-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 disabled:bg-neutral-100 disabled:text-neutral-500"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  loading={updateGroup.isPending}
                  disabled={
                    updateGroup.isPending ||
                    (name === conversation?.name && !imageFile)
                  }
                  className="w-full"
                >
                  {content.saveChanges.value}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <UserAvatar
                  src={conversation?.image}
                  alt={conversation?.name}
                  size="lg"
                  className="ring-2 ring-surface-lowest"
                />
                <h3 className="text-heading-6 text-neutral-900 truncate">
                  {conversation?.name}
                </h3>
              </div>
            )}

            {/* Add members (admin only) */}
            {isAdmin && (
              <div>
                <p className="text-sm font-medium text-neutral-900 mb-2">
                  {content.addMembers.value}
                </p>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={content.searchMembersPlaceholder.value}
                  className="w-full h-11 px-3 py-2.5 rounded-md border border-neutral-200 hover:border-neutral-300 text-neutral-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600"
                />

                {/* Search results — existing members hidden */}
                {isSearching && debouncedSearch.length >= 2 && (
                  <p className="mt-2 text-body-2 text-neutral-500">...</p>
                )}
                {!isSearching && debouncedSearch.length >= 2 && searchResults.length === 0 && (
                  <p className="mt-2 text-body-2 text-neutral-500">
                    {content.noResultsFound.value}
                  </p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-56 overflow-y-auto no-scrollbar">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleAddMember(user)}
                        disabled={addMember.isPending}
                        className="w-full flex items-center gap-3 p-2 hover:bg-surface-high rounded-lg transition-colors disabled:opacity-50"
                      >
                        <UserAvatar
                          src={user.profilePicture}
                          alt={user.username}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1 text-start">
                          <span className="block text-sm text-neutral-900 truncate">
                            {user.fullName || user.username}
                          </span>
                          <span className="block text-caption text-neutral-500 truncate">
                            @{user.username}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members list */}
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-2">
                {content.members[locale]({
                  count: (conversation?.participants || []).length,
                })}
              </p>
              <div className="space-y-1">
                {(conversation?.participants || []).map((participant) => {
                  const isSelf = String(participant._id) === String(currentUserId);
                  const isGroupAdmin =
                    String(conversation?.admin?._id) === String(participant._id);
                  return (
                    <div
                      key={participant._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-high transition-colors"
                    >
                      <UserAvatar
                        src={participant.profilePicture}
                        alt={participant.username}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 truncate">
                          {participant.fullName || participant.username}
                          {isSelf && (
                            <span className="text-neutral-500">
                              {' '}
                              ({content.you.value})
                            </span>
                          )}
                        </p>
                        <p className="text-caption text-neutral-500 truncate">
                          @{participant.username}
                        </p>
                      </div>
                      {isGroupAdmin && (
                        <Chip size="xs" className="shrink-0">
                          {content.adminBadge.value}
                        </Chip>
                      )}
                      {isAdmin && !isSelf && !isGroupAdmin && (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveUser(participant)}
                          aria-label={content.removeMember.value}
                          disabled={removeMember.isPending}
                          className="p-2 text-neutral-500 hover:text-error rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer — leave / delete actions */}
          <div className="px-6 py-4 border-t border-outline shrink-0">
            {/* Delete-group confirmation (admin) */}
            {isAdmin && confirmDeleteOpen ? (
              <div className="space-y-3">
                <p className="text-body-2 text-neutral-900">
                  {content.confirmDeleteGroup.value}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => setConfirmDeleteOpen(false)}
                    disabled={deleteGroup.isPending}
                  >
                    {content.cancel.value}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="!bg-error hover:!bg-red-700"
                    onClick={handleDelete}
                    loading={deleteGroup.isPending}
                    disabled={deleteGroup.isPending}
                  >
                    {content.confirmDelete.value}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={leaveGroup.isPending}
                  className="text-body-2 font-semibold text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
                >
                  {content.leaveGroup.value}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={deleteGroup.isPending || leaveGroup.isPending}
                    className="text-body-2 font-semibold text-error hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    {content.deleteGroupAction.value}
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogPanel>
      </div>

      {/* Remove-member confirmation (nested dialog) */}
      {confirmRemoveUser && (
        <Dialog
          open={!!confirmRemoveUser}
          onClose={() => setConfirmRemoveUser(null)}
          className="relative z-60"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-sm bg-neutral-50 rounded-2xl shadow-elevation-3 border border-outline p-6">
              <p className="text-body-1 text-neutral-900">
                {content.confirmRemoveMember[locale]({
                  user: confirmRemoveUser.fullName || confirmRemoveUser.username,
                })}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="text"
                  onClick={() => setConfirmRemoveUser(null)}
                  disabled={removeMember.isPending}
                >
                  {content.cancel.value}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleRemoveMember(confirmRemoveUser)}
                  loading={removeMember.isPending}
                  disabled={removeMember.isPending}
                >
                  {content.confirm.value}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}

export default GroupSettingsModal;

