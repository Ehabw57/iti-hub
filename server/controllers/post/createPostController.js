const Post = require('../../models/Post');
const {
  validatePostContent,
  validatePostImages,
  validatePostTags,
  buildPostResponse
} = require('../../utils/postHelpers');

/**
 * Create a new post
 * @route POST /posts
 * @access Private
 */
async function createPost(req, res) {
  try {
    const { content, images, tags, community } = req.body;
    const userId = req.user._id;

    // Validate content
    const contentValidation = validatePostContent(content, images);
    if (!contentValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: contentValidation.error
      });
    }

    // Validate images
    const imagesValidation = validatePostImages(images);
    if (!imagesValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: imagesValidation.error
      });
    }

    // Validate tags
    const tagsValidation = validatePostTags(tags);
    if (!tagsValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: tagsValidation.error
      });
    }

    // Create post
    const post = await Post.create({
      author: userId,
      content: content || '',
      images: images || [],
      tags: tags || [],
      community: community || null
    });

    // Populate author details
    await post.populate('author', 'username fullName profilePicture');

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: buildPostResponse(post, req.user)
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
}

module.exports = createPost;
