const mongoose = require('mongoose');
const EnrollmentRequest = require('../../models/EnrollmentRequest');
const Enrollment = require('../../models/Enrollment');
const Track = require('../../models/Track');
const Branch = require('../../models/Branch');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, ConflictError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated } = require('../../utils/responseHelpers');
const { canUploadToTrack, isSuperAdmin, SUPER_ADMIN_ROLES } = require('../../middlewares/checkRoles');

const REQUESTER_FIELDS = 'username fullName profilePicture role';

/**
 * Collect the manager user ids that should be notified about a track's
 * enrollment requests: the track's assigned admin, the track's instructors
 * and the branch admin of the track's branch, plus platform super admins
 * so a request is never orphaned. Deduplicated, sender excluded.
 */
async function collectTrackManagerIds(track, excludeUserId) {
  const ids = new Set();
  const push = (id) => {
    if (id) ids.add(String(id));
  };

  push(track.adminId);
  (track.instructorIds || []).forEach(push);

  if (track.branchId) {
    const branchAdmins = await User.find({ role: 'branch_admin', branchId: track.branchId })
      .select('_id')
      .lean();
    branchAdmins.forEach((a) => push(a._id));
  }

  // SUPER_ADMIN_ROLES includes the legacy "admin" role (treated as a platform
  // super admin everywhere else), so notifications reach accounts created
  // with either role — a request is never orphaned from the main admins.
  const superAdmins = await User.find({ role: { $in: SUPER_ADMIN_ROLES } })
    .select('_id')
    .lean();
  superAdmins.forEach((a) => push(a._id));

  if (excludeUserId) ids.delete(String(excludeUserId));
  return [...ids];
}

/**
 * Approve a request into full membership: create the Enrollment row and
 * sync Track.studentIds + User.trackIds — the same membership sync the old
 * instant-enroll controller performed, now gated behind manager approval.
 */
async function approveIntoMembership(request, track, decidedBy) {
  const enrollment = await Enrollment.create({
    user_id: request.user_id,
    track_id: request.track_id,
    branch_id: request.branch_id,
  });

  track.studentIds.addToSet(request.user_id);
  await track.save();
  await User.updateOne({ _id: request.user_id }, { $addToSet: { trackIds: track._id } });

  request.status = 'approved';
  request.decidedBy = decidedBy;
  request.decidedAt = new Date();
  await request.save();

  return enrollment;
}

/**
 * Request enrollment in a track (replaces the old instant-enroll endpoint)
 * POST /tracks/enroll-requests
 * Body: { trackId, branchId }
 * @access Private
 */
const createEnrollmentRequest = asyncHandler(async (req, res) => {
  const { trackId, branchId } = req.body;
  const userId = req.user._id;

  if (!trackId || !branchId) {
    throw new ValidationError('trackId and branchId are required');
  }
  if (!mongoose.Types.ObjectId.isValid(trackId) || !mongoose.Types.ObjectId.isValid(branchId)) {
    throw new ValidationError('Invalid trackId or branchId');
  }

  const [track, branch] = await Promise.all([
    Track.findById(trackId),
    Branch.findById(branchId).lean(),
  ]);
  if (!track) throw new NotFoundError('Track');
  if (!branch) throw new NotFoundError('Branch');

  // A track belongs to exactly one branch in the hierarchy
  if (track.branchId && track.branchId.toString() !== branchId.toString()) {
    throw new ValidationError('This track is not offered at the selected branch');
  }

  // Already a member → nothing to request
  if (track.studentIds.some((id) => id.toString() === userId.toString())) {
    throw new ConflictError('You are already enrolled in this track');
  }

  const existingEnrollment = await Enrollment.findOne({ user_id: userId, track_id: trackId });
  if (existingEnrollment) {
    throw new ConflictError('You are already enrolled in this track');
  }

  // One pending request per user+track (the partial unique index also enforces this)
  const existingPending = await EnrollmentRequest.findOne({
    user_id: userId,
    track_id: trackId,
    status: 'pending',
  });
  if (existingPending) {
    throw new ConflictError('You already have a pending enrollment request for this track');
  }

  const request = await EnrollmentRequest.create({
    user_id: userId,
    track_id: trackId,
    branch_id: branchId,
  });

  await request.populate([
    { path: 'user_id', select: REQUESTER_FIELDS },
    { path: 'branch_id', select: 'name' },
  ]);

  // Notify every track manager about the new request (fire-and-forget)
  try {
    const managerIds = await collectTrackManagerIds(track, userId);
    for (const managerId of managerIds) {
      await Notification.createOrUpdateNotification(
        managerId,
        userId,
        NOTIFICATION_TYPES.ENROLLMENT_REQUEST,
        track._id,
        track._id
      );
    }
  } catch (e) {
    console.error('Failed to notify track managers of enrollment request:', e.message);
  }

  return sendCreated(
    res,
    {
      request: {
        _id: request._id,
        status: request.status,
        track: { _id: track._id, name: track.name },
        branch: request.branch_id,
        requestedAt: request.createdAt,
      },
    },
    'Enrollment request submitted'
  );
});

/**
 * Decide on an enrollment request (approve or reject)
 * PATCH /tracks/enroll-requests/:id/decision
 * Body: { decision: 'approved' | 'rejected' }
 * @access Private (track instructors, branch admin, super admin — first decision wins)
 */
const decideEnrollmentRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid request ID');
  if (!['approved', 'rejected'].includes(decision)) {
    throw new ValidationError('decision must be "approved" or "rejected"');
  }

  const request = await EnrollmentRequest.findById(id);
  if (!request) throw new NotFoundError('Enrollment request');

  if (request.status !== 'pending') {
    throw new ConflictError(`This request has already been ${request.status}`);
  }

  const track = await Track.findById(request.track_id);
  if (!track) throw new NotFoundError('Track');

  // Reviewers: the track's instructor(s), branch admin, super admin, track admin
  if (!canUploadToTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to review this track\'s requests');
  }

  if (decision === 'approved') {
    await approveIntoMembership(request, track, req.user._id);
  } else {
    request.status = 'rejected';
    request.decidedBy = req.user._id;
    request.decidedAt = new Date();
    await request.save();
  }

  await request.populate([
    { path: 'user_id', select: REQUESTER_FIELDS },
    { path: 'branch_id', select: 'name' },
  ]);

  // Notify the requester about the decision (fire-and-forget)
  try {
    await Notification.createOrUpdateNotification(
      request.user_id._id,
      req.user._id,
      decision === 'approved'
        ? NOTIFICATION_TYPES.ENROLLMENT_APPROVED
        : NOTIFICATION_TYPES.ENROLLMENT_REJECTED,
      track._id,
      track._id
    );
  } catch (e) {
    console.error('Failed to notify requester of enrollment decision:', e.message);
  }

  return sendSuccess(
    res,
    {
      request: {
        _id: request._id,
        status: request.status,
        requester: request.user_id,
        branch: request.branch_id,
        decidedAt: request.decidedAt,
      },
    },
    decision === 'approved'
      ? 'Enrollment request approved'
      : 'Enrollment request rejected'
  );
});

/**
 * Cancel a pending enrollment request (by the requester)
 * DELETE /tracks/enroll-requests/:id
 * @access Private (request owner)
 */
const cancelEnrollmentRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid request ID');

  const request = await EnrollmentRequest.findById(id);
  if (!request) throw new NotFoundError('Enrollment request');

  if (request.user_id.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only cancel your own requests');
  }
  if (request.status !== 'pending') {
    throw new ConflictError(`This request has already been ${request.status}`);
  }

  await EnrollmentRequest.findByIdAndDelete(id);
  return sendSuccess(res, { cancelled: true }, 'Enrollment request cancelled');
});

/**
 * Get the authenticated user's enrollment requests (all statuses)
 * GET /tracks/my-enroll-requests
 * @access Private
 */
const getMyEnrollmentRequests = asyncHandler(async (req, res) => {
  const requests = await EnrollmentRequest.find({ user_id: req.user._id })
    .populate('track_id', 'name category')
    .populate('branch_id', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const data = requests.map((r) => ({
    _id: r._id,
    status: r.status,
    track: r.track_id,
    branch: r.branch_id,
    requestedAt: r.createdAt,
    decidedAt: r.decidedAt,
  }));

  return sendSuccess(res, { requests: data }, null, 200, { total: data.length });
});

/**
 * List enrollment requests for a track (reviewers' queue)
 * GET /tracks/:trackId/enroll-requests?status=pending|approved|rejected|all
 * @access Private (track instructors, branch admin, super admin, track admin)
 */
const listTrackEnrollmentRequests = asyncHandler(async (req, res) => {
  const track = req.track;

  if (!canUploadToTrack(req.user, track)) {
    throw new ForbiddenError('You do not have permission to review this track\'s requests');
  }

  const { status = 'pending' } = req.query;
  const filter = { track_id: track._id };
  if (['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }

  const requests = await EnrollmentRequest.find(filter)
    .populate('user_id', REQUESTER_FIELDS)
    .populate('branch_id', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { requests }, null, 200, { total: requests.length });
});

/**
 * List enrollment requests across every track the caller manages (admin panel)
 * GET /tracks/enroll-requests?status=pending|approved|rejected|all
 * Role scoping:
 *  - super admin / legacy admin : every request on the platform
 *  - branch admin               : requests for tracks in their own branch
 *  - instructor                 : requests for tracks they teach
 * @access Private (super admin, branch admin, instructor)
 */
const listAllEnrollmentRequests = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const filter = {};

  if (['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }

  if (isSuperAdmin(req.user)) {
    // Platform-wide queue — no additional scoping (filter stays status-only).
  } else if (req.user.role === 'branch_admin') {
    const branchTracks = await Track.find({ branchId: req.user.branchId })
      .select('_id')
      .lean();
    filter.track_id = { $in: branchTracks.map((t) => t._id) };
  } else if (req.user.role === 'instructor') {
    const myTracks = await Track.find({ instructorIds: req.user._id })
      .select('_id')
      .lean();
    filter.track_id = { $in: myTracks.map((t) => t._id) };
  } else {
    throw new ForbiddenError('You do not have permission to review enrollment requests');
  }

  const requests = await EnrollmentRequest.find(filter)
    .populate('user_id', REQUESTER_FIELDS)
    .populate('track_id', 'name category')
    .populate('branch_id', 'name location')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { requests }, null, 200, { total: requests.length });
});

module.exports = {
  createEnrollmentRequest,
  decideEnrollmentRequest,
  cancelEnrollmentRequest,
  getMyEnrollmentRequests,
  listTrackEnrollmentRequests,
  listAllEnrollmentRequests,
};