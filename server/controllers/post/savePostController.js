const Post = require('../../models/Post');
const PostSave = require('../../models/PostSave');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Save a post
 * @route POST /posts/:id/save
 * @access Private
 */
const savePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if post exists
  const post = await Post.findById(id);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if already saved
  const existingSave = await PostSave.findOne({ user: userId, post: id });
  if (existingSave) {
    throw new ValidationError('Post already saved');
  }

  // Create save
  await PostSave.create({ user: userId, post: id });

  // Increment saves count
  post.savesCount += 1;
  await post.save();

  sendSuccess(res, { isSaved: true }, 'Post saved successfully');
});

/**
 * Unsave a post
 * @route DELETE /posts/:id/save
 * @access Private
 */
const unsavePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if post exists
  const post = await Post.findById(id);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if saved
  const existingSave = await PostSave.findOne({ user: userId, post: id });
  if (!existingSave) {
    throw new ValidationError('Post not saved');
  }

  // Delete save
  await PostSave.deleteOne({ user: userId, post: id });

  // Decrement saves count
  post.savesCount = Math.max(0, post.savesCount - 1);
  await post.save();

  sendSuccess(res, { isSaved: false }, 'Post unsaved successfully');
});

module.exports = {
  savePost,
  unsavePost
};
