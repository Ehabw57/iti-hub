const Comment = require('../../models/Comment');
const CommentLike = require('../../models/CommentLike');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Like a comment
 * @route POST /comments/:id/like
 * @access Private
 */
const likeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find comment
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new NotFoundError('Comment');
  }

  // Check if already liked
  const existingLike = await CommentLike.findOne({ user: userId, comment: id });
  if (existingLike) {
    throw new ValidationError('Comment already liked');
  }

  // Create like
  await CommentLike.create({ user: userId, comment: id });

  // Increment likes count
  comment.likesCount += 1;
  await comment.save();

  // Create or update notification (don't block on failure)
  // For comment likes, we group by the comment itself (not the post)
  try {
    await Notification.createOrUpdateNotification(
      comment.author,
      userId,
      NOTIFICATION_TYPES.COMMENT_LIKE,
      comment._id, // target: navigate to comment
      comment._id  // groupingKey: group by comment (multiple users liking same comment)
    );
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Continue anyway - notification failure shouldn't block the like
  }

  return sendSuccess(
    res,
    {
      isLiked: true,
      likesCount: comment.likesCount
    },
    'Comment liked successfully'
  );
});

/**
 * Unlike a comment
 * @route DELETE /comments/:id/like
 * @access Private
 */
const unlikeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find comment
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new NotFoundError('Comment');
  }

  // Check if liked
  const existingLike = await CommentLike.findOne({ user: userId, comment: id });
  if (!existingLike) {
    throw new ValidationError('Comment not liked');
  }

  // Delete like
  await CommentLike.deleteOne({ user: userId, comment: id });

  // Decrement likes count
  comment.likesCount = Math.max(0, comment.likesCount - 1);
  await comment.save();

  return sendSuccess(
    res,
    {
      isLiked: false,
      likesCount: comment.likesCount
    },
    'Comment unliked successfully'
  );
});

module.exports = { likeComment, unlikeComment };
