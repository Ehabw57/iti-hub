const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { formatConversation } = require('../../utils/messageHelpers');
const { MIN_GROUP_PARTICIPANTS } = require('../../utils/constants');

/**
 * Remove member from group conversation (admin only)
 * DELETE /conversations/:conversationId/members/:userId
 */
exports.removeGroupMember = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId, userId } = req.params;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId'
      });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId'
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
        message: 'Can only remove members from group conversations'
      });
    }

    // Check if current user is admin
    if (conversation.admin.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can remove members'
      });
    }

    // Check if user to remove is a member
    const isMember = conversation.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this group'
      });
    }


    // Remove user from participants
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== userId.toString()
    );

    // Remove unreadCount for removed member
    conversation.unreadCount.delete(userId.toString());

    await conversation.save();

    // Format and return updated conversation
    const formatted = await formatConversation(conversation, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Member removed from group successfully',
      data: {
        conversation: formatted
      }
    });
  } catch (error) {
    console.error('Error in removeGroupMember:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while removing member',
      error: error.message
    });
  }
};
