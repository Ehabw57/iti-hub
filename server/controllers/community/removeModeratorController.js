const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { canModerate, updateModeratorList } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');

/**
 * Remove moderator from community
 * DELETE /communities/:id/moderators/:userId
 * @route DELETE /communities/:id/moderators/:userId
 * @access Private (Owner/Moderator only)
 */
async function removeModerator(req, res) {
  try {
    const { id, userId } = req.params;
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
        message: 'You must be a moderator or owner to remove moderators'
      });
    }

    // Check if target user is an owner (cannot remove owners)
    if (community.isOwner(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove community owners from moderators'
      });
    }

    // Find membership
    const membership = await CommunityMember.findOne({
      user: userId,
      community: id
    });

    // If not a moderator, return success (idempotent)
    if (!membership || membership.role !== 'moderator') {
      return res.status(200).json({
        success: true,
        message: 'User is not a moderator'
      });
    }

    // Update moderator list using helper
    await updateModeratorList(id, userId, 'remove');

    // Update membership role back to member
    membership.role = 'member';
    await membership.save();

    return res.status(200).json({
      success: true,
      message: 'Moderator removed successfully'
    });

  } catch (error) {
    console.error('Error removing moderator:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while removing moderator'
    });
  }
}

module.exports = removeModerator;
