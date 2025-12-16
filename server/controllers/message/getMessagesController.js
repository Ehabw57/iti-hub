const mongoose = require('mongoose');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { isParticipant, formatMessage } = require('../../utils/messageHelpers');

/**
 * Get messages for a conversation with cursor-based pagination
 * GET /conversations/:conversationId/messages
 */
exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;
    const { cursor, limit = 50 } = req.query;

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

    // Parse and validate limit (default 50, max 100)
    let parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      parsedLimit = 50;
    }
    if (parsedLimit > 100) {
      parsedLimit = 100;
    }

    // Build query
    const query = { conversation: conversationId };

    // Handle cursor for pagination
    if (cursor) {
      // Validate cursor is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cursor format'
        });
      }
      // Get messages older than cursor (for reverse chronological order)
      query._id = { $lt: cursor };
    }

    // Get total count
    const total = await Message.countDocuments({ conversation: conversationId });

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .limit(parsedLimit + 1) // Fetch one extra to check if there are more
      .populate('sender', 'username fullName profilePicture isOnline lastSeen')
      .lean();

    // Check if there are more messages
    const hasMore = messages.length > parsedLimit;
    if (hasMore) {
      messages.pop(); // Remove extra message
    }

    // Format messages
    const formattedMessages = messages.map(msg => formatMessage(msg));

    // Get cursor for next page (last message ID)
    const nextCursor = hasMore && messages.length > 0 
      ? messages[messages.length - 1]._id.toString() 
      : null;

    return res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: {
        messages: formattedMessages,
        total,
        hasMore,
        cursor: nextCursor
      }
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
      error: error.message
    });
  }
};
