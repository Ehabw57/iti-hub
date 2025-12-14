const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const mongoose = require('mongoose');

/**
 * Get community details by ID
 * GET /communities/:id
 * @route GET /communities/:id
 * @access Public (optional auth)
 */
async function getCommunity(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Validate community ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid community ID'
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

    return res.status(200).json({
      success: true,
      data: {
        community: communityData
      }
    });
  } catch (error) {
    console.error('Error getting community:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the community'
    });
  }
}

module.exports = getCommunity;
