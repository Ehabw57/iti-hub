const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { MIN_GROUP_PARTICIPANTS } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Leave group conversation (any member except admin)
 * POST /conversations/:conversationId/leave
 */
exports.leaveGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { conversationId } = req.params;

  // Validate conversationId
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ValidationError('Invalid conversationId');
  }

  // Check if conversation exists
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  // Check if conversation is a group
  if (conversation.type !== 'group') {
    throw new ValidationError('Can only leave group conversations');
  }

  // Check if user is a member
  const isMember = conversation.participants.some(
    p => p.toString() === currentUserId.toString()
  );

  if (!isMember) {
    throw new ForbiddenError('You are not a member of this group');
  }

  // Admin cannot leave (must transfer admin rights first)
  if (currentUserId.toString() === conversation.admin.toString()) {
    // Find the oldest member in the conversation (excluding the current admin)
    const oldestMember = conversation.participants.find(
    p => p.toString() !== currentUserId.toString()
    );

    if (oldestMember) {
      conversation.admin = oldestMember;
    }
  }

  // Remove user from participants
  conversation.participants = conversation.participants.filter(
    p => p.toString() !== currentUserId.toString()
  );

  // Remove unreadCount for leaving user
  conversation.unreadCount.delete(currentUserId.toString());

  await conversation.save();

  sendSuccess(res, {participantsCount: conversation.participants.length}, 'You have left the group successfully');
});
