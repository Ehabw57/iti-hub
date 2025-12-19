const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { formatConversation } = require('../../utils/messageHelpers');
const { MIN_GROUP_PARTICIPANTS } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Remove member from group conversation (admin only)
 * DELETE /conversations/:conversationId/members/:userId
 */
exports.removeGroupMember = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { conversationId, userId } = req.params;

  // Validate conversationId
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ValidationError('Invalid conversationId');
  }

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid userId');
  }

  // Check if conversation exists
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  // Check if conversation is a group
  if (conversation.type !== 'group') {
    throw new ValidationError('Can only remove members from group conversations');
  }

  // Check if current user is admin
  if (conversation.admin.toString() !== currentUserId.toString()) {
    throw new ForbiddenError('Only group admin can remove members');
  }

  // Check if user to remove is a member
  const isMember = conversation.participants.some(
    p => p.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ValidationError('User is not a member of this group');
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

  sendSuccess(res, {
    message: 'Member removed from group successfully',
    conversation: formatted
  });
});
