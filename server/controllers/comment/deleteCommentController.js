const Comment = require('../../models/Comment');
const CommentLike = require('../../models/CommentLike');
const Post = require('../../models/Post');
const { canModifyComment } = require('../../utils/commentHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
const {invalidateUserFeeds} = require("../../utils/feedCache")

/**
 * Delete a comment
 * @route DELETE /comments/:id
 * @access Private
 */
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  // Find comment
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new NotFoundError('Comment');
  }

  await comment.populate('post');

  // Check authorization
  if (!canModifyComment(comment, user)) {
    throw new ForbiddenError('Not authorized to delete this comment');
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
  replies = await Comment.find({ parentComment: id }); 
  if (replies.length > 0) {
    const replyIds = replies.map(reply => reply._id);
    const replyDeleteResult = await Comment.deleteMany({ _id: { $in: replyIds } });
    deletedCount += replyDeleteResult.deletedCount;
  }

  // Delete all likes for this comment (and its replies if any)
  await CommentLike.deleteMany({ comment: id });

  // Update post's commentsCount
  const post = await Post.findById(postId);
  if (post) {
    post.commentsCount = Math.max(0, post.commentsCount - deletedCount);
    await post.save();
  }

  // Invalidate user feeds cache
  await invalidateUserFeeds(user._id);

  return sendSuccess(
    res,
    {},
    `${deletedCount} Comment${deletedCount > 1 ? 's' : ''} deleted successfully`
  );
});

module.exports = deleteComment;
