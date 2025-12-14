const Post = require('../../models/Post');
const {
  validatePostContent,
  validatePostTags,
  buildPostResponse
} = require('../../utils/postHelpers');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { CLOUDINARY_FOLDER_POST, IMAGE_CONFIGS} = require('../../utils/constants');

/**
 * Create a new post
 * @route POST /posts
 * @access Private
 */
async function createPost(req, res) {
  try {
    const { content, tags, community } = req.body;
    const userId = req.user._id;
    let imageUrls = [];

    // Validate content
    const contentValidation = validatePostContent(content, req.files);
    if (!contentValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: contentValidation.error
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

    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      try {
        // Process and upload all images in parallel
        const uploadPromises = req.files.map(async (file, index) => {
          // Process image with Sharp
          const processedBuffer = await processImage(file.buffer, IMAGE_CONFIGS.POST);
          
          // Upload to Cloudinary
          const publicId = `${CLOUDINARY_FOLDER_POST}/user_${userId}_${Date.now()}_${index}`;
          const uploadResult = await uploadToCloudinary(processedBuffer, CLOUDINARY_FOLDER_POST, publicId);
          
          return uploadResult.secure_url;
        });

        imageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Image processing/upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to process or upload images'
        });
      }
    }


    // Create post
    const post = await Post.create({
      author: userId,
      content: content || '',
      images: imageUrls,
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
