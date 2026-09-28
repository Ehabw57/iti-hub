const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendNoContent } = require('../../utils/responseHelpers');

/**
 * Delete a group conversation (admin only)
 * DELETE /conversations/:conversationId
 * Removes the conversation along with all of its messages.
 */
exports.deleteGroup = asyncHandler(async (req, res) => {
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

  // Only group conversations can be deleted through this endpoint
  if (conversation.type !== 'group') {
    throw new ValidationError('Can only delete group conversations');
  }

  // Only the group admin can delete the group
  if (conversation.admin.toString() !== currentUserId.toString()) {
    throw new ForbiddenError('Only group admin can delete the group');
  }

  // Remove all messages belonging to this conversation, then the conversation
  await Message.deleteMany({ conversation: conversation._id });
  await Conversation.findByIdAndDelete(conversationId);

  return sendNoContent(res);
});
