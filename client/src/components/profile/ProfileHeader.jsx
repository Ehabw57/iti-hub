import { useState, useRef } from 'react';
import { FaCamera, FaUserPlus, FaBan } from 'react-icons/fa';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { useUploadProfilePicture, useUploadCoverImage } from '@hooks/mutations/useUserMutations';
import { useToggleFollow, useToggleBlock } from '@hooks/mutations/useConnectionMutations';
import { useAuthStore } from '@store/auth';
import useRequireAuth from '@hooks/useRequireAuth';
import EditProfile from './EditProfile';
import ConfirmDialog from '@components/common/ConfirmDialog';

const ProfileHeader = ({ profile, isOwnProfile }) => {
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
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
      toast.error(fileSizeError);
      return;
    }

    try {
      await uploadCoverMutation.mutateAsync(file);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(failedToUploadCover);
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(fileSizeError);
      return;
    }

    try {
      const result = await uploadProfileMutation.mutateAsync(file);
      if (result.data?.user) {
        setUser(result.data.user);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(failedToUploadProfilePicture);
    }
  };

  const handleFollow =  () => {
    requireAuth(async () => {
      try {
        await toggleFollow(profile._id, profile.isFollowing);
      } catch (error) {
        console.error('Failed to toggle follow:', error);
        toast.error(failedToUpdateFollowStatus);
      }
    });
  };

  const handleBlock =  () => {
   requireAuth(() => {
    setShowBlockConfirm(true);
   });
  };

  const handleConfirmBlock = async () => {
    try {
      await toggleBlock(profile._id, profile.isBlocked);
    } catch (error) {
      console.error('Failed to toggle block:', error);
      toast.error(failedToUpdateBlockStatus);
    }
  };

  return (
    <div className="bg-neutral-100 border border-outline shadow-elevation-1 rounded-2xl overflow-hidden mb-4">
      {/* Cover Image */}
      <div 
        className="relative h-44 bg-gradient-to-r from-neutral-900 via-primary-900 to-primary-700 group"
        onMouseEnter={() => isOwnProfile && setShowCoverUpload(true)}
        onMouseLeave={() => setShowCoverUpload(false)}
      >
        {profile?.coverImage ? (
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Decorative network pattern fallback */
          <>
            <span className="absolute top-6 ltr:left-[15%] rtl:right-[15%] w-24 h-24 rounded-full border border-white/10" />
            <span className="absolute bottom-4 ltr:left-[30%] rtl:right-[30%] w-32 h-32 rounded-full border-[14px] border-white/5" />
            <span className="absolute top-8 ltr:right-[20%] rtl:left-[20%] w-16 h-16 rounded-full bg-primary-500/10 blur-xl" />
          </>
        )}
        
        {/* Cover Upload Button - Only for own profile */}
        {isOwnProfile && showCoverUpload && (
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity"
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
        <div className="flex items-end justify-between -mt-14 mb-3">
          {/* Profile Picture */}
          <div 
            className="relative group"
            onMouseEnter={() => isOwnProfile && setShowProfileUpload(true)}
            onMouseLeave={() => setShowProfileUpload(false)}
          >
            <div className="w-28 h-28 rounded-2xl border-4 border-neutral-100 shadow-elevation-2 overflow-hidden bg-neutral-200">
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
                className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center"
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
          <div className="flex gap-2.5 mb-3">
            {isOwnProfile ? (
              // Own Profile Actions
              <button 
                onClick={() => setShowEditProfile(true)}
                className="px-5 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors font-semibold text-button shadow-elevation-1"
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
                    className={`px-5 py-2 rounded-full font-semibold text-button transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      profile?.isFollowing
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-elevation-1'
                    }`}
                  >
                    {isFollowLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {loading}
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="w-4 h-4" />
                        {profile?.isFollowing ? following : follow}
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={handleBlock}
                  disabled={isBlockLoading}
                  className={`px-5 py-2 rounded-full font-semibold text-button transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    profile?.isBlocked
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'border border-outline text-neutral-700 hover:bg-neutral-200/60'
                  }`}
                >
                  {isBlockLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {loading}
                    </>
                  ) : (
                    <>
                      <FaBan className="w-4 h-4" />
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
          <h1 className="text-heading-3 font-bold text-neutral-900 tracking-tight">
            {profile?.fullName}
          </h1>
          <p className="text-body-2 text-neutral-500">@{profile?.username}</p>
          
          {profile?.specialization && (
            <p className="text-body-1 font-semibold text-primary-600 mt-1">{profile.specialization}</p>
          )}
          
          {profile?.location && (
            <p className="text-body-2 text-neutral-500 mt-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {profile.location}
            </p>
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

      {/* Block Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleConfirmBlock}
        title={profile.isBlocked ? confirmUnblock : confirmBlock}
        message={profile.isBlocked 
          ? "Are you sure you want to unblock this user?" 
          : "Are you sure you want to block this user?"}
        variant="warning"
      />
    </div>
  );
};

export default ProfileHeader;
