const Post = require('../../models/Post');
const PostSave = require('../../models/PostSave');
const PostLike = require('../../models/PostLike');
const { buildPostResponse } = require('../../utils/postHelpers');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../../utils/constants');

/**
 * Get saved posts for current user
 * @route GET /posts/saved
 * @access Private
 */
async function getSavedPosts(req, res) {
  try {
    const userId = req.user._id;

    // Pagination
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Get saved post IDs
    const savedPosts = await PostSave.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('post');

    const postIds = savedPosts.map(save => save.post);

    // Get posts
    const posts = await Post.find({ _id: { $in: postIds } })
      .populate('author', 'username fullName profilePicture')
      .populate('originalPost');

    // Get total count
    const total = await PostSave.countDocuments({ user: userId });

    // Check if user has liked each post
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const like = await PostLike.findOne({ user: userId, post: post._id });
        const isLiked = !!like;

        return buildPostResponse(post, req.user, { isLiked, isSaved: true });
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
    console.error('Get saved posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve saved posts',
      error: error.message
    });
  }
}

module.exports = getSavedPosts;
