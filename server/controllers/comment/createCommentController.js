const Comment = require('../../models/Comment');
const Post = require('../../models/Post');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { validateCommentContent, buildCommentResponse, canHaveReplies } = require('../../utils/commentHelpers');

/**
 * Create a new comment or reply
 * @route POST /posts/:postId/comments
 * @access Private
 */
async function createComment(req, res) {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user._id;

    // Validate content
    const validation = validateCommentContent(content);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    let parentComment = null;

    // If this is a reply, validate parent comment
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Check if parent comment belongs to the same post
      if (parentComment.post.toString() !== postId) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to this post'
        });
      }

      // Check if parent comment can have replies (no nested replies)
      if (!canHaveReplies(parentComment)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reply to a reply. You can only reply to top-level comments.'
        });
      }

      // Increment replies count on parent comment
      parentComment.repliesCount += 1;
      await parentComment.save();
    }

    // Create comment
    const comment = await Comment.create({
      author: userId,
      post: postId,
      content,
      parentComment: parentCommentId || null
    });

    // Increment comments count on post
    post.commentsCount += 1;
    await post.save();

    // Create notifications (don't block on failure)
    try {
      if (parentCommentId && parentComment) {
        // This is a reply - notify the parent comment author
        await Notification.createOrUpdateNotification(
          parentComment.author,
          userId,
          NOTIFICATION_TYPES.REPLY,
          parentComment._id
        );
      } else {
        // This is a top-level comment - notify the post author
        await Notification.createOrUpdateNotification(
          post.author,
          userId,
          NOTIFICATION_TYPES.COMMENT,
          post._id
        );
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Continue anyway - notification failure shouldn't block the comment
    }

    // Populate author details
    await comment.populate('author', 'username fullName profilePicture');

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment: buildCommentResponse(comment, req.user)
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
}

module.exports = createComment;
