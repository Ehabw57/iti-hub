const User = require('../../models/User');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../utils/cloudinary');
const { IMAGE_CONFIGS, CLOUDINARY_FOLDER_COVER } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, InternalError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Upload or update user cover image
 * @route POST /api/users/profile/cover
 * @access Private
 */
const uploadCoverImageController = asyncHandler(async (req, res) => {
  // Check if file exists
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  // Process image with Sharp (resize, compress, convert to WebP)
  let processedBuffer;
  try {
    processedBuffer = await processImage(req.file.buffer, IMAGE_CONFIGS.COVER);
  } catch (error) {
    throw new InternalError('Failed to process image');
  }

  // Find user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Delete old cover image from Cloudinary if exists
  if (user.coverImage) {
    try {
      const oldPublicId = extractPublicId(user.coverImage);
      await deleteFromCloudinary(oldPublicId);
    } catch (error) {
      // Log error but continue - old image deletion failure shouldn't block upload
      console.error('Failed to delete old cover image:', error);
    }
  }

  // Upload processed image to Cloudinary
  let uploadResult;
  try {
    const publicId = `user_${req.user._id}_${Date.now()}`;
    uploadResult = await uploadToCloudinary(processedBuffer, CLOUDINARY_FOLDER_COVER, publicId);
  } catch (error) {
    throw new InternalError('Failed to upload image');
  }

  // Update user cover image URL
  user.coverImage = uploadResult.secure_url;
  
  try {
    await user.save();
  } catch (error) {
    throw new InternalError('Failed to update cover image');
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
  }, 'Cover image updated successfully');
});

module.exports = uploadCoverImageController;
