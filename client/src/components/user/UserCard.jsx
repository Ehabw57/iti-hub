import { useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import Button from '@/components/common/Button';
import { useAuthStore } from '@store/auth';
import { useFollowUser, useUnfollowUser } from '@hooks/mutations/useConnectionMutations';
import useRequireAuth from '@hooks/useRequireAuth';

/**
 * UserCard Component
 * Displays user information in three size variants: small, medium, large
 * 
 * @param {Object} props
 * @param {Object} props.user - User object with fields from User model
 * @param {string} props.size - Size variant: 'small' | 'medium' | 'large'
 * @returns {JSX.Element}
 * 
 * @example
 * <UserCard user={user} size="medium" />
 */
const UserCard = ({ user, size = 'small' }) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { requireAuth } = useRequireAuth();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  if (!user) return null;

  const {
    _id,
    username,
    fullName,
    profilePicture,
    bio,
    specialization,
    isFollowing,
  } = user;

  const isOwnProfile = currentUser?._id === _id;

  const handleFollowToggle = (e) => {
    e.stopPropagation();
    requireAuth(() => {
      if (isFollowing) {
        unfollowUser.mutate(_id);
      } else {
        followUser.mutate(_id);
      }
    });
  };

  const handleCardClick = () => {
    navigate(`/profile/${username}`);
  };

  // Large size variant
  if (size === 'large') {
    return (
      <div 
        className="user-card--large rounded-xl shadow-elevation-2 bg-neutral-50 p-6 max-w-xl cursor-pointer hover:shadow-elevation-3 transition-shadow"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          <UserAvatar
            src={profilePicture}
            alt={fullName}
            size="xl"
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-heading-4 text-neutral-900 truncate">{fullName}</h3>
                <p className="text-body-2 text-neutral-600 truncate">@{username}</p>
                {specialization && (
                  <span className="inline-block mt-1 bg-secondary-100 text-secondary-700 text-caption px-2 py-0.5 rounded-full">
                    {specialization}
                  </span>
                )}
              </div>
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? 'outline' : 'primary'}
                  size="small"
                  onClick={handleFollowToggle}
                  disabled={followUser.isPending || unfollowUser.isPending}
                  className="shrink-0"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
            {bio && (
              <p className="text-body-2 text-neutral-700 mt-3 line-clamp-2">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Medium size variant
  if (size === 'medium') {
    return (
      <div 
        className="user-card--medium rounded-lg shadow-elevation-1 bg-neutral-50 p-4 cursor-pointer hover:shadow-elevation-2 transition-shadow"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3">
          <UserAvatar
            src={profilePicture}
            alt={fullName}
            size="lg"
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-heading-5 text-neutral-900 truncate">{fullName}</h4>
                <p className="text-body-2 text-neutral-600 truncate">@{username}</p>
                {specialization && (
                  <span className="inline-block mt-1 bg-secondary-100 text-secondary-700 text-caption px-2 py-0.5 rounded-full">
                    {specialization}
                  </span>
                )}
              </div>
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? 'outline' : 'primary'}
                  size="small"
                  onClick={handleFollowToggle}
                  disabled={followUser.isPending || unfollowUser.isPending}
                  className="shrink-0"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
            {bio && (
              <p className="text-body-2 text-neutral-700 mt-2 line-clamp-1">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Small size variant
  return (
    <div 
      className="user-card--small rounded-md shadow-elevation-1 bg-neutral-50 p-3 flex items-center gap-3 cursor-pointer hover:shadow-elevation-2 transition-shadow max-w-xs"
      onClick={handleCardClick}
    >
      <UserAvatar
        src={profilePicture}
        alt={fullName}
        size="md"
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-body-2 text-neutral-900 truncate font-medium">{fullName}</p>
        <p className="text-caption text-neutral-600 truncate">@{username}</p>
      </div>
    </div>
  );
};

export default UserCard;
