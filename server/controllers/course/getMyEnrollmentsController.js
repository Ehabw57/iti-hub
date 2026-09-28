const Enrollment = require('../../models/Enrollment');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get the authenticated user's enrollments
 * GET /courses/my-enrollments
 * @access Private
 */
const getMyEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const enrollments = await Enrollment.find({ user_id: userId })
    .populate('track_id', 'name')
    .populate('branch_id', 'name')
    .sort({ enrolled_at: -1 })
    .lean();

  const data = enrollments.map((e) => ({
    _id: e._id,
    track: e.track_id,
    branch: e.branch_id,
    enrolled_at: e.enrolled_at,
  }));

  return sendSuccess(res, { enrollments: data }, null, 200, {
    total: data.length,
  });
});

module.exports = getMyEnrollments;
