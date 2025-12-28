import { useState } from 'react';
import { FaTimes, FaUsers } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';
import { useQueryClient } from '@tanstack/react-query';
import { useGetUserFollowing } from '@hooks/queries/useUserQueries';
import { useToggleFollow } from '@hooks/mutations/useConnectionMutations';
import { useAuthStore } from '@store/auth';
import useRequireAuth from '@hooks/useRequireAuth';
import UserListItem from './UserListItem';

const FollowingList = ({ userId, onClose }) => {
  const content = useIntlayer('profile');
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: followingData, isLoading } = useGetUserFollowing(userId);
  const { toggleFollow } = useToggleFollow();
  const [followingStates, setFollowingStates] = useState({});
  const { requireAuth } = useRequireAuth();

  const following = followingData?.data?.following || [];

  const handleFollowClick = (targetUserId, isFollowing) => {
    requireAuth(async () => {
      try {
        setFollowingStates(prev => ({ ...prev, [targetUserId]: true }));
        await toggleFollow(targetUserId, isFollowing);
        // Invalidate queries to refetch updated data
        queryClient.invalidateQueries(['userFollowing', userId]);
        queryClient.invalidateQueries(['userProfile']);
        setFollowingStates(prev => ({ ...prev, [targetUserId]: false }));
      } catch (error) {
        console.error('Failed to toggle follow:', error);
        setFollowingStates(prev => ({ ...prev, [targetUserId]: false }));
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-100 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col z-[60]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-900">
            {content.followingCount}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-50 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5 text-neutral-600 dark:text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AiOutlineLoading3Quarters className="w-10 h-10 text-primary-600 animate-spin mb-4" />
              <p className="text-neutral-600 dark:text-neutral-600">{content.loadingFollowing}</p>
            </div>
          ) : following.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-50 flex items-center justify-center mb-4">
                <FaUsers className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
              </div>
              <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-800 mb-2">
                {content.noFollowing}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-600">
                {content.noFollowingMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {following.map((user) => {
                const isOwnProfile = currentUser?._id === user._id;
                const isLoadingThis = followingStates[user._id];

                return (
                  <UserListItem
                    key={user._id}
                    user={user}
                    isOwnProfile={isOwnProfile}
                    isLoading={isLoadingThis}
                    onFollowClick={handleFollowClick}
                    onNavigate={onClose}
                    followButtonText={content.follow}
                    followingButtonText={content.following}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingList;
