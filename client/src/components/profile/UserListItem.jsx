import { Link } from 'react-router-dom';
import { FaUserPlus } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';

const UserListItem = ({ 
  user, 
  isOwnProfile, 
  isLoading, 
  onFollowClick, 
  onNavigate,
  followButtonText,
  followingButtonText
}) => {
  const content = useIntlayer('profile');

  return (
    <div className="flex items-center justify-between gap-3">
      {/* User Info */}
      <Link
        to={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 hover:bg-neutral-50 dark:hover:bg-neutral-50 p-2 rounded-lg transition-colors"
        onClick={onNavigate}
      >
        {/* Profile Picture */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-200 shrink-0">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-lg font-bold">
              {user.fullName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Name and Username */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 dark:text-neutral-900 truncate">
            {user.fullName}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-600 truncate">
            @{user.username}
          </p>
        </div>
      </Link>

      {/* Follow Button */}
      {!isOwnProfile && (
        <button
          onClick={() => onFollowClick(user._id, user.isFollowing)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
            user.isFollowing
              ? 'bg-neutral-200 dark:bg-neutral-200 text-neutral-700 dark:text-neutral-700 hover:bg-neutral-300'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <FaUserPlus className="w-4 h-4" />
              {user.isFollowing ? followingButtonText : followButtonText}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default UserListItem;
