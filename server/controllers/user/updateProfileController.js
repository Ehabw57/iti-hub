const User = require('../../models/User');
const { validateProfileUpdate, sanitizeUserProfile } = require('../../utils/userHelpers');

/**
 * Update User Profile
 * PUT /users/profile
 * 
 * Allows authenticated users to update their profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    
    // Validate update data
    const validation = validateProfileUpdate(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    // Check if there's anything to update
    if (Object.keys(validation.validatedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: validation.validatedData },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    

    // Remove sensitive fields from response
    const userResponse = updatedUser.toObject();
    const sanitizedProfile = sanitizeUserProfile(userResponse,{includeEmail: true});
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitizedProfile
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = updateProfile;
