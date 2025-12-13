const Post = require('../../models/Post');
const { validatePostUpdate, canModifyPost, buildPostResponse } = require('../../utils/postHelpers');

/**
 * Update post
 * @route PATCH /posts/:id
 * @access Private
 */
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

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
        message: 'You do not have permission to update this post'
      });
    }

    // Validate updates
    const validation = validatePostUpdate(updates);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Apply updates
    if (updates.content !== undefined) {
      post.content = updates.content;
    }
    if (updates.tags !== undefined) {
      post.tags = updates.tags;
    }

    // Set editedAt timestamp
    post.editedAt = new Date();

    await post.save();

    // Populate author details
    await post.populate('author', 'username fullName profilePicture');

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: buildPostResponse(post, req.user)
      }
    });

  } catch (error) {
    console.error('Update post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message
    });
  }
}

module.exports = updatePost;
