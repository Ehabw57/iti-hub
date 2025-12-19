const User = require("../../models/User");
const validator = require("validator");
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, AuthenticationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * @route   POST /auth/password-reset/request
 * @desc    Request password reset - generates and sends reset token
 * @access  Public
 * @body    { email }
 * @returns { success, message } - Always success for security
 */
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email format
  if (!email || !validator.isEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  // For security: Always return success even if user not found
  if (!user) {
    return sendSuccess(
      res,
      {},
      'If email exists in our system, a password reset link has been sent'
    );
  }

  // Generate password reset token
  const plainToken = await user.generatePasswordResetToken();

  // MVP: Log token to console (in production, send via email)
  console.log(`Password reset token for ${email}: ${plainToken}`);
  console.log(`Reset link: http://localhost:5173/password-reset/confirm?token=${plainToken}`);

  return sendSuccess(
    res,
    {},
    'If email exists in our system, a password reset link has been sent'
  );
});

/**
 * @route   POST /auth/password-reset/confirm
 * @desc    Confirm password reset with token and new password
 * @access  Public
 * @body    { token, newPassword }
 * @returns { success, message } or error
 */
exports.confirmPasswordReset = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Validate token presence
  if (!token) {
    throw new ValidationError('Reset token is required');
  }

  // Validate new password presence
  if (!password) {
    throw new ValidationError('New password is required');
  }

  // Validate password strength (min 8 characters)
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Hash the token to match database
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token and non-expired expiration
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  // Check if token is invalid or expired
  if (!user) {
    // Check if there's a user with this token but expired
    const expiredUser = await User.findOne({ resetPasswordToken: hashedToken });
    
    if (expiredUser) {
      throw new AuthenticationError('Password reset token has expired', 'RESET_TOKEN_EXPIRED');
    }

    throw new AuthenticationError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
  }

  // Update password (will be hashed by pre-save hook)
  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return sendSuccess(
    res,
    {},
    'Password reset successful. You can now login with your new password.'
  );
});
