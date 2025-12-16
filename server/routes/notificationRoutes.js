const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middlewares/checkAuth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../controllers/notification');

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for authenticated user
 * @access  Private
 */
router.get('/', checkAuth, getNotifications);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notifications count for authenticated user
 * @access  Private
 */
router.get('/unread/count', checkAuth, getUnreadCount);

/**
 * @route   PUT /api/notifications/read
 * @desc    Mark all notifications as read for authenticated user
 * @access  Private
 */
router.put('/read', checkAuth, markAllAsRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark specific notification as read
 * @access  Private
 */
router.put('/:id/read', checkAuth, markAsRead);

module.exports = router;

