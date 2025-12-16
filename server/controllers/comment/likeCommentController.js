const Comment = require('../../models/Comment');
const CommentLike = require('../../models/CommentLike');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');

/**
 * Like a comment
 * @route POST /comments/:id/like
 * @access Private
 */
async function likeComment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if already liked
    const existingLike = await CommentLike.findOne({ user: userId, comment: id });
    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Comment already liked'
      });
    }

    // Create like
    await CommentLike.create({ user: userId, comment: id });

    // Increment likes count
    comment.likesCount += 1;
    await comment.save();

    // Create or update notification (don't block on failure)
    try {
      await Notification.createOrUpdateNotification(
        comment.author,
        userId,
        NOTIFICATION_TYPES.COMMENT_LIKE,
        comment._id
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Continue anyway - notification failure shouldn't block the like
    }

    return res.status(200).json({
      success: true,
      message: 'Comment liked successfully',
      data: {
        isLiked: true,
        likesCount: comment.likesCount
      }
    });

  } catch (error) {
    console.error('Like comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: error.message
    });
  }
}

/**
 * Unlike a comment
 * @route DELETE /comments/:id/like
 * @access Private
 */
async function unlikeComment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if liked
    const existingLike = await CommentLike.findOne({ user: userId, comment: id });
    if (!existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Comment not liked'
      });
    }

    // Delete like
    await CommentLike.deleteOne({ user: userId, comment: id });

    // Decrement likes count
    comment.likesCount = Math.max(0, comment.likesCount - 1);
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment unliked successfully',
      data: {
        isLiked: false,
        likesCount: comment.likesCount
      }
    });

  } catch (error) {
    console.error('Unlike comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlike comment',
      error: error.message
    });
  }
}

module.exports = { likeComment, unlikeComment };
