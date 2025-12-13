const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const { buildPostResponse } = require('../../utils/postHelpers');

/**
 * Get post by ID
 * @route GET /posts/:id
 * @access Public
 */
async function getPost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Find post
    const post = await Post.findById(id)
      .populate('author', 'username fullName profilePicture')
      .populate('originalPost');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user has liked/saved the post
    let isLiked = false;
    let isSaved = false;

    if (userId) {
      const like = await PostLike.findOne({ user: userId, post: id });
      isLiked = !!like;

      const save = await PostSave.findOne({ user: userId, post: id });
      isSaved = !!save;
    }

    return res.status(200).json({
      success: true,
      data: {
        post: buildPostResponse(post, req.user, { isLiked, isSaved })
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve post',
      error: error.message
    });
  }
}

module.exports = getPost;
