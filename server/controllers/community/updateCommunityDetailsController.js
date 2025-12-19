const Community = require('../../models/Community');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Update community details (description)
 * PATCH /communities/:id
 * @route PATCH /communities/:id
 * @access Private (Owner only)
 */
const updateCommunityDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  const userId = req.user._id;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  // Validate description
  if (!description || typeof description !== 'string') {
    throw new ValidationError('Description is required');
  }

  // Find community
  const community = await Community.findById(id);
  
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Check if user is owner
  if (!community.isOwner(userId)) {
    throw new ForbiddenError('Only community owners can update community details');
  }

  // Update description
  community.description = description;
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
  }, 'Community details updated successfully');
});

module.exports = updateCommunityDetails;

module.exports = updateCommunityDetails;
