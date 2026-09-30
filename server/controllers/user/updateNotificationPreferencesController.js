const User = require('../../models/User');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

const ALLOWED_KEYS = ['email', 'push', 'mentions', 'messages', 'communityUpdates'];

/**
 * Update the authenticated user's notification preferences
 * PATCH /users/me/notification-preferences
 * Body: { email?, push?, mentions?, messages?, communityUpdates? }
 * @access Private
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const updates = req.body || {};

  const validated = {};
  for (const key of ALLOWED_KEYS) {
    if (key in updates) {
      if (typeof updates[key] !== 'boolean') {
        throw new ValidationError(`${key} must be a boolean`);
      }
      validated[`notificationPreferences.${key}`] = updates[key];
    }
  }

  if (Object.keys(validated).length === 0) {
    throw new ValidationError('No valid notification preference fields provided');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: validated },
    { new: true }
  ).lean();

  return sendSuccess(
    res,
    { notificationPreferences: updatedUser.notificationPreferences },
    'Notification preferences updated successfully'
  );
});

module.exports = updateNotificationPreferences;
