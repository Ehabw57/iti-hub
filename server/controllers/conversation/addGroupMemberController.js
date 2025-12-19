const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const { formatConversation } = require('../../utils/messageHelpers');
const { MAX_GROUP_PARTICIPANTS } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Add member to group conversation (admin only)
 * POST /conversations/:conversationId/members
 */
exports.addGroupMember = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { conversationId } = req.params;
  const { userId } = req.body;

  // Validate conversationId
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ValidationError('Invalid conversationId');
  }

  // Validate userId is provided
  if (!userId) {
    throw new ValidationError('userId is required');
  }

  // Validate userId is valid ObjectId
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
    throw new ValidationError('Can only add members to group conversations');
  }

  // Check if current user is admin
  if (conversation.admin.toString() !== currentUserId.toString()) {
    throw new ForbiddenError('Only group admin can add members');
  }

  // Check if user to add exists
  const userToAdd = await User.findById(userId);
  if (!userToAdd) {
    throw new NotFoundError('User not found');
  }

  // Check if user is already a member
  const isAlreadyMember = conversation.participants.some(
    p => p.toString() === userId.toString()
  );

  if (isAlreadyMember) {
    throw new ValidationError('User is already a member of this group');
  }

  // Check if group is at maximum capacity
  if (conversation.participants.length >= MAX_GROUP_PARTICIPANTS) {
    throw new ValidationError(`Group has reached maximum capacity of ${MAX_GROUP_PARTICIPANTS} members`);
  }

  // Add user to participants
  conversation.participants.push(userId);

  // Initialize unreadCount for new member
  conversation.unreadCount.set(userId.toString(), 0);

  await conversation.save();

  // Format and return updated conversation
  const formatted = await formatConversation(conversation, currentUserId);

  sendSuccess(res, {
    message: 'Member added to group successfully',
    conversation: formatted
  });
});
