const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { canModerate, updateModeratorList } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Remove moderator from community
 * DELETE /communities/:id/moderators/:userId
 * @route DELETE /communities/:id/moderators/:userId
 * @access Private (Owner/Moderator only)
 */
const removeModerator = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const requesterId = req.user._id;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  // Validate user ID
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid user ID');
  }

  // Find community
  const community = await Community.findById(id);
  
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Check if requester can moderate
  const canModerateResult = await canModerate(requesterId, id);
  if (!canModerateResult) {
    throw new ForbiddenError('You must be a moderator or owner to remove moderators');
  }

  // Check if target user is an owner (cannot remove owners)
  if (community.isOwner(userId)) {
    throw new ValidationError('Cannot remove community owners from moderators');
  }

  // Find membership
  const membership = await CommunityMember.findOne({
    user: userId,
    community: id
  });

  // If not a moderator, return success (idempotent)
  if (!membership || membership.role !== 'moderator') {
    return sendSuccess(res, {}, 'User is not a moderator');
  }

  // Update moderator list using helper
  await updateModeratorList(id, userId, 'remove');

  // Update membership role back to member
  membership.role = 'member';
  await membership.save();

  sendSuccess(res, {}, 'Moderator removed successfully');
});

module.exports = removeModerator;
