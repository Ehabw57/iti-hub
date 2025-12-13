const Post = require('../../models/Post');
const { validateRepostComment, buildPostResponse } = require('../../utils/postHelpers');

/**
 * Repost a post
 * @route POST /posts/:id/repost
 * @access Private
 */
async function repost(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};
    const userId = req.user._id;

    // Find original post
    const originalPost = await Post.findById(id);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found'
      });
    }

    // Check if trying to repost own post
    if (originalPost.author.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot repost your own post'
      });
    }

    // Validate repost comment
    if (comment) {
      const validation = validateRepostComment(comment);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
    }

    // Create repost
    const repost = await Post.create({
      author: userId,
      content: comment || '',
      originalPost: id,
      repostComment: comment || null
    });

    // Increment repost count on original post
    originalPost.repostsCount += 1;
    await originalPost.save();

    // Populate author details
    await repost.populate('author', 'username fullName profilePicture');
    await repost.populate('originalPost');

    return res.status(201).json({
      success: true,
      message: 'Post reposted successfully',
      data: {
        post: buildPostResponse(repost, req.user)
      }
    });

  } catch (error) {
    console.error('Repost error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to repost',
      error: error.message
    });
  }
}

module.exports = repost;
