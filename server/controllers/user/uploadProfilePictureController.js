const User = require('../../models/User');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../utils/cloudinary');
const { IMAGE_CONFIGS, CLOUDINARY_FOLDER_PROFILE } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, InternalError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Upload or update user profile picture
 * @route POST /api/users/profile/picture
 * @access Private
 */
const uploadProfilePictureController = asyncHandler(async (req, res) => {
  // Check if file exists
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  // Process image with Sharp (resize, compress, convert to WebP)
  let processedBuffer;
  try {
    processedBuffer = await processImage(req.file.buffer, IMAGE_CONFIGS.PROFILE);
  } catch (error) {
    throw new InternalError('Failed to process image');
  }

  // Find user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Delete old profile picture from Cloudinary if exists
  if (user.profilePicture) {
    try {
      const oldPublicId = extractPublicId(user.profilePicture);
      await deleteFromCloudinary(oldPublicId);
    } catch (error) {
      console.error('Failed to delete old profile picture:', error);
    }
  }

  // Upload processed image to Cloudinary
  let uploadResult;
  try {
    const publicId = `user_${req.user._id}_${Date.now()}`;
    uploadResult = await uploadToCloudinary(processedBuffer, CLOUDINARY_FOLDER_PROFILE, publicId);
  } catch (error) {
    throw new InternalError('Failed to upload image');
  }

  // Update user profile picture URL
  user.profilePicture = uploadResult.secure_url;
  
  try {
    await user.save();
  } catch (error) {
    throw new InternalError('Failed to update profile picture');
  }

  // Return full user object for frontend state update
  sendSuccess(res, { 
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      coverImage: user.coverImage,
      bio: user.bio,
      specialization: user.specialization,
      location: user.location,
      isVerified: user.isVerified
    }
  }, 'Profile picture updated successfully');
});

module.exports = uploadProfilePictureController;
