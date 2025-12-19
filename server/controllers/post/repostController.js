const Post = require('../../models/Post');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../utils/constants');
const { validateRepostComment, buildPostResponse } = require('../../utils/postHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');

/**
 * Repost a post
 * @route POST /posts/:id/repost
 * @access Private
 */
const repost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body || {};
  const userId = req.user._id;

  // Find original post
  const originalPost = await Post.findById(id);
  if (!originalPost) {
    throw new NotFoundError('Original post not found');
  }

  // Check if trying to repost own post
  if (originalPost.author.toString() === userId.toString()) {
    throw new ValidationError('Cannot repost your own post');
  }

  // Validate repost comment
  if (comment) {
    const validation = validateRepostComment(comment);
    if (!validation.isValid) {
      throw new ValidationError(validation.error);
    }
  }

  // Create repost
  const repostDoc = await Post.create({
    author: userId,
    content: comment || '',
    originalPost: id,
    repostComment: comment || null
  });

  // Increment repost count on original post
  originalPost.repostsCount += 1;
  await originalPost.save();

  // Create notification (don't block on failure) - NOT GROUPED (individual notification)
  try {
    await Notification.createOrUpdateNotification(
      originalPost.author,
      userId,
      NOTIFICATION_TYPES.REPOST,
      originalPost._id
    );
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
    // Continue anyway - notification failure shouldn't block the repost
  }

  // Populate author details
  await repostDoc.populate('author', 'username fullName profilePicture');
  await repostDoc.populate('originalPost');

  sendCreated(res, { post: buildPostResponse(repostDoc, req.user) }, 'Post reposted successfully');
});

module.exports = repost;
