import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineInfoCircle, AiOutlineEdit, AiOutlineSave, AiOutlineClose, AiOutlineUserAdd } from 'react-icons/ai';
import { FaUsers } from 'react-icons/fa';
import { useIntlayer } from 'react-intlayer';
import communityContent from '@content/community/community.content';
import { useAddModerator } from '@hooks/mutations/useCommunityMutations';
import useRequireAuth from '@hooks/useRequireAuth';
import ModeratorsList from './ModeratorsList';
import { TextContent } from '@/components/shared/TextContent';

/**
 * CommunityInfo Component - Part 2
 * Displays detailed community information, members, and moderators
 */
const CommunityInfo = ({ community, onUpdateCommunity }) => {
  const  content  = useIntlayer(communityContent.key);
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(community?.description || '');
  const [showMembers, setShowMembers] = useState(false);

  // Mutations
  const addModeratorMutation = useAddModerator(community?._id);

  const isOwner = community?.role === 'owner' || false;
  const isModerator = community?.role === 'moderator' || community?.role === 'owner' || false;

  const handleSaveDescription = () => {
    onUpdateCommunity({ description });
    setIsEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setDescription(community?.description || '');
    setIsEditingDescription(false);
  };

  const handleAddModerator = async (userId) => {
    requireAuth(async () => {
      try {
        await addModeratorMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error adding moderator:', err);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* About Section */}
      <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AiOutlineInfoCircle size={20} className="text-primary-600" />
            <h2 className="text-heading-5 text-neutral-900 font-semibold">
              {content.aboutCommunity}
            </h2>
          </div>
          {isOwner && !isEditingDescription && (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="p-2 rounded-lg hover:bg-neutral-200 transition-colors"
              title={content.editDescription}
            >
              <AiOutlineEdit size={18} className="text-neutral-600" />
            </button>
          )}
        </div>

        {isEditingDescription ? (
          <div className="space-y-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 bg-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-body-2 resize-none"
              rows={4}
              placeholder={content.descriptionPlaceholder}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDescription}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-button"
              >
                <AiOutlineSave size={16} />
                <span>{content.savee}</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-button"
              >
                <AiOutlineClose size={16} />
                <span>{content.cancel}</span>
              </button>
            </div>
          </div>
        ) : (
          community?.description ? (
            <TextContent
              content={community.description}
              maxWords={30}
              className="text-body-2 text-neutral-700 leading-relaxed"
            />
          ) : (
            <p className="text-body-2 text-neutral-700 leading-relaxed">
              {content.noDescription}
            </p>
          )
        )}

        {/* Community Stats */}
        <div className="mt-6 pt-6 border-t border-neutral-200 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-heading-4 text-primary-600 font-bold">
              {community?.memberCount || 0}
            </div>
            <div className="text-caption text-neutral-600 mt-1">{content.members}</div>
          </div>
          <div className="text-center">
            <div className="text-heading-4 text-secondary-600 font-bold">
              {community?.postCount || 0}
            </div>
            <div className="text-caption text-neutral-600 mt-1">{content.posts}</div>
          </div>
        </div>

        {/* Created Date */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-caption text-neutral-600">
            {content.createdAt}{' '}
            <span className="font-medium">
              {new Date(community?.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
        </div>
      </div>

      {/* Moderators Section */}
      <ModeratorsList community={community} />

      {/* Members Section */}
      <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <FaUsers size={20} className="text-primary-600" />
            <h2 className="text-heading-5 text-neutral-900 font-semibold">{content.membersTitle}</h2>
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-caption rounded-full">
              {community?.memberCount || 0}
            </span>
          </div>
        </button>

        {showMembers && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {community?.members?.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 p-3 bg-neutral-200 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                {/* Clickable Area */}
                <div 
                  onClick={() => navigate(`/profile/${member.username}`)}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.fullName || member.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {(member.fullName || member.username)?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-body-2 font-medium text-neutral-900">
                    {member.fullName || member.username}
                  </p>
                  <p className="text-caption text-neutral-600">{member.email}</p>
                </div>
                </div>
                {(isOwner || isModerator) && member.role === 'member' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddModerator(member._id);
                    }}
                    className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                    title={content.makeModerator}
                  >
                    <AiOutlineUserAdd size={16} className="text-secondary-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityInfo;
