const Post = require('../../models/Post');
const PostSave = require('../../models/PostSave');

/**
 * Save a post
 * @route POST /posts/:id/save
 * @access Private
 */
async function savePost(req, res) {
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

    // Check if already saved
    const existingSave = await PostSave.findOne({ user: userId, post: id });
    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: 'Post already saved'
      });
    }

    // Create save
    await PostSave.create({ user: userId, post: id });

    // Increment saves count
    post.savesCount += 1;
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post saved successfully',
      data: {
        isSaved: true
      }
    });

  } catch (error) {
    console.error('Save post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save post',
      error: error.message
    });
  }
}

/**
 * Unsave a post
 * @route DELETE /posts/:id/save
 * @access Private
 */
async function unsavePost(req, res) {
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

    // Check if saved
    const existingSave = await PostSave.findOne({ user: userId, post: id });
    if (!existingSave) {
      return res.status(400).json({
        success: false,
        message: 'Post not saved'
      });
    }

    // Delete save
    await PostSave.deleteOne({ user: userId, post: id });

    // Decrement saves count
    post.savesCount = Math.max(0, post.savesCount - 1);
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post unsaved successfully',
      data: {
        isSaved: false
      }
    });

  } catch (error) {
    console.error('Unsave post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unsave post',
      error: error.message
    });
  }
}

module.exports = {
  savePost,
  unsavePost
};
