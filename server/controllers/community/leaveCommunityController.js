const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { updateMemberCount } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');

/**
 * Leave a community
 * POST /communities/:id/leave
 * @route POST /communities/:id/leave
 * @access Private
 */
async function leaveCommunity(req, res) {
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

    // Find community
    const community = await Community.findById(id);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is a member
    const membership = await CommunityMember.findOne({
      user: userId,
      community: id
    });

    if (!membership) {
      return res.status(200).json({
        success: true,
        message: 'You are not a member of this community'
      });
    }

    // Check if user is the only owner
    const isOwner = community.isOwner(userId);
    const ownerCount = community.owners.length;
    
    if (isOwner && ownerCount === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave community as you are the only owner. Please transfer ownership first.'
      });
    }

    // If user is a moderator, remove from moderators list
    if (membership.role === 'moderator') {
      community.moderators = community.moderators.filter(
        modId => modId.toString() !== userId.toString()
      );
      await community.save();
    }

    // Delete membership
    await CommunityMember.deleteOne({
      user: userId,
      community: id
    });

    // Decrement member count
    await updateMemberCount(id, -1);

    return res.status(200).json({
      success: true,
      message: 'Successfully left the community'
    });
  } catch (error) {
    console.error('Error leaving community:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while leaving the community'
    });
  }
}

module.exports = leaveCommunity;
