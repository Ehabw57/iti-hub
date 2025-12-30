const mongoose = require('mongoose');
const CommunityMember = require('../../models/CommunityMember');
const Community = require('../../models/Community');
const { updateMemberCount } = require('../../utils/communityHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Kick/Remove a member from the community
 * DELETE /communities/:id/members/:userId
 * @route DELETE /communities/:id/members/:userId
 * @access Private (Moderator/Owner only)
 */
const kickMember = asyncHandler(async (req, res) => {
  const { id: communityId, userId } = req.params;
  const currentUserId = req.user._id;

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    throw new ValidationError('Invalid community ID');
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid user ID');
  }

  // Check if community exists
  const community = await Community.findById(communityId);
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Cannot kick yourself
  if (userId === currentUserId.toString()) {
    throw new ForbiddenError('Cannot remove yourself. Use leave endpoint instead.');
  }

  // Get membership to be removed
  const membershipToRemove = await CommunityMember.findOne({
    user: userId,
    community: communityId
  });

  if (!membershipToRemove) {
    throw new NotFoundError('User is not a member of this community');
  }

  // Cannot kick owners
  if (membershipToRemove.role === 'owner') {
    throw new ForbiddenError('Cannot remove community owner');
  }

  // Get current user's role
  const currentUserRole = req.communityRole;

  // Only owners can kick moderators
  if (membershipToRemove.role === 'moderator' && currentUserRole !== 'owner') {
    throw new ForbiddenError('Only owners can remove moderators');
  }

  // Remove membership
  await CommunityMember.deleteOne({
    user: userId,
    community: communityId
  });

  // Decrement member count
  await updateMemberCount(communityId, -1);

  sendSuccess(res, {}, 'Member removed from community successfully');
});

module.exports = kickMember;
