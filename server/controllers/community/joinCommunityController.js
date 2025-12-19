const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { updateMemberCount } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendCreated, sendSuccess } = require('../../utils/responseHelpers');

/**
 * Join a community
 * POST /communities/:id/join
 * @route POST /communities/:id/join
 * @access Private
 */
const joinCommunity = asyncHandler(async (req, res) => {
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

  // Check if already a member
  const existingMembership = await CommunityMember.findOne({
    user: userId,
    community: id
  });

  if (existingMembership) {
    return sendSuccess(res, {}, 'You are already a member of this community');
  }

  // Create membership
  await CommunityMember.create({
    user: userId,
    community: id,
    role: 'member'
  });

  // Increment member count
  await updateMemberCount(id, 1);

  sendCreated(res, {}, 'Successfully joined the community');
});

module.exports = joinCommunity;
