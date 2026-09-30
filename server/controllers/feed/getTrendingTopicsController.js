const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');
const CommunityGroup = require('../../models/CommunityGroup');
const Post = require('../../models/Post');

/**
 * Trending ITI Topics — minimal activity aggregation for the Home feed
 * right rail (work order §6).
 *
 * Ranks post tags from the last 7 days by activity (posts + likes + comments),
 * with a fallback to the most-membered community groups when the window has
 * no tagged posts (fresh installs / quiet weeks).
 *
 * GET /feed/trending-topics?limit=5
 * @access Public (optional auth)
 */
const getTrendingTopics = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const tagStats = await Post.aggregate([
    { $match: { createdAt: { $gte: since }, tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        posts: { $sum: 1 },
        activity: { $sum: { $add: ['$likesCount', '$commentsCount', 1] } },
      },
    },
    { $sort: { activity: -1, posts: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        tag: '$_id',
        posts: 1,
        activity: 1,
      },
    },
  ]);

  let topics = tagStats;
  let source = 'posts';

  // Fallback: most-membered community groups keep the widget meaningful
  // when there are no recent tagged posts.
  if (topics.length === 0) {
    const groups = await CommunityGroup.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    topics = groups.map((g) => ({
      tag: g.specialization || g.name,
      posts: (g.memberIds || []).length,
      activity: (g.memberIds || []).length,
    }));
    source = 'groups';
  }

  return sendSuccess(res, { topics, source }, null, 200, { window: '7d' });
});

module.exports = getTrendingTopics;
