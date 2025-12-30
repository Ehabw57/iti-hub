import { useParams } from 'react-router-dom';
import CommunityHeader from './CommunityHeader';
import CommunityInfo from './CommunityInfo';
import CommunityFeed from './CommunityFeed';
import { useCommunityDetails } from '@hooks/queries/useCommunity';
import {
  useJoinCommunity,
  useLeaveCommunity,
  useUpdateCommunity,
  useUpdateCommunityProfilePicture,
  useUpdateCommunityCoverImage,
} from '@hooks/mutations/useCommunityMutations';
import { useIntlayer } from 'react-intlayer';
import communityContent from '@content/community/community.content';

/**
 * Community Component - Main container for community page
 * Displays community header, info sidebar, and feed
 * Integrates all community API endpoints
 */
const Community = () => {
  const { communityId } = useParams();
  const  content  = useIntlayer(communityContent.key);

  // Fetch community details using custom hook
  const { data: community, isLoading, error } = useCommunityDetails(communityId);

  // Mutations hooks
  const joinMutation = useJoinCommunity(communityId);
  const leaveMutation = useLeaveCommunity(communityId);
  const updateMutation = useUpdateCommunity(communityId);
  const updateProfilePictureMutation = useUpdateCommunityProfilePicture(communityId);
  const updateCoverImageMutation = useUpdateCommunityCoverImage(communityId);

  // Handle join/leave community
  const handleJoinLeave = async () => {
    if (community?.isJoined) {
      await leaveMutation.mutateAsync();
    } else {
      await joinMutation.mutateAsync();
    }
  };

  // Handle update community details
  const handleUpdateCommunity = async (updates) => {
    await updateMutation.mutateAsync(updates);
  };

  // Handle profile picture update
  const handleProfilePictureUpdate = async (file) => {
    await updateProfilePictureMutation.mutateAsync(file);
  };

  // Handle cover image update
  const handleCoverImageUpdate = async (file) => {
    await updateCoverImageMutation.mutateAsync(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-body-1 text-neutral-600">{content.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center p-8 bg-neutral-100 rounded-lg shadow-elevation-2">
          <div className="text-error text-4xl mb-4">⚠️</div>
          <h2 className="text-heading-4 text-neutral-900 mb-2">{content.errorOccurred}</h2>
          <p className="text-body-2 text-neutral-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <p className="text-body-1 text-neutral-600">{content.communityNotFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Community Header - Part 1 */}
      <CommunityHeader
        community={community}
        isJoined={community?.isJoined || false}
        onJoinLeave={handleJoinLeave}
        onProfilePictureUpdate={handleProfilePictureUpdate}
        onCoverImageUpdate={handleCoverImageUpdate}
      />

      {/* Main Content - Parts 2 & 3 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Community Info Sidebar - Part 2 (Sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              <CommunityInfo
                community={community}
                onUpdateCommunity={handleUpdateCommunity}
              />
            </div>
          </div>

          {/* Community Feed - Part 3 */}
          <div className="lg:col-span-2">
            <CommunityFeed communityId={communityId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
