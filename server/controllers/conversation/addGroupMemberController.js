const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const { formatConversation } = require('../../utils/messageHelpers');
const { MAX_GROUP_PARTICIPANTS } = require('../../utils/constants');

/**
 * Add member to group conversation (admin only)
 * POST /conversations/:conversationId/members
 */
exports.addGroupMember = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;
    const { userId } = req.body;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId'
      });
    }

    // Validate userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Validate userId is valid ObjectId
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
        message: 'Can only add members to group conversations'
      });
    }

    // Check if current user is admin
    if (conversation.admin.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can add members'
      });
    }

    // Check if user to add exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = conversation.participants.some(
      p => p.toString() === userId.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }

    // Check if group is at maximum capacity
    if (conversation.participants.length >= MAX_GROUP_PARTICIPANTS) {
      return res.status(400).json({
        success: false,
        message: `Group has reached maximum capacity of ${MAX_GROUP_PARTICIPANTS} members`
      });
    }

    // Add user to participants
    conversation.participants.push(userId);

    // Initialize unreadCount for new member
    conversation.unreadCount.set(userId.toString(), 0);

    await conversation.save();

    // Format and return updated conversation
    const formatted = await formatConversation(conversation, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Member added to group successfully',
      data: {
        conversation: formatted
      }
    });
  } catch (error) {
    console.error('Error in addGroupMember:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding member',
      error: error.message
    });
  }
};
