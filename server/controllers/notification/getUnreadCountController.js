const Notification = require('../../models/Notification');

/**
 * Get Unread Notifications Count
 * GET /notifications/unread/count
 * 
 * Retrieves the count of unread notifications for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user._id;
    
    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId);
    
    return res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { getUnreadCount };
