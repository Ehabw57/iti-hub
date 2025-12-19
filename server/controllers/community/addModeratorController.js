const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { canModerate, updateModeratorList } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Add moderator to community
 * POST /communities/:id/moderators
 * @route POST /communities/:id/moderators
 * @access Private (Owner/Moderator only)
 */
const addModerator = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
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
    throw new ForbiddenError('You must be a moderator or owner to add moderators');
  }

  // Check if target user is a member
  const membership = await CommunityMember.findOne({
    user: userId,
    community: id
  });

  if (!membership) {
    throw new ValidationError('User must be a member of the community to become a moderator');
  }

  // Check if already a moderator
  if (membership.role === 'moderator' || membership.role === 'owner') {
    return sendSuccess(res, {}, 'User is already a moderator');
  }

  // Update moderator list using helper
  await updateModeratorList(id, userId, 'add');

  // Update membership role
  membership.role = 'moderator';
  await membership.save();

  sendSuccess(res, {}, 'Moderator added successfully');
});

module.exports = addModerator;
