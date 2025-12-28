import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { FaShieldAlt, FaUsers, FaCrown, FaUserPlus, FaUserMinus, FaArrowLeft } from 'react-icons/fa';
import { AiOutlineUserAdd, AiOutlineUserDelete } from 'react-icons/ai';
import { useIntlayer } from 'react-intlayer';
import communityContent from '@content/community/community.content';
import { useCommunityDetails, useCommunityMembersInfinite } from '@hooks/queries/useCommunity';
import { useAddModerator, useRemoveModerator } from '@hooks/mutations/useCommunityMutations';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import useRequireAuth from '@hooks/useRequireAuth';

/**
 * CommunityManagement Page
 * Management dashboard for community moderators and owners
 * Only accessible by moderators and owners
 */
const CommunityManagement = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const content = useIntlayer(communityContent.key);
  const { requireAuth } = useRequireAuth();
  
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'moderators'
  const [selectedRole, setSelectedRole] = useState('all'); // 'all' | 'member' | 'moderator' | 'owner'

  // Fetch community details to check role
  const { data: community, isLoading: loadingCommunity } = useCommunityDetails(communityId);

  // Fetch members with infinite scroll
  const {
    data: membersData,
    isLoading: loadingMembers,
    error: membersError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useCommunityMembersInfinite(communityId, {
    limit: 20,
    role: selectedRole === 'all' ? undefined : selectedRole
  });

  // Mutations
  const addModeratorMutation = useAddModerator(communityId);
  const removeModeratorMutation = useRemoveModerator(communityId);

  // Infinite scroll observer
  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Flatten members from pages
  const members = membersData?.pages?.flatMap(page => page.members) || [];

  // Check if user has access (must be owner or moderator)
  const isOwner = community?.role === 'owner';
  const isModerator = community?.role === 'moderator' || community?.role === 'owner';

  // Handle add moderator
  const handleAddModerator = (userId) => {
    requireAuth(async () => {
      try {
        await addModeratorMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error adding moderator:', err);
      }
    });
  };

  // Handle remove moderator
  const handleRemoveModerator = (userId) => {
    requireAuth(async () => {
      try {
        await removeModeratorMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error removing moderator:', err);
      }
    });
  };

  // Navigate to member profile
  const handleMemberClick = (username) => {
    navigate(`/profile/${username}`);
  };

  // Loading state
  if (loadingCommunity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-body-1 text-neutral-600">{content.loading}</p>
        </div>
      </div>
    );
  }

  // Access denied - redirect to community page
  if (!isModerator) {
    return <Navigate to={`/communities/${communityId}`} replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-100 border-b border-neutral-200 shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/communities/${communityId}`)}
                className="p-2 rounded-lg hover:bg-neutral-200 transition-colors"
                aria-label="Back to community"
              >
                <FaArrowLeft size={20} className="text-neutral-700" />
              </button>
              <div>
                <h1 className="text-heading-3 text-neutral-900 font-bold flex items-center gap-2">
                  <FaShieldAlt className="text-secondary-600" />
                  {content.manageCommunity || 'Manage Community'}
                </h1>
                <p className="text-body-2 text-neutral-600 mt-1">
                  {community?.name}
                </p>
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-caption font-semibold">
                <FaCrown size={14} />
                <span>{content.owner || 'Owner'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <FaUsers size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="text-caption text-neutral-600">{content.totalMembers || 'Total Members'}</p>
                <p className="text-heading-4 text-neutral-900 font-bold">{community?.memberCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                <FaShieldAlt size={24} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-caption text-neutral-600">{content.moderators || 'Moderators'}</p>
                <p className="text-heading-4 text-neutral-900 font-bold">{community?.moderators?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <FaCrown size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-caption text-neutral-600">{content.owners || 'Owners'}</p>
                <p className="text-heading-4 text-neutral-900 font-bold">{community?.owners?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-body-2 font-semibold text-neutral-700">
              {content.filterByRole || 'Filter by Role'}:
            </span>
            <div className="flex gap-2">
              {['all', 'member', 'moderator', 'owner'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg text-button font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-primary-600 text-white shadow-elevation-1'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {role === 'all' ? content.all || 'All' : 
                   role === 'member' ? content.members || 'Members' :
                   role === 'moderator' ? content.moderators || 'Moderators' :
                   content.owners || 'Owners'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-6">
          <h2 className="text-heading-5 text-neutral-900 font-semibold mb-4 flex items-center gap-2">
            <FaUsers size={20} className="text-primary-600" />
            {content.membersManagement || 'Members Management'}
            <span className="text-caption text-neutral-600 font-normal">
              ({members.length} {content.shown || 'shown'})
            </span>
          </h2>

          {loadingMembers && members.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : membersError ? (
            <div className="text-center py-8 text-error">
              {content.errorLoadingMembers || 'Error loading members'}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-neutral-600">
              {content.noMembers || 'No members found'}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-4 bg-neutral-200 rounded-lg hover:bg-neutral-300 transition-colors"
                >
                  {/* Clickable Area */}
                  <div 
                    onClick={() => handleMemberClick(member.username)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={member.fullName || member.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-lg font-bold">
                          {(member.fullName || member.username)?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-1 font-semibold text-neutral-900 truncate">
                        {member.fullName || member.username}
                      </p>
                      <p className="text-caption text-neutral-600">@{member.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-caption font-medium ${
                          member.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                          member.role === 'moderator' ? 'bg-secondary-100 text-secondary-700' :
                          'bg-neutral-300 text-neutral-700'
                        }`}>
                          {member.role === 'owner' ? '👑 ' : member.role === 'moderator' ? '🛡️ ' : ''}
                          {member.role}
                        </span>
                        <span className="text-caption text-neutral-500">
                          {content.joined || 'Joined'}: {new Date(member.joinedAt).toLocaleDateString('ar-EG', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Owner Only) */}
                  {isOwner && member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      {member.role === 'member' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddModerator(member._id);
                          }}
                          disabled={addModeratorMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-button"
                          title={content.makeModerator}
                        >
                          <AiOutlineUserAdd size={16} />
                          <span className="hidden sm:inline">{content.makeModerator || 'Make Moderator'}</span>
                        </button>
                      ) : member.role === 'moderator' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveModerator(member._id);
                          }}
                          disabled={removeModeratorMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-button"
                          title={content.removeModerator}
                        >
                          <AiOutlineUserDelete size={16} />
                          <span className="hidden sm:inline">{content.removeModerator || 'Remove Moderator'}</span>
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}

              {/* Infinite Scroll Trigger */}
              {hasNextPage && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-body-2">{content.loadingMore || 'Loading more...'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityManagement;
