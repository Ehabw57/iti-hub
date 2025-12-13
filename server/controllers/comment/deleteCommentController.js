const Comment = require('../../models/Comment');
const CommentLike = require('../../models/CommentLike');
const Post = require('../../models/Post');
const { canModifyComment } = require('../../utils/commentHelpers');

/**
 * Delete a comment
 * @route DELETE /comments/:id
 * @access Private
 */
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check authorization
    if (!canModifyComment(comment, user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    const postId = comment.post;
    const parentCommentId = comment.parentComment;
    let deletedCount = 1; // The comment itself

    // If this is a top-level comment, delete all its replies
    if (!parentCommentId || parentCommentId === null) {
      const repliesResult = await Comment.deleteMany({ parentComment: id });
      deletedCount += repliesResult.deletedCount;
    } else {
      // If this is a reply, decrement parent's repliesCount
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.repliesCount = Math.max(0, parentComment.repliesCount - 1);
        await parentComment.save();
      }
    }

    // Delete the comment
    await Comment.deleteOne({ _id: id });

    // Delete all likes for this comment (and its replies if any)
    await CommentLike.deleteMany({ comment: id });

    // Update post's commentsCount
    const post = await Post.findById(postId);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - deletedCount);
      await post.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
}

module.exports = deleteComment;
