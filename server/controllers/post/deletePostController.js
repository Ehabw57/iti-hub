const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const Comment = require('../../models/Comment');
const { canModifyPost } = require('../../utils/postHelpers');
const { updatePostCount } = require('../../utils/communityHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { sendNoContent } = require('../../utils/responseHelpers');
const {invalidateUserFeeds} = require('../../utils/feedCache');

/**
 * Delete post
 * @route DELETE /posts/:id
 * @access Private
 */
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find post
  const post = await Post.findById(id);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check permissions
  if (!(await canModifyPost(post, req.user))) {
    throw new ForbiddenError('You do not have permission to delete this post');
  }

  // Delete related data
  await PostLike.deleteMany({ post: id });
  await PostSave.deleteMany({ post: id });
  await Comment.deleteMany({ post: id });

  // Decrement community post count if this is a community post
  if (post.community) {
    await updatePostCount(post.community, -1);
  }

  // Delete post
  await Post.findByIdAndDelete(id);
  // Invalidate user feeds cache
  await invalidateUserFeeds(req.user._id);

  sendNoContent(res);
});

module.exports = deletePost;
