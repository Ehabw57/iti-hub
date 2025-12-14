const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { canModerate, updateModeratorList } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');

/**
 * Add moderator to community
 * POST /communities/:id/moderators
 * @route POST /communities/:id/moderators
 * @access Private (Owner/Moderator only)
 */
async function addModerator(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const requesterId = req.user._id;

    // Validate community ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid community ID'
      });
    }

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
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

    // Check if requester can moderate
    const canModerateResult = await canModerate(requesterId, id);
    if (!canModerateResult) {
      return res.status(403).json({
        success: false,
        message: 'You must be a moderator or owner to add moderators'
      });
    }

    // Check if target user is a member
    const membership = await CommunityMember.findOne({
      user: userId,
      community: id
    });

    if (!membership) {
      return res.status(400).json({
        success: false,
        message: 'User must be a member of the community to become a moderator'
      });
    }

    // Check if already a moderator
    if (membership.role === 'moderator' || membership.role === 'owner') {
      return res.status(200).json({
        success: true,
        message: 'User is already a moderator'
      });
    }

    // Update moderator list using helper
    await updateModeratorList(id, userId, 'add');

    // Update membership role
    membership.role = 'moderator';
    await membership.save();

    return res.status(200).json({
      success: true,
      message: 'Moderator added successfully'
    });

  } catch (error) {
    console.error('Error adding moderator:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while adding moderator'
    });
  }
}

module.exports = addModerator;
