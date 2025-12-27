/**
 * Comment Helper Utilities
 * Validation and response building functions for comments
 */

const {
  MIN_COMMENT_CONTENT_LENGTH,
  MAX_COMMENT_CONTENT_LENGTH,
  PUBLIC_COMMENT_FIELDS,
  UPDATABLE_COMMENT_FIELDS
} = require('./constants');

/**
 * Validate comment content
 * @param {string} content - Comment content
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validateCommentContent(content) {
  if (!content || content.trim().length < MIN_COMMENT_CONTENT_LENGTH) {
    return { isValid: false, error: `Content must be at least ${MIN_COMMENT_CONTENT_LENGTH} character` };
  }

  if (content.length > MAX_COMMENT_CONTENT_LENGTH) {
    return { isValid: false, error: `Content cannot exceed ${MAX_COMMENT_CONTENT_LENGTH} characters` };
  }

  return { isValid: true };
}

/**
 * Validate comment update fields
 * @param {Object} updates - Fields to update
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validateCommentUpdate(updates) {
  const invalidFields = Object.keys(updates).filter(
    field => !UPDATABLE_COMMENT_FIELDS.includes(field)
  );

  if (invalidFields.length > 0) {
    return { 
      isValid: false, 
      error: `Cannot update fields: ${invalidFields.join(', ')}. Only content can be updated.` 
    };
  }

  if (updates.content !== undefined) {
    const contentValidation = validateCommentContent(updates.content);
    if (!contentValidation.isValid) {
      return contentValidation;
    }
  }

  return { isValid: true };
}

/**
 * Build comment response object
 * @param {Object} comment - Comment document
 * @param {Object} user - Current user (optional)
 * @param {Object} options - Additional options like isLiked, replies
 * @returns {Object} - Formatted comment response
 */
function buildCommentResponse(comment, user = null, options = {}) {
  const commentObj = comment.toObject ? comment.toObject() : comment;
  
  const response = {
    _id: commentObj._id,
    author: commentObj.author,
    post: commentObj.post,
    content: commentObj.content,
    parentComment: commentObj.parentComment,
    likesCount: commentObj.likesCount || 0,
    repliesCount: commentObj.repliesCount || 0,
    createdAt: commentObj.createdAt,
    updatedAt: commentObj.updatedAt,
    editedAt: commentObj.editedAt
  };

  // Add user-specific fields if user is provided
  if (user && options.isLiked !== undefined) {
    response.isLiked = options.isLiked;
  }

  // Add replies if provided
  if (options.replies) {
    response.replies = options.replies;
  }

  return response;
}

/**
 * Check if user can edit/delete comment
 * @param {Object} comment - Comment document
 * @param {Object} user - Current user
 * @returns {boolean}
 */
function canModifyComment(comment, user) {
  if (!user) return false;
  
  // Owner can modify
  if (comment.author.toString() === user._id.toString()) {
    return true;
  }

  // Post Owner can modify
  if (comment.post && comment.post.author._id.toString() === user._id.toString()) {
    return true;
  }

  // Admin can modify
  if (user.role === 'admin') {
    return true;
  }

  // TODO: Check if user is moderator of the post's community (when communities are implemented)
  
  return false;
}

/**
 * Check if a comment can have replies
 * @param {Object} comment - Comment document
 * @returns {boolean}
 */
function canHaveReplies(comment) {
  // Only top-level comments (without parentComment) can have replies
  return !comment.parentComment;
}

module.exports = {
  validateCommentContent,
  validateCommentUpdate,
  buildCommentResponse,
  canModifyComment,
  canHaveReplies
};
