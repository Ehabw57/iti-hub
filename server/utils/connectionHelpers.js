const Connection = require('../models/Connection');
const User = require('../models/User');

/**
 * Validate a connection action (follow/unfollow/block/unblock)
 * @param {ObjectId} requesterId - ID of the user making the request
 * @param {ObjectId} targetId - ID of the target user
 * @param {string} action - Action type: 'follow', 'unfollow', 'block', 'unblock'
 * @returns {Promise<Object>} Object with isValid, error properties
 */
async function validateConnectionAction(requesterId, targetId, action) {
  // Prevent actions on self
  if (requesterId.toString() === targetId.toString()) {
    return {
      isValid: false,
      error: `Cannot ${action} yourself`
    };
  }
  
  // Check if target user exists
  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    return {
      isValid: false,
      error: 'User not found'
    };
  }
  
  // Action-specific validation
  if (action === 'follow') {
    // Check if already following
    const isFollowing = await Connection.isFollowing(requesterId, targetId);
    if (isFollowing) {
      return {
        isValid: false,
        error: 'Already following this user'
      };
    }
    
    // Check if either user has blocked the other
    const requesterBlocksTarget = await Connection.isBlocking(requesterId, targetId);
    const targetBlocksRequester = await Connection.isBlocking(targetId, requesterId);
    
    if (requesterBlocksTarget || targetBlocksRequester) {
      return {
        isValid: false,
        error: 'Cannot follow this user due to a block'
      };
    }
  } else if (action === 'unfollow') {
    // Check if actually following
    const isFollowing = await Connection.isFollowing(requesterId, targetId);
    if (!isFollowing) {
      return {
        isValid: false,
        error: 'Not following this user'
      };
    }
  } else if (action === 'block') {
    // Check if already blocking
    const isBlocking = await Connection.isBlocking(requesterId, targetId);
    if (isBlocking) {
      return {
        isValid: false,
        error: 'Already blocking this user'
      };
    }
  } else if (action === 'unblock') {
    // Check if actually blocking
    const isBlocking = await Connection.isBlocking(requesterId, targetId);
    if (!isBlocking) {
      return {
        isValid: false,
        error: 'Not blocking this user'
      };
    }
  }
  
  return {
    isValid: true,
    targetUser
  };
}

/**
 * Build a connection list (followers or following) with proper population and sanitization
 * 
 * Usage examples:
 * - For followers list: buildConnectionList(connections, 'follower', currentUserId)
 * - For following list: buildConnectionList(connections, 'following', currentUserId)
 * 
 * @param {Array} connections - Array of Connection documents (must be pre-populated)
 * @param {string} populateField - Field to extract user from: 'follower' or 'following'
 * @param {ObjectId} [requesterId] - Optional: ID of user making request (for relationship metadata)
 * @returns {Array} Array of user objects with connection metadata
 */
function buildConnectionList(connections, populateField, requesterId = null) {
  return connections.map(connection => {
    const user = connection[populateField];
    
    // Basic user info (from populated field)
    const userInfo = {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      bio: user.bio,
      specialization: user.specialization,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      createdAt: user.createdAt,
      // Add connection timestamp (when the follow/block happened)
      connectedAt: connection.createdAt
    };
    
    // If requester is provided, add relationship metadata
    if (requesterId) {
      userInfo.isOwnProfile = user._id.toString() === requesterId.toString();
      // Note: isFollowing should be added by controller using batchCheckFollowing()
      // for better performance (avoid N+1 queries)
    }
    
    return userInfo;
  });
}

/**
 * Check if there's a mutual block between two users
 * @param {ObjectId} user1Id - First user ID
 * @param {ObjectId} user2Id - Second user ID
 * @returns {Promise<boolean>} True if either user blocks the other
 */
async function checkMutualBlock(user1Id, user2Id) {
  const user1BlocksUser2 = await Connection.isBlocking(user1Id, user2Id);
  if (user1BlocksUser2) return true;
  
  const user2BlocksUser1 = await Connection.isBlocking(user2Id, user1Id);
  if (user2BlocksUser1) return true;
  
  return false;
}

/**
 * Batch check following status for multiple users
 * Useful for enriching connection lists with isFollowing metadata
 * @param {ObjectId} requesterId - ID of the user making the request
 * @param {Array<ObjectId>} targetIds - Array of user IDs to check
 * @returns {Promise<Map>} Map of userId -> isFollowing boolean
 */
async function batchCheckFollowing(requesterId, targetIds) {
  const connections = await Connection.find({
    follower: requesterId,
    following: { $in: targetIds },
    type: 'follow'
  }).lean();
  
  const followingMap = new Map();
  
  // Initialize all as false
  targetIds.forEach(id => {
    followingMap.set(id.toString(), false);
  });
  
  // Set true for those being followed
  connections.forEach(conn => {
    followingMap.set(conn.following.toString(), true);
  });
  
  return followingMap;
}

module.exports = {
  validateConnectionAction,
  buildConnectionList,
  checkMutualBlock,
  batchCheckFollowing
};
