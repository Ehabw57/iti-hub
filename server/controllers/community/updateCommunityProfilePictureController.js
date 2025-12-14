const Community = require('../../models/Community');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { COMMUNITY_PROFILE_PICTURE_SIZE, CLOUDINARY_FOLDER_COMMUNITY } = require('../../utils/constants');
const mongoose = require('mongoose');

/**
 * Update community profile picture
 * POST /communities/:id/profile-picture
 * @route POST /communities/:id/profile-picture
 * @access Private (Owner only)
 */
async function updateCommunityProfilePicture(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate community ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid community ID'
      });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Find community
    const community = await Community.findById(id);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is owner
    if (!community.isOwner(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only community owners can update the profile picture'
      });
    }

    // Process image
    const processedBuffer = await processImage(req.file.buffer, COMMUNITY_PROFILE_PICTURE_SIZE);

    // Upload to Cloudinary
    const publicId = `${CLOUDINARY_FOLDER_COMMUNITY}/profile_${id}_${Date.now()}`;
    const uploadResult = await uploadToCloudinary(processedBuffer, CLOUDINARY_FOLDER_COMMUNITY, publicId);

    // Update community profile picture
    community.profilePicture = uploadResult.secure_url;
    await community.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        community: {
          _id: community._id.toString(),
          name: community.name,
          description: community.description,
          profilePicture: community.profilePicture,
          coverImage: community.coverImage,
          tags: community.tags,
          memberCount: community.memberCount,
          postCount: community.postCount,
          createdAt: community.createdAt,
          updatedAt: community.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Error updating community profile picture:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the profile picture'
    });
  }
}

module.exports = updateCommunityProfilePicture;
