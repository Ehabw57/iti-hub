/**
 * Post Helper Utilities
 * Validation and response building functions for posts
 */

const PostLike = require('../models/PostLike');
const PostSave = require('../models/PostSave');
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
 * @param {Object} user_id - Current user id (optional)
 * @param {Object} options - Additional options like isLiked, isSaved
 * @returns {Object} - Formatted post response
 */
async function buildPostResponse(post, user_id = null, options = {}) {
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
  if (user_id) {
    // fetch posts likes and saves 
    response.isLiked = !!(await PostLike.exists({ post: postObj._id, user: user_id }));
    response.isSaved = !!(await PostSave.exists({ post: postObj._id, user: user_id }));
    
    // If post is in a community, include user's role in that community
    if (postObj.community) {
      const CommunityMember = require('../models/CommunityMember');
      const membership = await CommunityMember.findOne({
        user: user_id,
        community: postObj.community._id || postObj.community
      });
      
      if (membership) {
        // Add role to community object if it exists
        if (response.community && typeof response.community === 'object') {
          response.community.userRole = membership.role;
        }
      }
    }
  }

  return response;
}

/**
 * Check if user can edit/delete post
 * @param {Object} post - Post document
 * @param {Object} user - Current user
 * @returns {Promise<boolean>}
 */
async function canModifyPost(post, user) {
  if (!user) return false;
  
  // Handle both populated and unpopulated author
  const postAuthorId = post.author._id || post.author;
  const userId = user._id;
  
  console.log("Checking permissions for user:", userId, "on post:", postAuthorId);
  
  // Owner can modify
  if (postAuthorId.toString() === userId.toString()) {
    return true;
  }

  // Admin can modify
  if (user.role === 'admin') {
    return true;
  }

  // Check if user is moderator or owner of the post's community
  if (post.community) {
    const CommunityMember = require('../models/CommunityMember');
    const communityId = post.community._id || post.community;
    
    const membership = await CommunityMember.findOne({
      user: userId,
      community: communityId
    });

    if (membership && (membership.role === 'moderator' || membership.role === 'owner')) {
      return true;
    }
  }
  
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
