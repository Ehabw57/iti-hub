const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const Comment = require('../../models/Comment');
const { canModifyPost } = require('../../utils/postHelpers');
const { updatePostCount } = require('../../utils/communityHelpers');

/**
 * Delete post
 * @route DELETE /posts/:id
 * @access Private
 */
async function deletePost(req, res) {
  try {
    const { id } = req.params;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check permissions
    if (!canModifyPost(post, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this post'
      });
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

    return res.status(204).send();

  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
}

module.exports = deletePost;
