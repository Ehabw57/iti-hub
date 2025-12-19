const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const { formatConversation } = require('../../utils/messageHelpers');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { 
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH
} = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError, InternalError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Update group conversation details (admin only)
 * PUT /conversations/:conversationId
 * Supports updating name and/or image
 */
exports.updateGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { conversationId } = req.params;
  let { name } = req.body;
  const imageFile = req.file;

  // Validate conversationId
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ValidationError('Invalid conversationId');
  }

  // Check if at least one update is provided
  if (!name && !imageFile) {
    throw new ValidationError('Provide name or image to update');
  }

  // Trim and validate name if provided
  if (name) {
    name = name.trim();

    if (name.length < MIN_GROUP_NAME_LENGTH) {
      throw new ValidationError(`Group name must be at least ${MIN_GROUP_NAME_LENGTH} characters`);
    }

    if (name.length > MAX_GROUP_NAME_LENGTH) {
      throw new ValidationError(`Group name cannot exceed ${MAX_GROUP_NAME_LENGTH} characters`);
    }
  }

  // Check if conversation exists
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  // Check if conversation is a group
  if (conversation.type !== 'group') {
    throw new ValidationError('Can only update group conversations');
  }

  // Check if current user is admin
  if (conversation.admin.toString() !== currentUserId.toString()) {
    throw new ForbiddenError('Only group admin can update group details');
  }

  // Update name if provided
  if (name) {
    conversation.name = name;
  }

  // Upload and update image if provided
  if (imageFile) {
    try {
      const result = await uploadToCloudinary(imageFile.buffer, 'groups');
      conversation.image = result.secure_url;
    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      throw new InternalError('Failed to upload image');
    }
  }

  await conversation.save();

  // Format and return updated conversation
  const formatted = await formatConversation(conversation, currentUserId);

  sendSuccess(res, {
    message: 'Group updated successfully',
    conversation: formatted
  });
});
