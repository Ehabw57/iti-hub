const User = require('../../models/User');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../utils/cloudinary');
const { IMAGE_CONFIGS, CLOUDINARY_FOLDER_PROFILE } = require('../../utils/constants');

/**
 * Upload or update user profile picture
 * @route POST /api/users/profile/picture
 * @access Private
 */
const uploadProfilePictureController = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded'
        }
      });
    }

    // Process image with Sharp (resize, compress, convert to WebP)
    let processedBuffer;
    try {
      processedBuffer = await processImage(req.file.buffer, IMAGE_CONFIGS.PROFILE);
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: {
          code: 'IMAGE_PROCESSING_ERROR',
          message: 'Failed to process image'
        }
      });
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
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
      const publicId = `${CLOUDINARY_FOLDER_PROFILE}/user_${req.user._id}_${Date.now()}`;
      uploadResult = await uploadToCloudinary(processedBuffer, CLOUDINARY_FOLDER_PROFILE, publicId);
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload image'
        }
      });
    }

    // Update user profile picture URL
    user.profilePicture = uploadResult.secure_url;
    
    try {
      await user.save();
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update profile picture'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

module.exports = uploadProfilePictureController;
