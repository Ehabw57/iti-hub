const Track = require('../../models/Track');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * List all training tracks with pagination & search
 * GET /courses/tracks
 * @access Public
 */
const listTracks = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const search = (req.query.search || '').trim();

  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [tracks, total] = await Promise.all([
    Track.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Track.countDocuments(filter),
  ]);

  const hasNextPage = skip + tracks.length < total;

  return sendSuccess(res, { tracks }, null, 200, {
    pagination: { page, limit, total, hasNextPage },
  });
});

module.exports = listTracks;
