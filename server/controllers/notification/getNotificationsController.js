const Notification = require('../../models/Notification');

/**
 * Get Notifications
 * GET /notifications
 * 
 * Retrieves paginated notifications for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    
    // Parse pagination parameters
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    
    // Validate and cap pagination parameters
    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 20 : limit;
    limit = limit > 50 ? 50 : limit; // Cap at 50
    
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Notification.countDocuments({ recipient: userId });
    
    // Get notifications with population
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'username fullName profilePicture bio')
      .populate('target');
    
    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId);
    
    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { getNotifications };
