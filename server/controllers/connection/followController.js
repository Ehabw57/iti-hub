const Connection = require('../../models/Connection');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { validateConnectionAction } = require('../../utils/connectionHelpers');

/**
 * Follow User
 * POST /users/:userId/follow
 * 
 * Allows authenticated users to follow another user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function followUser(req, res) {
  try {
    const requesterId = req.user._id;
    const targetId = req.params.userId;
    
    // Validate the follow action
    const validation = await validateConnectionAction(requesterId, targetId, 'follow');
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
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
    
    return res.status(200).json({
      success: true,
      message: 'Successfully followed user',
      data: {
        followedUserId: targetId,
        followedAt: connection.createdAt
      }
    });
  } catch (error) {
    console.error('Error in followUser:', error);
    
    // Handle specific known errors
    if (error.message === 'Cannot follow yourself' || 
        error.message === 'Already following this user') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Unfollow User
 * DELETE /users/:userId/follow
 * 
 * Allows authenticated users to unfollow another user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function unfollowUser(req, res) {
  try {
    const requesterId = req.user._id;
    const targetId = req.params.userId;
    
    // Validate the unfollow action
    const validation = await validateConnectionAction(requesterId, targetId, 'unfollow');
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // Remove follow connection
    const removed = await Connection.removeFollow(requesterId, targetId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Follow relationship not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user',
      data: {
        unfollowedUserId: targetId
      }
    });
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    
    if (error.message === 'Cannot unfollow yourself' || 
        error.message === 'Not following this user') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  followUser,
  unfollowUser
};
