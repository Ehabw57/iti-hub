const Conversation = require('../../models/Conversation');
const { formatConversation } = require('../../utils/messageHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');

/**
 * Get all conversations for the authenticated user
 * GET /conversations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getConversations(req, res) {
  try {
    const userId = req.user._id;

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    // Query conversations where user is a participant
    const query = {
      participants: userId
    };

    // Get total count for pagination
    const total = await Conversation.countDocuments(query);

    // Fetch conversations with pagination
    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate('participants', 'username fullName profilePicture lastSeen')
      .populate('admin', 'username fullName profilePicture');

    // Format each conversation
    const formattedConversations = await Promise.all(
      conversations.map(conv => formatConversation(conv, userId))
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        conversations: formattedConversations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error in getConversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { getConversations };
