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
  MAX_LIMIT
};
