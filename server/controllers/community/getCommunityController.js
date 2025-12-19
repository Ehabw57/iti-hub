const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get community details by ID
 * GET /communities/:id
 * @route GET /communities/:id
 * @access Public (optional auth)
 */
const getCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  // Validate community ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid community ID');
  }

  // Find community
  const community = await Community.findById(id);
  
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Build response object
  const communityData = {
    _id: community._id,
    name: community.name,
    description: community.description,
    profilePicture: community.profilePicture,
    coverImage: community.coverImage,
    tags: community.tags,
    memberCount: community.memberCount,
    postCount: community.postCount,
    createdAt: community.createdAt,
    updatedAt: community.updatedAt,
    isJoined: false, // Default to false
    role: null
  };

  // If user is authenticated, check membership
  if (userId) {
    const isJoined = await CommunityMember.isEnrolled(userId, id);
    const role = await CommunityMember.getRole(userId, id);
    
    communityData.isJoined = isJoined;
    communityData.role = role;
  }

  sendSuccess(res, { community: communityData });
});

module.exports = getCommunity;
