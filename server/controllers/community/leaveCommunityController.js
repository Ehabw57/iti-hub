const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { updateMemberCount } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Leave a community
 * POST /communities/:id/leave
 * @route POST /communities/:id/leave
 * @access Private
 */
const leaveCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  // Find community
  const community = await Community.findById(id);
  
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Check if user is a member
  const membership = await CommunityMember.findOne({
    user: userId,
    community: id
  });

  if (!membership) {
    return sendSuccess(res, {}, 'You are not a member of this community');
  }

  // Check if user is the only owner
  const isOwner = community.isOwner(userId);
  const ownerCount = community.owners.length;
  
  if (isOwner && ownerCount === 1) {
    throw new ValidationError('Cannot leave community as you are the only owner. Please transfer ownership first.');
  }

  // If user is a moderator, remove from moderators list
  if (membership.role === 'moderator') {
    community.moderators = community.moderators.filter(
      modId => modId.toString() !== userId.toString()
    );
    await community.save();
  }

  // Delete membership
  await CommunityMember.deleteOne({
    user: userId,
    community: id
  });

  // Decrement member count
  await updateMemberCount(id, -1);

  sendSuccess(res, {}, 'Successfully left the community');
});

module.exports = leaveCommunity;
