const mongoose = require('mongoose');
const TrackChatMessage = require('../../models/TrackChatMessage');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess, sendCreated, sendNoContent } = require('../../utils/responseHelpers');
const { canDeleteChatMessage } = require('../../middlewares/checkRoles');

const SENDER_FIELDS = 'username fullName profilePicture role';

/**
 * List chat messages for a track (paginated, newest first)
 * GET /courses/tracks/:trackId/chat?page=1&limit=50
 * @access Private (track members)
 */
const listChatMessages = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    TrackChatMessage.find({ trackId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', SENDER_FIELDS)
      .lean(),
    TrackChatMessage.countDocuments({ trackId }),
  ]);

  const hasNextPage = skip + messages.length < total;

  return sendSuccess(res, { messages: messages.reverse() }, null, 200, {
    pagination: { page, limit, total, hasNextPage },
  });
});

/**
 * Send a chat message to a track
 * POST /courses/tracks/:trackId/chat
 * Body: { content }
 * @access Private (track members)
 */
const sendChatMessage = asyncHandler(async (req, res) => {
  const track = req.track;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new ValidationError('Message content is required');
  }

  const message = await TrackChatMessage.create({
    trackId: track._id,
    senderId: req.user._id,
    message: content.trim(),
  });

  await message.populate('senderId', SENDER_FIELDS);

  // Broadcast to the track's socket room
  try {
    const { getIO } = require('../../utils/socketServer');
    const io = getIO();
    io.to(`track:${track._id}`).emit('track:chat:message', {
      trackId: String(track._id),
      message,
    });
  } catch (e) {
    console.error('Failed to broadcast chat message:', e.message);
  }

  return sendCreated(res, { message }, 'Message sent');
});

/**
 * Delete a chat message
 * DELETE /courses/chat/:id
 * @access Private (own messages, or track managers for any message)
 */
const deleteChatMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ValidationError('Invalid message ID');

  const message = await TrackChatMessage.findById(id);
  if (!message) throw new NotFoundError('Message');

  const track = req.track || (await require('../../models/Track').findById(message.trackId));

  if (!canDeleteChatMessage(req.user, track, message)) {
    throw new ForbiddenError('You can only delete your own messages');
  }

  await TrackChatMessage.findByIdAndDelete(id);

  // Broadcast deletion to the track's socket room
  try {
    const { getIO } = require('../../utils/socketServer');
    const io = getIO();
    io.to(`track:${message.trackId}`).emit('track:chat:deleted', {
      trackId: String(message.trackId),
      messageId: String(message._id),
    });
  } catch (e) {
    console.error('Failed to broadcast chat deletion:', e.message);
  }

  return sendNoContent(res);
});

module.exports = {
  listChatMessages,
  sendChatMessage,
  deleteChatMessage,
};