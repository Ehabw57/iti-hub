const Conversation = require('../../models/Conversation');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get unread messages count for authenticated user
 * Returns the NUMBER OF CONVERSATIONS that have unread messages (not total unread messages)
 * Each conversation contributes at most 1 to the count if it has any unread messages
 * 
 * GET /conversations/unread/count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUnreadMessagesCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userIdStr = userId.toString();

  // Use aggregation for optimized query performance
  // Count conversations where unreadCount[userId] > 0
  const result = await Conversation.aggregate([
    // Match conversations where user is a participant
    { $match: { participants: userId } },
    // Convert unreadCount Map to array for filtering
    { $addFields: { 
      unreadArray: { $objectToArray: '$unreadCount' }
    }},
    // Filter to only include conversations with unread messages for this user
    { $match: {
      'unreadArray': {
        $elemMatch: {
          k: userIdStr,
          v: { $gt: 0 }
        }
      }
    }},
    // Count the matching conversations
    { $count: 'unreadConversationsCount' }
  ]);

  // Extract count from result (returns empty array if no matches)
  const unreadCount = result.length > 0 ? result[0].unreadConversationsCount : 0;

  sendSuccess(res, { unreadCount });
});

module.exports = { getUnreadMessagesCount };
