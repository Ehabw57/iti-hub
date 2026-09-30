const mongoose = require('mongoose');
const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const CommunityJoinRequest = require('../../models/CommunityJoinRequest');
const Notification = require('../../models/Notification');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');
const { NOTIFICATION_TYPES } = require('../../utils/constants');

/**
 * Request to join a community (creates a pending request for review)
 * POST /communities/:id/join
 * @route POST /communities/:id/join
 * @access Private
 *
 * Round 3 work order §4: joining goes through the pending-request flow —
 * an owner/moderator must approve the request before the requester becomes
 * a member (mirrors the specialization-group join flow).
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

  // Already a member — nothing to request
  const existingMembership = await CommunityMember.findOne({
    user: userId,
    community: id,
  });

  if (existingMembership) {
    throw new ConflictError('You are already a member of this community');
  }

  // One pending request per user per community (unique partial index also guards this)
  const existingPending = await CommunityJoinRequest.findOne({
    user: userId,
    community: community._id,
    status: 'pending',
  });
  if (existingPending) {
    throw new ConflictError('You already have a pending request for this community');
  }

  // Create the pending request
  const request = await CommunityJoinRequest.create({
    user: userId,
    community: community._id,
  });

  // Notify the community's owners and moderators (fire-and-forget)
  const reviewerIds = [
    ...(community.owners || []),
    ...(community.moderators || []),
  ];
  for (const reviewerId of reviewerIds) {
    try {
      await Notification.createOrUpdateNotification(
        reviewerId,
        userId,
        NOTIFICATION_TYPES.COMMUNITY_JOIN_REQUEST,
        community._id,
        community._id
      );
    } catch (e) {
      console.error('Failed to notify community moderator of join request:', e.message);
    }
  }

  sendCreated(
    res,
    { request: { _id: request._id, status: request.status } },
    'Join request sent — waiting for approval'
  );
});

module.exports = joinCommunity;
