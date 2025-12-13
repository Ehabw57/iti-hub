/**
 * Constants for User Profile and Connections
 * These values are used across controllers, models, and tests
 * to ensure consistency and make changes easier to manage
 */

// User Profile Field Validation
const MIN_FULL_NAME_LENGTH = 2;
const MAX_FULL_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_SPECIALIZATION_LENGTH = 100;
const MAX_LOCATION_LENGTH = 100;

// Sensitive user fields that should never be exposed in public profiles
const SENSITIVE_USER_FIELDS = [
  'password',
  'resetPasswordToken',
  'resetPasswordExpires',
  'isBlocked',
  'blockReason'
];

// Fields allowed in profile updates
const UPDATABLE_PROFILE_FIELDS = [
  'fullName',
  'bio',
  'profilePicture',
  'coverImage',
  'specialization',
  'location'
];

// Pagination defaults
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Post Validation
const MAX_POST_CONTENT_LENGTH = 5000;
const MAX_POST_IMAGES = 10;
const MAX_POST_TAGS = 5;
const MAX_REPOST_COMMENT_LENGTH = 500;
const POST_RATE_LIMIT = 10; // posts per hour

// Comment Validation
const MIN_COMMENT_CONTENT_LENGTH = 1;
const MAX_COMMENT_CONTENT_LENGTH = 1000;

// Public fields for posts
const PUBLIC_POST_FIELDS = [
  '_id',
  'author',
  'content',
  'images',
  'tags',
  'community',
  'repostComment',
  'originalPost',
  'likesCount',
  'commentsCount',
  'repostsCount',
  'savesCount',
  'createdAt',
  'updatedAt',
  'editedAt'
];

// Updatable fields for posts
const UPDATABLE_POST_FIELDS = ['content', 'tags'];

// Public fields for comments
const PUBLIC_COMMENT_FIELDS = [
  '_id',
  'author',
  'post',
  'content',
  'parentComment',
  'likesCount',
  'repliesCount',
  'createdAt',
  'updatedAt',
  'editedAt'
];

// Updatable fields for comments
const UPDATABLE_COMMENT_FIELDS = ['content'];

module.exports = {
  // Validation lengths
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_SPECIALIZATION_LENGTH,
  MAX_LOCATION_LENGTH,
  
  // Field lists
  SENSITIVE_USER_FIELDS,
  UPDATABLE_PROFILE_FIELDS,
  
  // Pagination
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  
  // Post validation
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_IMAGES,
  MAX_POST_TAGS,
  MAX_REPOST_COMMENT_LENGTH,
  POST_RATE_LIMIT,
  
  // Comment validation
  MIN_COMMENT_CONTENT_LENGTH,
  MAX_COMMENT_CONTENT_LENGTH,
  
  // Post fields
  PUBLIC_POST_FIELDS,
  UPDATABLE_POST_FIELDS,
  
  // Comment fields
  PUBLIC_COMMENT_FIELDS,
  UPDATABLE_COMMENT_FIELDS
};
