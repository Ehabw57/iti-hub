const Post = require('../../models/Post');
const User = require('../../models/User');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const { buildPostResponse } = require('../../utils/postHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');

/**
 * Get posts by user
 * @route GET /users/:userId/posts
 * @access Public
 */
async function getUserPosts(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;

    // Pagination
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get posts
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate('originalPost');

    // Get total count
    const total = await Post.countDocuments({ author: userId });

    // Check if current user has liked/saved each post
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false;
        let isSaved = false;

        if (currentUserId) {
          const like = await PostLike.findOne({ user: currentUserId, post: post._id });
          isLiked = !!like;

          const save = await PostSave.findOne({ user: currentUserId, post: post._id });
          isSaved = !!save;
        }

        return buildPostResponse(post, req.user, { isLiked, isSaved });
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        posts: postsWithUserData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user posts',
      error: error.message
    });
  }
}

module.exports = getUserPosts;
