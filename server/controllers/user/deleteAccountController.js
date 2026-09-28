const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, AuthenticationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Delete the authenticated user's account (after confirming password)
 * DELETE /users/me
 * Body: { password }
 * @access Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    throw new ValidationError('Password confirmation is required');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AuthenticationError('Password is incorrect', 'INVALID_CREDENTIALS');
  }

  const userId = user._id;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Delete the user document
      await User.deleteOne({ _id: userId }).session(session);

      // Delete the user's posts
      await Post.deleteMany({ author: userId }).session(session);
    });
  } finally {
    await session.endSession();
  }

  // NOTE: Followers/following counters on related users are not adjusted here.
  // That cleanup can be handled by a background job in a production setting.

  return sendSuccess(res, {}, 'Account deleted successfully');
});

module.exports = deleteAccount;
