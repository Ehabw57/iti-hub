const Notification = require('../../models/Notification');
const mongoose = require('mongoose');

/**
 * Mark Notification as Read
 * PUT /notifications/:id/read
 * 
 * Marks a specific notification as read for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;
    
    // Validate notification ID format
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }
    
    // Mark notification as read
    const notification = await Notification.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Populate actor and target for response
    await notification.populate('actor', 'username fullName profilePicture bio');
    await notification.populate('target');
    
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { markAsRead };
