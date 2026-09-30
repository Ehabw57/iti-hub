const mongoose = require('mongoose');
const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const CommunityJoinRequest = require('../../models/CommunityJoinRequest');
const Notification = require('../../models/Notification');
const { updateMemberCount } = require('../../utils/communityHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
const { isSuperAdmin } = require('../../middlewares/checkRoles');
const { NOTIFICATION_TYPES } = require('../../utils/constants');

const USER_FIELDS = 'username fullName profilePicture';

/**
 * Can the requesting user moderate this community?
 * (owner/moderator of the community, or a platform super admin)
 */
const canModerate = (user, community) =>
  !!user && (isSuperAdmin(user) || community.isModerator(user._id));

/**
 * Approve or reject a community join request
 * PATCH /communities/join-requests/:id/decision
 * @route PATCH /communities/join-requests/:id/decision
 * @access Private (community owner/moderator or super admin)
 */
const decideCommunityJoinRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid request ID');
  }
  if (!['approved', 'rejected'].includes(decision)) {
    throw new ValidationError('decision must be "approved" or "rejected"');
  }

  const request = await CommunityJoinRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Join request');
  }

  if (request.status !== 'pending') {
    throw new ConflictError(`This request has already been ${request.status}`);
  }

  const community = await Community.findById(request.community);
  if (!community) {
    throw new NotFoundError('Community');
  }

  if (!canModerate(req.user, community)) {
    throw new ForbiddenError('Only community moderators can review join requests');
  }

  // Approval creates the membership (same effect as the old instant join)
  if (decision === 'approved') {
    const existing = await CommunityMember.findOne({
      user: request.user,
      community: community._id,
    });
    if (!existing) {
      await CommunityMember.create({
        user: request.user,
        community: community._id,
        role: 'member',
      });
      await updateMemberCount(community._id, 1);
    }
  }

  request.status = decision;
  request.decidedBy = req.user._id;
  request.decidedAt = new Date();
  await request.save();

  await request.populate('user', USER_FIELDS);

  // Notify the requester about the decision (fire-and-forget)
  try {
    await Notification.createOrUpdateNotification(
      request.user._id,
      req.user._id,
      decision === 'approved'
        ? NOTIFICATION_TYPES.COMMUNITY_JOIN_APPROVED
        : NOTIFICATION_TYPES.COMMUNITY_JOIN_REJECTED,
      community._id,
      community._id
    );
  } catch (e) {
    console.error('Failed to notify requester of community join decision:', e.message);
  }

  return sendSuccess(
    res,
    {
      request: {
        _id: request._id,
        status: request.status,
        requester: request.user,
        decidedAt: request.decidedAt,
      },
    },
    decision === 'approved'
      ? 'Join request approved'
      : 'Join request rejected'
  );
});

/**
 * Cancel a pending join request (by the requester)
 * DELETE /communities/join-requests/:id
 * @route DELETE /communities/join-requests/:id
 * @access Private (request owner)
 */
const cancelCommunityJoinRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid request ID');
  }

  const request = await CommunityJoinRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Join request');
  }

  if (request.user.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only cancel your own requests');
  }
  if (request.status !== 'pending') {
    throw new ConflictError(`This request has already been ${request.status}`);
  }

  await CommunityJoinRequest.findByIdAndDelete(id);
  return sendSuccess(res, { cancelled: true }, 'Join request cancelled');
});

/**
 * List a community's join requests (review queue)
 * GET /communities/:id/join-requests?status=pending|approved|rejected|all
 * @route GET /communities/:id/join-requests
 * @access Private (community owner/moderator or super admin)
 */
const listCommunityJoinRequests = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status = 'pending' } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  const community = await Community.findById(id);
  if (!community) {
    throw new NotFoundError('Community');
  }

  if (!canModerate(req.user, community)) {
    throw new ForbiddenError('Only community moderators can view join requests');
  }

  const query = { community: community._id };
  if (status && status !== 'all') {
    query.status = status;
  }

  const requests = await CommunityJoinRequest.find(query)
    .populate('user', USER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  const data = requests.map((r) => ({
    _id: r._id,
    status: r.status,
    requester: r.user,
    requestedAt: r.createdAt,
    decidedAt: r.decidedAt,
  }));

  return sendSuccess(res, { requests: data });
});

/**
 * Get the authenticated user's own join requests for legacy communities
 * (all statuses — powers the "pending" state on community pages)
 * GET /communities/join-requests/my
 * @route GET /communities/join-requests/my
 * @access Private
 */
const getMyCommunityJoinRequests = asyncHandler(async (req, res) => {
  const requests = await CommunityJoinRequest.find({ user: req.user._id })
    .populate('community', 'name profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  const data = requests.map((r) => ({
    _id: r._id,
    status: r.status,
    community: r.community,
    requestedAt: r.createdAt,
    decidedAt: r.decidedAt,
  }));

  return sendSuccess(res, { requests: data });
});

module.exports = {
  decideCommunityJoinRequest,
  cancelCommunityJoinRequest,
  listCommunityJoinRequests,
  getMyCommunityJoinRequests,
};