const Enrollment = require('../../models/Enrollment');
const EnrollmentRequest = require('../../models/EnrollmentRequest');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Check the authenticated user's enrollment status for a track
 * GET /tracks/check-enrollment?trackId=...
 * @access Private
 */
const checkEnrollment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { trackId } = req.query;

  if (!trackId) {
    return sendSuccess(res, { isEnrolled: false, pendingRequest: null, enrollments: [] }, null, 200);
  }

  const [enrollments, pendingRequest] = await Promise.all([
    Enrollment.find({ user_id: userId, track_id: trackId })
      .populate('branch_id', 'name')
      .lean(),
    EnrollmentRequest.findOne({ user_id: userId, track_id: trackId, status: 'pending' })
      .select('_id branch_id createdAt')
      .populate('branch_id', 'name')
      .lean(),
  ]);

  const data = enrollments.map((e) => ({
    _id: e._id,
    branch: e.branch_id,
    enrolled_at: e.enrolled_at,
  }));

  return sendSuccess(
    res,
    {
      isEnrolled: enrollments.length > 0,
      pendingRequest: pendingRequest
        ? {
            _id: pendingRequest._id,
            branch: pendingRequest.branch_id,
            requestedAt: pendingRequest.createdAt,
          }
        : null,
      enrollments: data,
    },
    null,
    200
  );
});

module.exports = checkEnrollment;
