const Community = require('../../models/Community');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { COMMUNITY_PROFILE_PICTURE_SIZE, CLOUDINARY_FOLDER_COMMUNITY } = require('../../utils/constants');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Update community profile picture
 * POST /communities/:id/profile-picture
 * @route POST /communities/:id/profile-picture
 * @access Private (Owner only)
 */
const updateCommunityProfilePicture = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  // Check if file is uploaded
  if (!req.file) {
    throw new ValidationError('No image file provided');
  }

  // Find community
  const community = await Community.findById(id);
  
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Check if user is owner
  if (!community.isOwner(userId)) {
    throw new ForbiddenError('Only community owners can update the profile picture');
  }

  // Process image
  const processedBuffer = await processImage(req.file.buffer, COMMUNITY_PROFILE_PICTURE_SIZE);

  // Upload to Cloudinary
  const publicId = `${CLOUDINARY_FOLDER_COMMUNITY}/profile_${id}_${Date.now()}`;
  const uploadResult = await uploadToCloudinary(processedBuffer, CLOUDINARY_FOLDER_COMMUNITY, publicId);

  // Update community profile picture
  community.profilePicture = uploadResult.secure_url;
  await community.save();

  sendSuccess(res, {
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
  }, 'Profile picture updated successfully');
});

module.exports = updateCommunityProfilePicture;

module.exports = updateCommunityProfilePicture;
