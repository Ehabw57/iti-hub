const Connection = require('../../models/Connection');
const User = require('../../models/User');
const { buildConnectionList, batchCheckFollowing } = require('../../utils/connectionHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');

/**
 * Get User Followers
 * GET /users/:userId/followers
 * 
 * Returns paginated list of users who follow the specified user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFollowers(req, res) {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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
    
    return res.status(200).json({
      success: true,
      data: {
        followers,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalCount,
          totalPages,
        }
      }
    });
  } catch (error) {
    console.error('Error in getFollowers:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = getFollowers;
