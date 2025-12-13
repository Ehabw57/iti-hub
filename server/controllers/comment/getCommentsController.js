const Comment = require('../../models/Comment');
const CommentLike = require('../../models/CommentLike');
const Post = require('../../models/Post');
const { buildCommentResponse } = require('../../utils/commentHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');

/**
 * Get comments for a post (or replies for a comment)
 * @route GET /posts/:postId/comments
 * @access Public
 */
async function getComments(req, res) {
  try {
    const { postId } = req.params;
    const { parentCommentId } = req.query;
    const currentUserId = req.user?._id;

    // Pagination
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    let query = { post: postId };

    // If fetching replies for a specific comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
      query.parentComment = parentCommentId;
    } else {
      // Fetch only top-level comments (no parent)
      query.parentComment = null;
    }

    // Get comments
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture');

    // Get total count
    const total = await Comment.countDocuments(query);

    // Check if current user has liked each comment
    const commentsWithUserData = await Promise.all(
      comments.map(async (comment) => {
        let isLiked = false;

        if (currentUserId) {
          const like = await CommentLike.findOne({ user: currentUserId, comment: comment._id });
          isLiked = !!like;
        }

        return buildCommentResponse(comment, req.user, { isLiked });
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        comments: commentsWithUserData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments',
      error: error.message
    });
  }
}

module.exports = getComments;
