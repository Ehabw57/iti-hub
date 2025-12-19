const Connection = require('../../models/Connection');
const User = require('../../models/User');
const { buildConnectionList, batchCheckFollowing } = require('../../utils/connectionHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get User Followers
 * GET /users/:userId/followers
 * 
 * Returns paginated list of users who follow the specified user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFollowers = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  const requesterId = req.user?._id; // Optional authentication
  
  // Parse pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;
  
  // Check if target user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }
  
  // Get total count
  const totalCount = await Connection.countDocuments({
    following: targetUserId,
    type: 'follow'
  });
  
  // Get followers with pagination
  const connections = await Connection.find({
    following: targetUserId,
    type: 'follow'
  })
    .sort({ createdAt: -1 }) // Most recent followers first
    .skip(skip)
    .limit(limit)
    .populate('follower', 'username fullName profilePicture bio specialization followersCount followingCount createdAt')
    .lean();
  
  // Build follower list
  const followers = buildConnectionList(connections, 'follower', requesterId);
  
  // If requester is authenticated, batch check if they follow these users
  if (requesterId && followers.length > 0) {
    const followerIds = followers.map(f => f._id);
    const followingMap = await batchCheckFollowing(requesterId, followerIds);
    
    // Add isFollowing field to each follower
    followers.forEach(follower => {
      follower.isFollowing = followingMap.get(follower._id.toString());
    });
  }
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);
  
  sendSuccess(res, {
    followers,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

module.exports = getFollowers;
