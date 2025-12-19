const Notification = require('../../models/Notification');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get Unread Notifications Count
 * GET /notifications/unread/count
 * 
 * Retrieves the count of unread notifications for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get unread count
  const unreadCount = await Notification.getUnreadCount(userId);
  
  sendSuccess(res, {
    message: 'Unread count retrieved successfully',
    unreadCount
  });
});

module.exports = { getUnreadCount };
