const User = require('../../models/User');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../utils/cloudinary');
const { IMAGE_CONFIGS, CLOUDINARY_FOLDER_COVER } = require('../../utils/constants');

/**
 * Upload or update user cover image
 * @route POST /api/users/profile/cover
 * @access Private
 */
const uploadCoverImageController = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process image with Sharp (resize, compress, convert to WebP)
    let processedBuffer;
    try {
      processedBuffer = await processImage(req.file.buffer, IMAGE_CONFIGS.COVER);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to process image' });
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      const publicId = `${CLOUDINARY_FOLDER_COVER}/user_${req.user._id}_${Date.now()}`;
      uploadResult = await uploadToCloudinary(processedBuffer, CLOUDINARY_FOLDER_COVER, publicId);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Update user cover image URL
    user.coverImage = uploadResult.secure_url;
    
    try {
      await user.save();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update cover image' });
    }

    return res.status(200).json({
      message: 'Cover image updated successfully',
      coverImage: user.coverImage
    });

  } catch (error) {
    console.error('Cover image upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = uploadCoverImageController;
