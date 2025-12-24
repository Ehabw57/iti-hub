const User = require('../../models/User');
const { buildProfileResponse, checkUserBlocked } = require('../../utils/userHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get User Profile by Username
 * GET /users/:username
 * 
 * Returns user profile with metadata based on requester's relationship
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user?._id; // Optional authentication

  // Find user by userId
  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError('User');
  }
  
  // Check for blocks if requester is authenticated
  if (requesterId) {
    const blockStatus = await checkUserBlocked(requesterId, user._id);
    
    if (blockStatus.isBlocked && blockStatus.blockedBy === 'target') {
      // Target user has blocked the requester
      throw new ForbiddenError('You cannot view this profile');
    }
  }
  
  // Build profile response with relationship metadata
  const profile = await buildProfileResponse(user, requesterId);
  
  return sendSuccess(res, profile);
});

module.exports = getUserProfile;
