const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { updateMemberCount } = require('../../utils/communityHelpers');
const mongoose = require('mongoose');

/**
 * Join a community
 * POST /communities/:id/join
 * @route POST /communities/:id/join
 * @access Private
 */
async function joinCommunity(req, res) {
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

    // Check if already a member
    const existingMembership = await CommunityMember.findOne({
      user: userId,
      community: id
    });

    if (existingMembership) {
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this community'
      });
    }

    // Create membership
    await CommunityMember.create({
      user: userId,
      community: id,
      role: 'member'
    });

    // Increment member count
    await updateMemberCount(id, 1);

    return res.status(201).json({
      success: true,
      message: 'Successfully joined the community'
    });
  } catch (error) {
    console.error('Error joining community:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while joining the community'
    });
  }
}

module.exports = joinCommunity;
