const mongoose = require('mongoose');
const Track = require('../../models/Track');
const Branch = require('../../models/Branch');
const Enrollment = require('../../models/Enrollment');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get a single track with its branches & enrollment stats
 * GET /courses/tracks/:id
 * @access Public
 */
const getTrack = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid track ID');
  }

  const track = await Track.findById(id).lean();
  if (!track) {
    throw new NotFoundError('Track');
  }

  // Enrollment count per branch for this track
  const enrollmentStats = await Enrollment.aggregate([
    { $match: { track_id: track._id } },
    { $group: { _id: '$branch_id', count: { $sum: 1 } } },
  ]);

  // Get all branches (track-agnostic catalog; ITI branches are global)
  const branches = await Branch.find().sort({ name: 1 }).lean();

  const branchStatsMap = new Map(
    enrollmentStats.map((s) => [s._id.toString(), s.count])
  );

  const branchesWithStats = branches.map((branch) => ({
    ...branch,
    enrolledCount: branchStatsMap.get(branch._id.toString()) || 0,
  }));

  // If the user is authed, report their enrollment for this track
  let myEnrollment = null;
  if (req.user?._id) {
    myEnrollment = await Enrollment.findOne({
      user_id: req.user._id,
      track_id: track._id,
    })
      .populate('branch_id', 'name')
      .lean();
  }

  return sendSuccess(
    res,
    { track, branches: branchesWithStats, myEnrollment },
    null,
    200
  );
});

module.exports = getTrack;
