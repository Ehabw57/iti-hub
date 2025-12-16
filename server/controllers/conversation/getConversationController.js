const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { formatConversation } = require('../../utils/messageHelpers');

/**
 * Get a specific conversation by ID
 * GET /conversations/:conversationId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    // Find conversation
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'username fullName profilePicture lastSeen')
      .populate('admin', 'username fullName profilePicture');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      participant => participant._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Format conversation
    const formattedConversation = await formatConversation(conversation, userId);

    return res.status(200).json({
      success: true,
      data: {
        conversation: formattedConversation
      }
    });
  } catch (error) {
    console.error('Error in getConversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { getConversation };
