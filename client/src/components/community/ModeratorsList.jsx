import { FaShieldAlt, FaUserShield, FaCrown } from 'react-icons/fa';
import { AiOutlineUserDelete } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';
import { useNavigate } from 'react-router-dom';
import communityContent from '@content/community/community.content';
import { useRemoveModerator } from '@hooks/mutations/useCommunityMutations';
import useRequireAuth from '@hooks/useRequireAuth';

/**
 * ModeratorsList Component
 * Displays community moderators with management actions
 * Shows owners and moderators separately with role badges
 * Always visible without dropdown
 */
const ModeratorsList = ({ community }) => {
  const content = useIntlayer(communityContent.key);
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();

  // Mutations
  const removeModeratorMutation = useRemoveModerator(community?._id);

  const isOwner = community?.role === 'owner' || false;
  const isModerator = community?.role === 'moderator' || community?.role === 'owner' || false;

  const handleRemoveModerator = (userId) => {
    requireAuth(async () => {
      try {
        await removeModeratorMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error removing moderator:', err);
      }
    });
  };

  // Navigate to user profile
  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  // Combine owners and moderators for total count
  const ownersCount = community?.owners?.length || 0;
  const moderatorsCount = community?.moderators?.length || 0;
  const totalCount = ownersCount + moderatorsCount;

  // Only show if there are moderators/owners or if user is owner/moderator
  if (!isOwner && !isModerator && totalCount === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FaShieldAlt size={20} className="text-secondary-600" />
        <h2 className="text-heading-5 text-neutral-900 font-semibold">
          {content.moderators}
        </h2>
        <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 text-caption rounded-full font-medium">
          {totalCount}
        </span>
      </div>

      {/* Moderators List */}
      <div className="space-y-3">
        {/* Owners Section */}
        {ownersCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FaCrown size={14} className="text-red-600" />
                <h3 className="text-caption font-semibold text-neutral-700 uppercase tracking-wide">
                  {content.owners || 'Owners'}
                </h3>
              </div>
              {community?.owners?.map((owner) => (
                <div
                  key={owner._id}
                  onClick={() => handleUserClick(owner.username)}
                  className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center shrink-0">
                    {owner.profilePicture ? (
                      <img
                        src={owner.profilePicture}
                        alt={owner.fullName || owner.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {(owner.fullName || owner.username)?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-body-2 font-semibold text-neutral-900 truncate">
                      {owner.fullName || owner.username}
                    </p>
                    <div className="flex items-center gap-1 text-caption text-red-700">
                      <FaCrown size={12} />
                      <span>{content.owner}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Moderators Section */}
          {moderatorsCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FaUserShield size={14} className="text-secondary-600" />
                <h3 className="text-caption font-semibold text-neutral-700 uppercase tracking-wide">
                  {content.moderators}
                </h3>
              </div>
              {community?.moderators?.map((moderator) => (
                <div
                  key={moderator._id}
                  className="flex items-center gap-3 p-3 bg-neutral-200 rounded-lg hover:bg-neutral-300 transition-colors"
                >
                  {/* Clickable Area */}
                  <div 
                    onClick={() => handleUserClick(moderator.username)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center shrink-0">
                    {moderator.profilePicture ? (
                      <img
                        src={moderator.profilePicture}
                        alt={moderator.fullName || moderator.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {(moderator.fullName || moderator.username)?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-body-2 font-semibold text-neutral-900 truncate">
                      {moderator.fullName || moderator.username}
                    </p>
                    <div className="flex items-center gap-1 text-caption text-secondary-700">
                      <FaUserShield size={12} />
                      <span>{content.moderator}</span>
                    </div>
                  </div>
                  </div>

                  {/* Remove Button (Owner Only) */}
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveModerator(moderator._id);
                      }}
                      disabled={removeModeratorMutation.isPending}
                      className="p-2 rounded-lg hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={content.removeModerator}
                    >
                      <AiOutlineUserDelete size={16} className="text-error" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {totalCount === 0 && (
            <div className="text-center py-8">
              <FaShieldAlt size={48} className="text-neutral-300 mx-auto mb-3" />
              <p className="text-body-2 text-neutral-600">
                {content.noModerators || 'No moderators yet'}
              </p>
              {isOwner && (
                <p className="text-caption text-neutral-500 mt-2">
                  {content.addModeratorsHint || 'Add moderators from the members list below'}
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default ModeratorsList;
