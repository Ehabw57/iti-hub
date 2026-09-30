const User = require('../../models/User');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, AuthenticationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Change the authenticated user's password
 * PATCH /users/me/password
 * Body: { currentPassword, newPassword }
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('currentPassword and newPassword are required');
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters');
  }

  // Fetch the user WITH the password field (it is select:false by default)
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AuthenticationError('Current password is incorrect', 'INVALID_CREDENTIALS');
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, {}, 'Password changed successfully');
});

module.exports = changePassword;
