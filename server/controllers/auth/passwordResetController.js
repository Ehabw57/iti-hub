const User = require("../../models/User");
const validator = require("validator");

/**
 * @route   POST /auth/password-reset/request
 * @desc    Request password reset - generates and sends reset token
 * @access  Public
 * @body    { email }
 * @returns { success, message } - Always success for security
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // For security: Always return success even if user not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If email exists in our system, a password reset link has been sent'
      });
    }

    // Generate password reset token
    const plainToken = await user.generatePasswordResetToken();

    // MVP: Log token to console (in production, send via email)
    // console.log(`Password reset token for ${email}: ${plainToken}`);
    // console.log(`Reset link: http://localhost:3000/auth/password-reset/confirm?token=${plainToken}`);

    return res.status(200).json({
      success: true,
      message: 'If email exists in our system, a password reset link has been sent'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_ERROR',
        message: 'Error requesting password reset',
        details: error.message
      }
    });
  }
};

/**
 * @route   POST /auth/password-reset/confirm
 * @desc    Confirm password reset with token and new password
 * @access  Public
 * @body    { token, newPassword }
 * @returns { success, message } or error
 */
exports.confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate token presence
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Reset token is required'
        }
      });
    }

    // Validate new password presence
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORD',
          message: 'New password is required'
        }
      });
    }

    // Validate password strength (min 8 characters)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
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
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Password reset token has expired'
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_ERROR',
        message: 'Error confirming password reset',
        details: error.message
      }
    });
  }
};
