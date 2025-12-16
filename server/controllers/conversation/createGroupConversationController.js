const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const { formatConversation } = require('../../utils/messageHelpers');
const { 
  MIN_GROUP_PARTICIPANTS, 
  MAX_GROUP_PARTICIPANTS,
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH
} = require('../../utils/constants');

/**
 * Create new group conversation
 * POST /conversations/group
 */
exports.createGroupConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    let { name, participantIds, image } = req.body;

    // Validate name is provided
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    // Trim name
    name = name.trim();

    // Validate name length
    if (name.length < MIN_GROUP_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Group name must be at least ${MIN_GROUP_NAME_LENGTH} characters`
      });
    }

    if (name.length > MAX_GROUP_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Group name cannot exceed ${MAX_GROUP_NAME_LENGTH} characters`
      });
    }

    // Validate participantIds is provided
    if (!participantIds) {
      return res.status(400).json({
        success: false,
        message: 'participantIds is required'
      });
    }

    // Validate participantIds is array
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({
        success: false,
        message: 'participantIds must be an array'
      });
    }

    // Check participant count (excluding creator who will be added)
    const totalParticipants = participantIds.length + 1; // +1 for creator

    if (totalParticipants < MIN_GROUP_PARTICIPANTS) {
      return res.status(400).json({
        success: false,
        message: `Group must have at least ${MIN_GROUP_PARTICIPANTS} participants`
      });
    }

    if (totalParticipants > MAX_GROUP_PARTICIPANTS) {
      return res.status(400).json({
        success: false,
        message: `Group cannot exceed ${MAX_GROUP_PARTICIPANTS} participants`
      });
    }

    // Validate all participantIds are valid ObjectIds
    for (const id of participantIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid participantId format'
        });
      }
    }

    // Check if creator is in participantIds
    const creatorIdString = currentUserId.toString();
    if (participantIds.some(id => id.toString() === creatorIdString)) {
      return res.status(400).json({
        success: false,
        message: 'Creator is automatically added to the group'
      });
    }

    // Check for duplicate participantIds
    const uniqueIds = new Set(participantIds.map(id => id.toString()));
    if (uniqueIds.size !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Cannot have duplicate participants'
      });
    }

    // Verify all participants exist
    const participants = await User.find({
      _id: { $in: participantIds }
    });

    if (participants.length !== participantIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more participants not found'
      });
    }

    // Create group conversation using Conversation.createGroup
    // createGroup signature: (creatorId, name, participantIds, image)
    const conversation = await Conversation.createGroup(
      currentUserId,
      name,
      participantIds, // Excluding creator - model will add them
      image
    );

    const formatted = await formatConversation(conversation, currentUserId);

    return res.status(201).json({
      success: true,
      message: 'Group conversation created successfully',
      data: {
        conversation: formatted
      }
    });
  } catch (error) {
    console.error('Error in createGroupConversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating group conversation',
      error: error.message
    });
  }
};
