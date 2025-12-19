const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { formatConversation } = require('../../utils/messageHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get a specific conversation by ID
 * GET /conversations/:conversationId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  // Validate conversation ID
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ValidationError('Invalid conversation ID');
  }

  // Find conversation
  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'username fullName profilePicture lastSeen')
    .populate('admin', 'username fullName profilePicture');

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    participant => participant._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }

  // Format conversation
  const formattedConversation = await formatConversation(conversation, userId);

  sendSuccess(res, {
    conversation: formattedConversation
  });
});

module.exports = { getConversation };
