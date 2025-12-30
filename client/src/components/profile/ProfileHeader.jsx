import { useState, useRef } from 'react';
import { FaCamera, FaUserPlus, FaBan } from 'react-icons/fa';
import { useIntlayer } from 'react-intlayer';
import { useUploadProfilePicture, useUploadCoverImage } from '@hooks/mutations/useUserMutations';
import { useToggleFollow, useToggleBlock } from '@hooks/mutations/useConnectionMutations';
import { useAuthStore } from '@store/auth';
import useRequireAuth from '@hooks/useRequireAuth';
import EditProfile from './EditProfile';

const ProfileHeader = ({ profile, isOwnProfile }) => {
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const coverInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const { requireAuth } = useRequireAuth();
  
  const { 
    editProfile, follow, following, block, unblock, 
    updateCoverPhoto, fileSizeError, failedToUploadCover, 
    failedToUploadProfilePicture, failedToUpdateFollowStatus,
    failedToUpdateBlockStatus, confirmBlock, confirmUnblock, loading
  } = useIntlayer('profile');

  // Mutations
  const uploadProfileMutation = useUploadProfilePicture();
  const uploadCoverMutation = useUploadCoverImage();
  const { toggleFollow, isLoading: isFollowLoading } = useToggleFollow();
  const { toggleBlock, isLoading: isBlockLoading } = useToggleBlock();
  const setUser = useAuthStore((state) => state.setUser);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(fileSizeError);
      return;
    }

    try {
      await uploadCoverMutation.mutateAsync(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(failedToUploadCover);
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(fileSizeError);
      return;
    }

    try {
      const result = await uploadProfileMutation.mutateAsync(file);
      if (result.data?.user) {
        setUser(result.data.user);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(failedToUploadProfilePicture);
    }
  };

  const handleFollow =  () => {
    requireAuth(async () => {
      try {
        await toggleFollow(profile._id, profile.isFollowing);
      } catch (error) {
        console.error('Failed to toggle follow:', error);
        alert(failedToUpdateFollowStatus);
      }
    });
  };

  const handleBlock =  () => {
   requireAuth(async () => {
    const confirmed = window.confirm(
      profile.isBlocked ? confirmUnblock : confirmBlock
    );
    
    if (!confirmed) return;

    try {
      await toggleBlock(profile._id, profile.isBlocked);
    } catch (error) {
      console.error('Failed to toggle block:', error);
      alert(failedToUpdateBlockStatus);
    }});
  };

  return (
    <div className="bg-white dark:bg-neutral-100 shadow-sm rounded-lg overflow-hidden mb-4">
      {/* Cover Image */}
      <div 
        className="relative h-40 sm:h-48 md:h-56 bg-linear-to-r from-primary-500 to-primary-700 group"
        onMouseEnter={() => isOwnProfile && setShowCoverUpload(true)}
        onMouseLeave={() => setShowCoverUpload(false)}
      >
        {profile?.coverImage && (
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Cover Upload Button - Only for own profile */}
        {isOwnProfile && showCoverUpload && (
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity"
          >
            <div className="flex items-center gap-2 text-white">
              <FaCamera className="w-6 h-6" />
              <span className="font-medium">{updateCoverPhoto}</span>
            </div>
          </button>
        )}
        
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Profile Info Container */}
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-4 gap-4">
          {/* Profile Picture */}
          <div 
            className="relative group -mt-12 sm:-mt-16 z-10"
            onMouseEnter={() => isOwnProfile && setShowProfileUpload(true)}
            onMouseLeave={() => setShowProfileUpload(false)}
          >
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-neutral-100 shadow-lg overflow-hidden bg-neutral-200 dark:bg-neutral-200">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-4xl font-bold">
                  {profile?.fullName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Profile Picture Upload Button - Only for own profile */}
            {isOwnProfile && showProfileUpload && (
              <button
                onClick={() => profileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center"
              >
                <FaCamera className="w-8 h-8 text-white" />
              </button>
            )}

            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileUpload}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full mt-3 sm:mt-0 sm:flex-row sm:w-auto">
            {isOwnProfile ? (
              // Own Profile Actions
              <button 
                onClick={() => setShowEditProfile(true)}
                className="px-6 py-2 w-full sm:w-auto bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {editProfile}
              </button>
            ) : (
              // Other User Actions
              <>
                {/* Only show Follow button if user is NOT blocked */}
                {!profile?.isBlocked && (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`px-6 py-2 w-full sm:w-auto rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      profile?.isFollowing
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {isFollowLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {loading}
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="w-5 h-5" />
                        {profile?.isFollowing ? following : follow}
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={handleBlock}
                  disabled={isBlockLoading}
                  className={`px-6 py-2 w-full sm:w-auto rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    profile?.isBlocked
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {isBlockLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {loading}
                    </>
                  ) : (
                    <>
                      <FaBan className="w-5 h-5" />
                      {profile?.isBlocked ? unblock : block}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-900">
            {profile?.fullName}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-600">@{profile?.username}</p>
          
          {profile?.specialization && (
            <p className="text-neutral-700 dark:text-neutral-700 mt-1">{profile.specialization}</p>
          )}
          
          {profile?.location && (
            <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1">{profile.location}</p>
          )}

          {/* Verified Badge */}
          {profile?.isVerified && (
            <span className="inline-flex items-center gap-1 mt-2 text-primary-600 text-sm font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile 
          profile={profile} 
          onClose={() => setShowEditProfile(false)} 
        />
      )}
    </div>
  );
};

export default ProfileHeader;
