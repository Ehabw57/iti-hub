const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const { canSendMessage, formatConversation } = require('../../utils/messageHelpers');

/**
 * Create or return existing individual conversation
 * POST /conversations
 */
exports.createConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { participantId } = req.body;

    // Validate participantId is provided
    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'participantId is required'
      });
    }

    // Validate participantId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participantId'
      });
    }

    // Check if trying to message self
    if (currentUserId.toString() === participantId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check blocking status
    const messageCheck = await canSendMessage(currentUserId, participantId);
    if (!messageCheck.canSend) {
      return res.status(403).json({
        success: false,
        message: 'Cannot create conversation - blocked'
      });
    }

    // Check if conversation already exists
    const sortedIds = [currentUserId.toString(), participantId.toString()].sort();
    const existingConversation = await Conversation.findOne({
      type: 'individual',
      participants: { $all: sortedIds, $size: 2 }
    }).populate('participants', 'username fullName profilePicture isOnline lastSeen');

    if (existingConversation) {
      const formatted = await formatConversation(existingConversation, currentUserId);
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        data: {
          conversation: formatted
        }
      });
    }

    // Create new conversation (skip blocking check as we already checked)
    const conversation = await Conversation.create({
      type: 'individual',
      participants: sortedIds
    });

    const formatted = await formatConversation(conversation, currentUserId);

    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: {
        conversation: formatted
      }
    });
  } catch (error) {
    console.error('Error in createConversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating conversation',
      error: error.message
    });
  }
};
