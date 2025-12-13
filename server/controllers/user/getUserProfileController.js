const User = require('../../models/User');
const { buildProfileResponse, checkUserBlocked } = require('../../utils/userHelpers');

/**
 * Get User Profile by Username
 * GET /users/:username
 * 
 * Returns user profile with metadata based on requester's relationship
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserProfile(req, res) {
  try {
    const { username } = req.params;
    const requesterId = req.user?._id; // Optional authentication
    
    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check for blocks if requester is authenticated
    if (requesterId) {
      const blockStatus = await checkUserBlocked(requesterId, user._id);
      
      if (blockStatus.isBlocked && blockStatus.blockedBy === 'target') {
        // Target user has blocked the requester
        return res.status(403).json({
          success: false,
          message: 'You cannot view this profile'
        });
      }
    }
    
    // Build profile response with relationship metadata
    const profile = await buildProfileResponse(user, requesterId);
    
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = getUserProfile;
