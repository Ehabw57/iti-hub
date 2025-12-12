const User = require("../../models/User");

/**
 * @route   POST /auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 * @body    { email, password }
 * @returns { success, message, data: { token, user } } or error
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password is required'
        }
      });
    }

    // Find user by email (include password field for verification)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    // If user not found, return invalid credentials
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BLOCKED',
          message: 'Your account has been blocked',
          reason: user.blockReason
        }
      });
    }

    // Update lastSeen timestamp
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userObject
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Error during login',
        details: error.message
      }
    });
  }
};
