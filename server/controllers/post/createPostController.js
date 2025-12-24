const Post = require('../../models/Post');
const Community = require('../../models/Community');
const {
  validatePostContent,
  validatePostTags,
  buildPostResponse
} = require('../../utils/postHelpers');
const { canPostToCommunity, updatePostCount } = require('../../utils/communityHelpers');
const { processImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { CLOUDINARY_FOLDER_POST, IMAGE_CONFIGS} = require('../../utils/constants');
const mongoose = require('mongoose');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, NotFoundError, ForbiddenError, InternalError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');
const {InvalidateUserFeed} = require('../../utils/feedCache');

/**
 * Create a new post
 * @route POST /posts
 * @access Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { content, tags, community } = req.body;
  const userId = req.user._id;
  let imageUrls = [];

  // Validate community if provided
  if (community) {
    // Validate community ID format
    if (!mongoose.Types.ObjectId.isValid(community)) {
      throw new ValidationError('Invalid community ID');
    }

    // Check if community exists
    const communityExists = await Community.findById(community);
    if (!communityExists) {
      throw new NotFoundError('Community not found');
    }

    // Check if user can post to this community
    const canPost = await canPostToCommunity(userId, community);
    if (!canPost) {
      throw new ForbiddenError('You must be a member of this community to post');
    }
  }

  // Validate content
  const contentValidation = validatePostContent(content, req.files);
  if (!contentValidation.isValid) {
    throw new ValidationError(contentValidation.error);
  }

  // Validate tags
  const tagsValidation = validatePostTags(tags);
  if (!tagsValidation.isValid) {
    throw new ValidationError(tagsValidation.error);
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
      throw new InternalError('Failed to process or upload images');
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

  // Increment community post count if posting to a community
  if (community) {
    await updatePostCount(community, 1);
  }


  // Populate author details
  await post.populate('author', 'username fullName profilePicture');
  //invalidate user feed cache
  await InvalidateUserFeed(req.user._id);

  sendCreated(res, { post: buildPostResponse(post, req.user) }, 'Post created successfully');
});

module.exports = createPost;
