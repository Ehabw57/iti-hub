/**
 * Admin Statistics Controller
 * Provides platform-wide statistics and analytics for the admin dashboard
 */
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const Community = require('../../models/Community');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Build date filter for MongoDB queries
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Object} MongoDB date filter
 */
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
};

/**
 * GET /admin/statistics/overview
 * Get platform overview statistics
 */
const getOverviewStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      adminUsers,
      totalCommunities,
      totalPosts,
      totalComments
    ] = await Promise.all([
      User.countDocuments(dateFilter),
      User.countDocuments({ ...dateFilter, isBlocked: false }),
      User.countDocuments({ ...dateFilter, isBlocked: true }),
      User.countDocuments({ ...dateFilter, role: 'admin' }),
      Community.countDocuments(dateFilter),
      Post.countDocuments(dateFilter),
      Comment.countDocuments(dateFilter)
    ]);

    return sendSuccess(res, {
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        admins: adminUsers
      },
      communities: {
        total: totalCommunities
      },
      posts: {
        total: totalPosts
      },
      comments: {
        total: totalComments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/statistics/registrations
 * Get new user registrations over time
 */
const getRegistrationStats = async (req, res, next) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const formatMap = {
      day: '%Y-%m-%d',
      week: '%Y-W%V',
      month: '%Y-%m'
    };

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: {
            $dateToString: { 
              format: formatMap[interval] || formatMap.day, 
              date: '$createdAt' 
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      }
    ];

    const registrations = await User.aggregate(pipeline);

    return sendSuccess(res, { registrations });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/statistics/growth
 * Get growth trends for users, posts, communities
 */
const getGrowthStats = async (req, res, next) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const formatMap = {
      day: '%Y-%m-%d',
      week: '%Y-W%V',
      month: '%Y-%m'
    };

    const format = formatMap[interval] || formatMap.day;

    const aggregationPipeline = (model) => [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } }
    ];

    const [users, posts, communities] = await Promise.all([
      User.aggregate(aggregationPipeline()),
      Post.aggregate(aggregationPipeline()),
      Community.aggregate(aggregationPipeline())
    ]);

    return sendSuccess(res, { users, posts, communities });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/statistics/tags
 * Get most used tags
 */
const getTagStats = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1
        }
      }
    ];

    const tags = await Post.aggregate(pipeline);

    return sendSuccess(res, { tags });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/statistics/active-users
 * Get most active users by posts/comments
 */
const getActiveUsers = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10, sortBy = 'combined' } = req.query;

    const matchStage = { isBlocked: false };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Get users with their posts count
    const users = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'author',
          as: 'userComments'
        }
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          profilePicture: 1,
          postsCount: 1,
          commentsCount: { $size: '$userComments' },
          combined: { $add: ['$postsCount', { $size: '$userComments' }] }
        }
      },
      { $sort: { [sortBy === 'posts' ? 'postsCount' : sortBy === 'comments' ? 'commentsCount' : 'combined']: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          username: 1,
          fullName: 1,
          profilePicture: 1,
          postsCount: 1,
          commentsCount: 1
        }
      }
    ]);

    return sendSuccess(res, { users });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/statistics/active-communities
 * Get most active communities
 */
const getActiveCommunities = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const communities = await Community.find(matchStage)
      .select('name profilePicture memberCount postCount createdAt')
      .sort({ postCount: -1 })
      .limit(parseInt(limit));

    return sendSuccess(res, { communities });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/statistics/online-users
 * Get currently online users (isOnline: true)
 */
const getOnlineUsers = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const [onlineUsers, totalOnline] = await Promise.all([
      User.find({ isOnline: true, isBlocked: false })
        .select('username fullName profilePicture lastSeen')
        .sort({ lastSeen: -1 })
        .limit(parseInt(limit)),
      User.countDocuments({ isOnline: true, isBlocked: false })
    ]);

    return sendSuccess(res, { 
      onlineUsers,
      totalOnline
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStats,
  getRegistrationStats,
  getGrowthStats,
  getTagStats,
  getActiveUsers,
  getActiveCommunities,
  getOnlineUsers
};
