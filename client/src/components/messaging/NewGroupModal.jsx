import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlineXMark } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useCreateGroupConversation } from '@hooks/mutations/useCreateGroupConversation';
import { useSearchUsers } from '@hooks/queries/useSearchUsers';

/**
 * @fileoverview Modal for creating new group conversation
 * Allows setting group name, selecting members, and uploading group image
 */

/**
 * NewGroupModal - Create new group conversation
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @returns {JSX.Element}
 */
export function NewGroupModal({ isOpen, onClose }) {
  const content = useIntlayer('conversationDetail');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const createGroup = useCreateGroupConversation();
  
  // Search users with real API
  const { data: searchData, isLoading: isSearching } = useSearchUsers({
    query: searchQuery,
    limit: 20,
  });
  
  const searchResults = searchData?.data?.users || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Toggle user selection
  const toggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  // Handle form submission
  const onSubmit = (data) => {
    if (selectedUsers.length < 2) {
      alert('Please select at least 2 members');
      return;
    }

    createGroup.mutate(
      {
        name: data.groupName,
        participantIds: selectedUsers.map((u) => u._id),
        image: selectedImage,
      },
      {
        onSuccess: () => {
          reset();
          setSelectedUsers([]);
          setSelectedImage(null);
          setImagePreview(null);
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
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <DialogTitle className="text-heading-5 font-semibold text-neutral-900">
                {content.editGroup.value}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Group Image */}
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Group"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-neutral-500">📷</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer text-secondary-600 hover:text-secondary-700 font-medium text-sm">
                  Upload group photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Group Name */}
              <div>
                <Input
                  label={content.groupName.value}
                  {...register('groupName', {
                    required: 'Group name is required',
                    minLength: {
                      value: 2,
                      message: 'Group name must be at least 2 characters',
                    },
                  })}
                  error={errors.groupName?.message}
                  placeholder="Enter group name"
                />
              </div>

              {/* Search Members */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  {content.addMembers.value}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
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
                />
                {isSearching && (
                  <p className="mt-2 text-sm text-neutral-600">Searching...</p>
                )}
              </div>

              {/* Selected Members */}
              {selectedUsers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-neutral-900 mb-2">
                    Selected ({selectedUsers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-2 px-3 py-1 bg-secondary-50 text-secondary-700 rounded-full"
                      >
                        <span className="text-sm">{user.username}</span>
                        <button
                          type="button"
                          onClick={() => toggleUser(user)}
                          className="text-secondary-700 hover:text-secondary-900"
                        >
                          <HiOutlineXMark className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border-t border-neutral-200 pt-4">
                  <p className="text-sm font-medium text-neutral-900 mb-2">
                    Search Results
                  </p>
                  <div className="space-y-2">
                    {searchResults.map((user) => {
                      const isSelected = selectedUsers.find((u) => u._id === user._id);
                      return (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => toggleUser(user)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                          <UserAvatar
                            src={user.profilePicture}
                            alt={user.username}
                            size="sm"
                          />
                          <span className="text-sm text-neutral-900">
                            {user.username}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-200">
              <Button type="button" variant="text" onClick={onClose}>
                {content.cancel.value}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createGroup.isPending}
                disabled={selectedUsers.length < 2 || createGroup.isPending}
              >
                Create Group
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default NewGroupModal;
