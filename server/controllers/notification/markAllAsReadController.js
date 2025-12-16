const Notification = require('../../models/Notification');

/**
 * Mark All Notifications as Read
 * PUT /notifications/read
 * 
 * Marks all notifications as read for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id;
    
    // Mark all notifications as read
    const result = await Notification.markAllAsRead(userId);
    
    // Get updated unread count (should be 0)
    const unreadCount = await Notification.getUnreadCount(userId);
    
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { markAllAsRead };
