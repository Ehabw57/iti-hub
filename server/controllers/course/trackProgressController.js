const mongoose = require('mongoose');
const TrackItemReview = require('../../models/TrackItemReview');
const CourseFile = require('../../models/CourseFile');
const CourseVideo = require('../../models/CourseVideo');
const Track = require('../../models/Track');
const User = require('../../models/User');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Mark a file or video as reviewed (toggle)
 * POST /courses/tracks/:trackId/reviews
 * Body: { itemId, itemType: 'file' | 'video' }
 * @access Private (track members)
 */
const toggleReview = asyncHandler(async (req, res) => {
  const track = req.track;
  const { itemId, itemType } = req.body;

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    throw new ValidationError('Valid itemId is required');
  }
  if (!['file', 'video'].includes(itemType)) {
    throw new ValidationError('itemType must be "file" or "video"');
  }

  // Verify the item belongs to this track
  const Model = itemType === 'file' ? CourseFile : CourseVideo;
  const item = await Model.findOne({ _id: itemId, trackId: track._id });
  if (!item) throw new NotFoundError(itemType === 'file' ? 'File' : 'Video');

  const existing = await TrackItemReview.findOne({
    trackId: track._id,
    userId: req.user._id,
    itemId,
    itemType,
  });

  if (existing) {
    await TrackItemReview.findByIdAndDelete(existing._id);
    return sendSuccess(res, { reviewed: false }, 'Review removed');
  }

  await TrackItemReview.create({
    trackId: track._id,
    userId: req.user._id,
    itemId,
    itemType,
  });

  return sendSuccess(res, { reviewed: true }, 'Marked as reviewed');
});

/**
 * Get the current user's reviewed item ids for a track
 * GET /courses/tracks/:trackId/my-reviews
 * @access Private (track members)
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const { trackId } = req.params;

  const reviews = await TrackItemReview.find({
    trackId,
    userId: req.user._id,
  }).lean();

  const reviewedIds = reviews.map((r) => String(r.itemId));
  return sendSuccess(res, { reviewedIds });
});

/**
 * Get the track leaderboard (students ranked by reviewed item count)
 * GET /courses/tracks/:trackId/leaderboard
 * @access Private (track members)
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(trackId)) throw new ValidationError('Invalid track ID');

  const track = await Track.findById(trackId).lean();
  if (!track) throw new NotFoundError('Track');

  // Total reviewable items in the track (files + videos)
  const [fileCount, videoCount] = await Promise.all([
    CourseFile.countDocuments({ trackId }),
    CourseVideo.countDocuments({ trackId }),
  ]);
  const totalItems = fileCount + videoCount;

  // Aggregate review counts per student
  const stats = await TrackItemReview.aggregate([
    { $match: { trackId: new mongoose.Types.ObjectId(trackId) } },
    { $group: { _id: '$userId', reviewedCount: { $sum: 1 } } },
    { $sort: { reviewedCount: -1 } },
  ]);

  const studentIds = (track.studentIds || []).map(String);
  const statMap = new Map(stats.map((s) => [String(s._id), s.reviewedCount]));

  // Build leaderboard from track's students (so zero-progress students appear too)
  const users = await User.find({ _id: { $in: track.studentIds || [] } })
    .select('username fullName profilePicture')
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const leaderboard = studentIds
    .map((id) => {
      const user = userMap.get(id);
      if (!user) return null;
      const reviewedCount = statMap.get(id) || 0;
      return {
        user,
        reviewedCount,
        progressPercent: totalItems > 0 ? Math.round((reviewedCount / totalItems) * 100) : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.reviewedCount - a.reviewedCount);

  return sendSuccess(res, { leaderboard, totalItems });
});

module.exports = {
  toggleReview,
  getMyReviews,
  getLeaderboard,
};