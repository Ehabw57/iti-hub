import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';
import { useUpdateProfile } from '@hooks/mutations/useUserMutations';

const EditProfile = ({ profile, onClose }) => {
  const content = useIntlayer('profile');
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [errors, setErrors] = useState({});
  
  const updateProfileMutation = useUpdateProfile();

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = content.fullNameRequired || 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = content.fullNameTooShort || 'Full name must be at least 2 characters';
    } else if (fullName.trim().length > 50) {
      newErrors.fullName = content.fullNameTooLong || 'Full name must be less than 50 characters';
    }

    if (bio && bio.length > 500) {
      newErrors.bio = content.bioTooLong || 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const updatedData = {
        fullName: fullName.trim(),
        bio: bio.trim(),
      };

      await updateProfileMutation.mutateAsync(updatedData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrors({ 
        submit: error.response?.data?.message || content.failedToUpdateProfile || 'Failed to update profile'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-100 rounded-lg shadow-2xl w-full max-w-md z-[60]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-900">
            {content.editProfile}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-50 rounded-full transition-colors"
            type="button"
          >
            <FaTimes className="w-5 h-5 text-neutral-600 dark:text-neutral-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name Input */}
          <div>
            <label 
              htmlFor="fullName" 
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-700 mb-2"
            >
              {content.fullName || 'Full Name'}
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-white dark:text-neutral-900 ${
                errors.fullName 
                  ? 'border-red-500' 
                  : 'border-neutral-300 dark:border-neutral-300'
              }`}
              placeholder={content.fullNamePlaceholder || 'Enter your full name'}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Bio Input */}
          <div>
            <label 
              htmlFor="bio" 
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-700 mb-2"
            >
              {content.bio || 'Bio'}
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-white dark:text-neutral-900 ${
                errors.bio 
                  ? 'border-red-500' 
                  : 'border-neutral-300 dark:border-neutral-300'
              }`}
              placeholder={content.bioPlaceholder || 'Tell us about yourself'}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.bio && (
                <p className="text-sm text-red-600">{errors.bio}</p>
              )}
              <p className="text-sm text-neutral-500 dark:text-neutral-600 ml-auto">
                {bio.length}/500
              </p>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-300 text-neutral-700 dark:text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              {content.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                  {content.saving || 'Saving...'}
                </>
              ) : (
                content.save || 'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
