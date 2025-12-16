const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { MIN_GROUP_PARTICIPANTS } = require('../../utils/constants');

/**
 * Leave group conversation (any member except admin)
 * POST /conversations/:conversationId/leave
 */
exports.leaveGroup = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId'
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if conversation is a group
    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        message: 'Can only leave group conversations'
      });
    }

    // Check if user is a member
    const isMember = conversation.participants.some(
      p => p.toString() === currentUserId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Admin cannot leave (must transfer admin rights first)
    if (currentUserId.toString() === conversation.admin.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot leave group. Transfer admin rights first.'
      });
    }

    // Check if leaving would go below minimum participants
    if (conversation.participants.length <= MIN_GROUP_PARTICIPANTS) {
      return res.status(400).json({
        success: false,
        message: `Group must have at least ${MIN_GROUP_PARTICIPANTS} members`
      });
    }

    // Remove user from participants
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== currentUserId.toString()
    );

    // Remove unreadCount for leaving user
    conversation.unreadCount.delete(currentUserId.toString());

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: 'You have left the group successfully'
    });
  } catch (error) {
    console.error('Error in leaveGroup:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while leaving group',
      error: error.message
    });
  }
};
