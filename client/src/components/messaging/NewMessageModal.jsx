import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlineXMark } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { useState } from 'react';
import Button from '@/components/common/Button';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useCreateConversation } from '@hooks/mutations/useCreateConversation';
import { useSearchUsers } from '@hooks/queries/useSearchUsers';

/**
 * @fileoverview Modal for creating new 1:1 conversation
 * Allows searching and selecting a user to start messaging
 */

/**
 * NewMessageModal - Create new direct conversation
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @returns {JSX.Element}
 */
export function NewMessageModal({ isOpen, onClose }) {
  const content = useIntlayer('messagesList');
  const [searchQuery, setSearchQuery] = useState('');
  
  const createConversation = useCreateConversation();
  
  // Search users with real API
  const { data: searchData, isLoading: isSearching } = useSearchUsers({
    query: searchQuery,
    limit: 20,
  });
  
  const searchResults = searchData?.data?.users || [];

  const handleSelectUser = (userId) => {
    createConversation.mutate(
      { participantId: userId },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-lg shadow-elevation-3">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <DialogTitle className="text-heading-5 font-semibold text-neutral-900">
              {content.newMessage.value}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
          </div>

          {/* Search Input */}
          <div className="px-6 py-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={content.searchPlaceholder.value}
              className="
                w-full px-4 py-2
                bg-neutral-100
                border border-transparent
                rounded-xl
                text-body-2
                placeholder:text-neutral-500
                focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white
                transition-colors
              "
              autoFocus
            />
            {isSearching && (
              <p className="mt-2 text-sm text-neutral-600">Searching...</p>
            )}
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="px-6 py-8 text-center text-neutral-600">
                {searchQuery
                  ? content.noConversations.value
                  : 'Search for users to start a conversation'}
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleSelectUser(user._id)}
                    disabled={createConversation.isPending}
                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    <UserAvatar
                      src={user.profilePicture}
                      alt={user.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-neutral-900 truncate">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-sm text-neutral-600 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-200">
            <Button variant="text" onClick={onClose}>
              {content.noConversations.value}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default NewMessageModal;
