const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const { buildPostResponse } = require('../../utils/postHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Get post by ID
 * @route GET /posts/:id
 * @access Public
 */
const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  // Find post
  const post = await Post.findById(id)
    .populate('author', 'username fullName profilePicture')
    .populate('originalPost');

  if (!post) {
    throw new NotFoundError('Post not found');
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

  sendSuccess(res, { post: buildPostResponse(post, req.user, { isLiked, isSaved }) });
});

module.exports = getPost;
