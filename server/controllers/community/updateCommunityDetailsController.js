const Community = require('../../models/Community');
const mongoose = require('mongoose');

/**
 * Update community details (description)
 * PATCH /communities/:id
 * @route PATCH /communities/:id
 * @access Private (Owner only)
 */
async function updateCommunityDetails(req, res) {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const userId = req.user._id;

    // Validate community ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid community ID'
      });
    }

    // Validate description
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
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
        message: 'Only community owners can update community details'
      });
    }

    // Update description
    community.description = description;
    await community.save();

    return res.status(200).json({
      success: true,
      message: 'Community details updated successfully',
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
    console.error('Error updating community details:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating community details'
    });
  }
}

module.exports = updateCommunityDetails;
