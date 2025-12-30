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
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');

/**
 * Create new group conversation
 * POST /conversations/group
 */
exports.createGroupConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  console.log(req.body);
  let { name, participantIds, image } = req.body;

  // Validate name is provided
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Group name is required');
  }

  // Trim name
  name = name.trim();

  // Validate name length
  if (name.length < MIN_GROUP_NAME_LENGTH) {
    throw new ValidationError(`Group name must be at least ${MIN_GROUP_NAME_LENGTH} characters`);
  }

  if (name.length > MAX_GROUP_NAME_LENGTH) {
    throw new ValidationError(`Group name cannot exceed ${MAX_GROUP_NAME_LENGTH} characters`);
  }

  // Validate participantIds is provided
  if (!participantIds) {
    throw new ValidationError('participantIds is required');
  }

  participantIds = JSON.parse(participantIds);

  // Validate participantIds is array
  if (!Array.isArray(participantIds)) {
    throw new ValidationError('participantIds must be an array');
  }

  // Check participant count (excluding creator who will be added)
  const totalParticipants = participantIds.length + 1; // +1 for creator

  if (totalParticipants < MIN_GROUP_PARTICIPANTS) {
    throw new ValidationError(`Group must have at least ${MIN_GROUP_PARTICIPANTS} participants`);
  }

  if (totalParticipants > MAX_GROUP_PARTICIPANTS) {
    throw new ValidationError(`Group cannot exceed ${MAX_GROUP_PARTICIPANTS} participants`);
  }

  // Validate all participantIds are valid ObjectIds
  for (const id of participantIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid participantId format');
    }
  }

  // Check if creator is in participantIds
  const creatorIdString = currentUserId.toString();
  if (participantIds.some(id => id.toString() === creatorIdString)) {
    throw new ValidationError('Creator is automatically added to the group');
  }

  // Check for duplicate participantIds
  const uniqueIds = new Set(participantIds.map(id => id.toString()));
  if (uniqueIds.size !== participantIds.length) {
    throw new ValidationError('Cannot have duplicate participants');
  }

  // Verify all participants exist
  const participants = await User.find({
    _id: { $in: participantIds }
  });

  if (participants.length !== participantIds.length) {
    throw new NotFoundError('One or more participants not found');
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

  sendCreated(res, {
    message: 'Group conversation created successfully',
    conversation: formatted
  });
});
