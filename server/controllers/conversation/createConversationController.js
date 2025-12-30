const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const { canSendMessage, formatConversation } = require('../../utils/messageHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated } = require('../../utils/responseHelpers');

/**
 * Create or return existing individual conversation
 * POST /conversations
 */
exports.createConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { participantId } = req.body;

  // Validate participantId is provided
  if (!participantId) {
    throw new ValidationError('participantId is required');
  }

  // Validate participantId is valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(participantId)) {
    throw new ValidationError('Invalid participantId');
  }

  // Check if trying to message self
  if (currentUserId.toString() === participantId.toString()) {
    throw new ValidationError('Cannot create conversation with yourself');
  }

  // Check if participant exists
  const participant = await User.findById(participantId);
  if (!participant) {
    throw new NotFoundError('User not found');
  }

  // Check blocking status
  const messageCheck = await canSendMessage(currentUserId, participantId);
  if (!messageCheck.canSend) {
    throw new ForbiddenError('Cannot create conversation - blocked');
  }

  // Check if conversation already exists
  const sortedIds = [currentUserId.toString(), participantId.toString()].sort();
  const existingConversation = await Conversation.findOne({
    isGroup: false,
    participants: { $all: sortedIds, $size: 2 }
  }).populate('participants', 'username fullName profilePicture isOnline lastSeen');

  if (existingConversation) {
    const formatted = await formatConversation(existingConversation, currentUserId);
    return sendSuccess(res, {
      message: 'Conversation already exists',
      conversation: formatted
    });
  }

  // Create new conversation (skip blocking check as we already checked)
  const conversation = await Conversation.create({
    type: 'individual',
    participants: sortedIds
  });

  const formatted = await formatConversation(conversation, currentUserId);

  sendCreated(res, {
    message: 'Conversation created successfully',
    conversation: formatted
  });
});
