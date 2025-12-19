const Connection = require('../../models/Connection');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { validateConnectionAction } = require('../../utils/connectionHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Follow User
 * POST /users/:userId/follow
 * 
 * Allows authenticated users to follow another user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const followUser = asyncHandler(async (req, res) => {
  const requesterId = req.user._id;
  const targetId = req.params.userId;
  
  // Validate the follow action
  const validation = await validateConnectionAction(requesterId, targetId, 'follow');
  
  if (!validation.isValid) {
    throw new ValidationError(validation.error);
  }
  
  // Create follow connection
  const connection = await Connection.createFollow(requesterId, targetId);
  
  // Create notification (don't block on failure) - NOT GROUPED (individual notification)
  try {
    await Notification.createOrUpdateNotification(
      targetId,
      requesterId,
      NOTIFICATION_TYPES.FOLLOW,
      null // No target for follow notifications
    );
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Continue anyway - notification failure shouldn't block the follow
  }
  
  sendSuccess(res, {
    followedUserId: targetId,
    followedAt: connection.createdAt
  }, 'Successfully followed user');
});

/**
 * Unfollow User
 * DELETE /users/:userId/follow
 * 
 * Allows authenticated users to unfollow another user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const unfollowUser = asyncHandler(async (req, res) => {
  const requesterId = req.user._id;
  const targetId = req.params.userId;
  
  // Validate the unfollow action
  const validation = await validateConnectionAction(requesterId, targetId, 'unfollow');
  
  if (!validation.isValid) {
    throw new ValidationError(validation.error);
  }
  
  // Remove follow connection
  const removed = await Connection.removeFollow(requesterId, targetId);
  
  if (!removed) {
    throw new NotFoundError('Follow relationship not found');
  }
  
  sendSuccess(res, { unfollowedUserId: targetId }, 'Successfully unfollowed user');
});

module.exports = {
  followUser,
  unfollowUser
};
