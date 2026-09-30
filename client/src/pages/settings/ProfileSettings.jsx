import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useSettingsUpdateProfile } from '@hooks/mutations/useCourseMutations';
import { useUploadProfilePicture, useUploadCoverImage } from '@hooks/mutations/useUserMutations';
import { useAuthStore } from '@/store/auth';
import settingsContent from '@/content/settings/settings.content';

export default function ProfileSettings({ user }) {
  const content = useIntlayer(settingsContent.key);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [location, setLocation] = useState(user?.location || '');

  const updateProfileMutation = useSettingsUpdateProfile();
  const uploadProfileMutation = useUploadProfilePicture();
  const uploadCoverMutation = useUploadCoverImage();

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updates = {};
      if (fullName.trim()) updates.fullName = fullName.trim();
      if (bio !== undefined) updates.bio = bio.trim();
      if (specialization) updates.specialization = specialization.trim();
      if (location) updates.location = location.trim();

      const result = await updateProfileMutation.mutateAsync(updates);
      if (result.data?.data) {
        setUser(result.data.data);
      }
      toast.success(content.saveSuccess.value);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    try {
      const result = await uploadProfileMutation.mutateAsync(file);
      if (result.data?.user) setUser(result.data.user);
    } catch {
      toast.error('Failed to upload');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    try {
      await uploadCoverMutation.mutateAsync(file);
    } catch {
      toast.error('Failed to upload');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-high border border-outline">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-bold">
              {user?.fullName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="profilePictureUpload"
            className="inline-block px-4 py-2 bg-surface-lowest border border-outline text-neutral-700 rounded-lg cursor-pointer hover:bg-surface-low transition-colors text-sm font-medium"
          >
            Change photo
          </label>
          <input
            id="profilePictureUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileUpload}
          />
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label htmlFor="coverUpload" className="block text-sm font-medium text-neutral-700 mb-2">
          Cover Image
        </label>
        <label
          htmlFor="coverUpload"
          className="inline-block px-4 py-2 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-200 transition-colors text-sm font-medium"
        >
          Upload cover
        </label>
        <input
          id="coverUpload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="settingsFullName" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.fullName.value}
        </label>
        <input
          id="settingsFullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={content.fullNamePlaceholder.value}
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="settingsBio" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.bio.value}
        </label>
        <textarea
          id="settingsBio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder={content.bioPlaceholder.value}
          className="w-full px-3 py-2 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 resize-none"
        />
        <p className="text-caption text-neutral-400 mt-1">{bio.length}/500</p>
      </div>

      {/* Specialization */}
      <div>
        <label htmlFor="settingsSpec" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.specialization.value}
        </label>
        <input
          id="settingsSpec"
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder={content.specializationPlaceholder.value}
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="settingsLocation" className="block text-sm font-medium text-neutral-700 mb-2">
          {content.location.value}
        </label>
        <input
          id="settingsLocation"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={content.locationPlaceholder.value}
          className="w-full h-11 px-3 rounded-lg border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {updateProfileMutation.isPending && (
            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
          )}
          {updateProfileMutation.isPending ? content.saving.value : content.save.value}
        </button>
      </div>
    </form>
  );
}
