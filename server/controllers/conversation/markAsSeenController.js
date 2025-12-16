const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { isParticipant } = require('../../utils/messageHelpers');
const { getSocketServer, getUserSocketId } = require('../../utils/socketServer');

/**
 * Mark all messages in a conversation as seen by current user
 * PUT /conversations/:conversationId/seen
 */
exports.markConversationAsSeen = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId'
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    const userIsParticipant = await isParticipant(conversationId, currentUserId);
    if (!userIsParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Reset unreadCount for current user
    conversation.unreadCount.set(currentUserId.toString(), 0);
    await conversation.save();

    // Find all messages in conversation not sent by current user
    // and not already seen by current user
    const messagesToMark = await Message.find({
      conversation: conversationId,
      sender: { $ne: currentUserId },
      'seenBy.userId': { $ne: currentUserId }
    });

    // Mark messages as seen
    let markedCount = 0;
    if (messagesToMark.length > 0) {
      for (const message of messagesToMark) {
        message.seenBy.push({
          userId: currentUserId,
          seenAt: new Date()
        });
        message.status = 'seen';
        await message.save();
        markedCount++;
      }
    }

    // Emit real-time "seen" event to other participants
    try {
      const io = getSocketServer();
      if (io) {
        const participants = conversation.participants.map(p => p.toString());
        participants.forEach(participantId => {
          if (participantId !== currentUserId.toString()) {
            const socketIds = getUserSocketId(participantId);
            socketIds.forEach(socketId => {
              io.to(socketId).emit('message:seen', {
                conversationId: conversationId,
                userId: currentUserId.toString(),
                timestamp: new Date()
              });
            });
          }
        });
      }
    } catch (socketError) {
      // Log but don't fail the request if socket emission fails
      console.error('Error emitting seen event:', socketError);
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation marked as seen',
      data: {
        unreadCount: 0,
        markedCount
      }
    });
  } catch (error) {
    console.error('Error in markConversationAsSeen:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking conversation as seen',
      error: error.message
    });
  }
};
