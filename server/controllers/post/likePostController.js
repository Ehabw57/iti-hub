const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');
const { invalidateUserFeeds } = require('../../utils/feedCache');

/**
 * Like a post
 * @route POST /posts/:id/like
 * @access Private
 */
const likePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if post exists
  const post = await Post.findById(id);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if already liked
  const existingLike = await PostLike.findOne({ user: userId, post: id });
  if (existingLike) {
    throw new ValidationError('Post already liked');
  }

  // Create like
  await PostLike.create({ user: userId, post: post._id });

  // Increment likes count
  post.likesCount += 1;
  await post.save();

  // Invalidate user's feeds to reflect new like
  await invalidateUserFeeds(userId.toString());

  // Create or update notification (don't block on failure)
  try {
    await Notification.createOrUpdateNotification(
      post.author,
      userId,
      NOTIFICATION_TYPES.LIKE,
      post._id
    );
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Continue anyway - notification failure shouldn't block the like
  }

  sendSuccess(res, { isLiked: true, likesCount: post.likesCount }, 'Post liked successfully');
});

/**
 * Unlike a post
 * @route DELETE /posts/:id/like
 * @access Private
 */
const unlikePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if post exists
  const post = await Post.findById(id);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if liked
  const existingLike = await PostLike.findOne({ user: userId, post: id });
  if (!existingLike) {
    throw new ValidationError('Post not liked');
  }

  // Delete like
  await PostLike.deleteOne({ user: userId, post: id });

  // Decrement likes count
  post.likesCount = Math.max(0, post.likesCount - 1);
  await post.save();

  // Invalidate user's feeds to reflect unlike
  await invalidateUserFeeds(userId.toString());

  sendSuccess(res, { isLiked: false, likesCount: post.likesCount }, 'Post unliked successfully');
});

module.exports = {
  likePost,
  unlikePost
};
