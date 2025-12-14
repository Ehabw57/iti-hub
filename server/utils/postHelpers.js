/**
 * Post Helper Utilities
 * Validation and response building functions for posts
 */

const {
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_TAGS,
  MAX_REPOST_COMMENT_LENGTH,
  UPDATABLE_POST_FIELDS
} = require('./constants');

/**
 * Validate post content
 * @param {string} content - Post content
 * @param {Array} images - Post images
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validatePostContent(content, images = []) {
  if (!content && (!images || images.length === 0)) {
    return { isValid: false, error: 'Content or images required' };
  }

  if (content && content.length > MAX_POST_CONTENT_LENGTH) {
    return { isValid: false, error: `Content cannot exceed ${MAX_POST_CONTENT_LENGTH} characters` };
  }

  return { isValid: true };
}


/**
 * Validate post tags
 * @param {Array} tags - Array of tag IDs
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validatePostTags(tags) {
  if (!tags) return { isValid: true };
  
  if (!Array.isArray(tags)) {
    return { isValid: false, error: 'Tags must be an array' };
  }

  if (tags.length > MAX_POST_TAGS) {
    return { isValid: false, error: `Cannot add more than ${MAX_POST_TAGS} tags` };
  }

  return { isValid: true };
}

/**
 * Validate repost comment
 * @param {string} comment - Repost comment
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validateRepostComment(comment) {
  if (!comment) return { isValid: true };
  
  if (comment.length > MAX_REPOST_COMMENT_LENGTH) {
    return { isValid: false, error: `Repost comment cannot exceed ${MAX_REPOST_COMMENT_LENGTH} characters` };
  }

  return { isValid: true };
}

/**
 * Validate post update fields
 * @param {Object} updates - Fields to update
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validatePostUpdate(updates) {
  const invalidFields = Object.keys(updates).filter(
    field => !UPDATABLE_POST_FIELDS.includes(field)
  );

  if (invalidFields.length > 0) {
    return { 
      isValid: false, 
      error: `Cannot update fields: ${invalidFields.join(', ')}. Only content and tags can be updated.` 
    };
  }

  if (updates.content !== undefined) {
    const contentValidation = validatePostContent(updates.content, [' ']); // Dummy image to pass content check
    if (!contentValidation.isValid) {
      return contentValidation;
    }
  }

  if (updates.tags !== undefined) {
    const tagsValidation = validatePostTags(updates.tags);
    if (!tagsValidation.isValid) {
      return tagsValidation;
    }
  }

  return { isValid: true };
}

/**
 * Build post response object
 * @param {Object} post - Post document
 * @param {Object} user - Current user (optional)
 * @param {Object} options - Additional options like isLiked, isSaved
 * @returns {Object} - Formatted post response
 */
function buildPostResponse(post, user = null, options = {}) {
  const postObj = post.toObject ? post.toObject() : post;
  
  const response = {
    _id: postObj._id,
    author: postObj.author,
    content: postObj.content,
    images: postObj.images || [],
    tags: postObj.tags || [],
    community: postObj.community,
    repostComment: postObj.repostComment,
    originalPost: postObj.originalPost,
    likesCount: postObj.likesCount || 0,
    commentsCount: postObj.commentsCount || 0,
    repostsCount: postObj.repostsCount || 0,
    savesCount: postObj.savesCount || 0,
    createdAt: postObj.createdAt,
    updatedAt: postObj.updatedAt,
    editedAt: postObj.editedAt
  };

  // Add user-specific fields if user is provided
  if (user && options.isLiked !== undefined) {
    response.isLiked = options.isLiked;
  }

  if (user && options.isSaved !== undefined) {
    response.isSaved = options.isSaved;
  }

  return response;
}

/**
 * Check if user can edit/delete post
 * @param {Object} post - Post document
 * @param {Object} user - Current user
 * @returns {boolean}
 */
function canModifyPost(post, user) {
  if (!user) return false;
  
  // Owner can modify
  if (post.author.toString() === user._id.toString()) {
    return true;
  }

  // Admin can modify
  if (user.role === 'admin') {
    return true;
  }

  // TODO: Check if user is moderator of the community (when communities are implemented)
  
  return false;
}

module.exports = {
  validatePostContent,
  validatePostTags,
  validateRepostComment,
  validatePostUpdate,
  buildPostResponse,
  canModifyPost
};
