const User = require('../../models/User');
const { validateProfileUpdate, validateBranchRoundTrack, sanitizeUserProfile } = require('../../utils/userHelpers');

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
    
    // Validate update data (synchronous validation)
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

    // Async validation for branch/round/track
    const branchRoundTrackValidation = await validateBranchRoundTrack(validation.validatedData);
    if (!branchRoundTrackValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Branch/Round/Track validation failed',
        errors: branchRoundTrackValidation.errors
      });
    }

    // If user is changing branch/round/track, reset verificationStatus to null
    if (branchRoundTrackValidation.requiresVerificationReset) {
      validation.validatedData.verificationStatus = null;
    }
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: validation.validatedData },
      { new: true, runValidators: true }
    ).populate('branchId', 'name')
     .populate('roundId', 'number name')
     .populate('trackId', 'name');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove sensitive fields from response
    const userResponse = updatedUser.toObject();
    const sanitizedProfile = sanitizeUserProfile(userResponse, { includeEmail: true });

    // Format branch/round/track for response
    if (sanitizedProfile.branchId) {
      sanitizedProfile.branch = sanitizedProfile.branchId;
      delete sanitizedProfile.branchId;
    }
    if (sanitizedProfile.roundId) {
      sanitizedProfile.round = sanitizedProfile.roundId;
      delete sanitizedProfile.roundId;
    }
    if (sanitizedProfile.trackId) {
      sanitizedProfile.track = sanitizedProfile.trackId;
      delete sanitizedProfile.trackId;
    }

    const message = branchRoundTrackValidation.requiresVerificationReset
      ? 'Profile updated; verification pending'
      : 'Profile updated successfully';
    
    return res.status(200).json({
      success: true,
      message,
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
