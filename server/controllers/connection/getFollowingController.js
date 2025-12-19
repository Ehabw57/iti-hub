const Connection = require('../../models/Connection');
const User = require('../../models/User');
const { buildConnectionList, batchCheckFollowing } = require('../../utils/connectionHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get User Following
 * GET /users/:userId/following
 * 
 * Returns paginated list of users that the specified user follows
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFollowing = asyncHandler(async (req, res) => {
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
    follower: targetUserId,
    type: 'follow'
  });
  
  // Get following with pagination
  const connections = await Connection.find({
    follower: targetUserId,
    type: 'follow'
  })
    .sort({ createdAt: -1 }) // Most recent follows first
    .skip(skip)
    .limit(limit)
    .populate('following', 'username fullName profilePicture bio specialization followersCount followingCount createdAt')
    .lean();
  
  // Build following list
  const following = buildConnectionList(connections, 'following', requesterId);
  
  // If requester is authenticated, batch check if they follow these users
  if (requesterId && following.length > 0) {
    const followingIds = following.map(f => f._id);
    const followingMap = await batchCheckFollowing(requesterId, followingIds);
    
    // Add isFollowing field to each user
    following.forEach(user => {
      user.isFollowing = followingMap.get(user._id.toString());
    });
  }
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  sendSuccess(res, {
    following,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
});

module.exports = getFollowing;
