const { getNotifications } = require('./getNotificationsController');
const { getUnreadCount } = require('./getUnreadCountController');
const { markAsRead } = require('./markAsReadController');
const { markAllAsRead } = require('./markAllAsReadController');

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
