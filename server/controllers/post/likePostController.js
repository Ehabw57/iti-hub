const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');

/**
 * Like a post
 * @route POST /posts/:id/like
 * @access Private
 */
async function likePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if post exists
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    const existingLike = await PostLike.findOne({ user: userId, post: id });
    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked'
      });
    }

    // Create like
    await PostLike.create({ user: userId, post: id });

    // Increment likes count
    post.likesCount += 1;
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      data: {
        isLiked: true,
        likesCount: post.likesCount
      }
    });

  } catch (error) {
    console.error('Like post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to like post',
      error: error.message
    });
  }
}

/**
 * Unlike a post
 * @route DELETE /posts/:id/like
 * @access Private
 */
async function unlikePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if post exists
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if liked
    const existingLike = await PostLike.findOne({ user: userId, post: id });
    if (!existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Post not liked'
      });
    }

    // Delete like
    await PostLike.deleteOne({ user: userId, post: id });

    // Decrement likes count
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        isLiked: false,
        likesCount: post.likesCount
      }
    });

  } catch (error) {
    console.error('Unlike post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlike post',
      error: error.message
    });
  }
}

module.exports = {
  likePost,
  unlikePost
};
