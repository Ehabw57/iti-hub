/**
 * General test utilities and assertions helpers
 */

/**
 * Validates that a response has the standard success structure
 * @param {Object} response - The response object to validate
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {boolean} expectedSuccess - Expected success value
 */
function validateSuccessResponse(response, expectedStatus = 200, expectedSuccess = true) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(expectedSuccess);
}

/**
 * Validates that a response has the standard error structure
 * @param {Object} response - The response object to validate
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} expectedMessage - Expected error message (optional)
 */
function validateErrorResponse(response, expectedStatus, expectedMessage = null) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
  if (expectedMessage) {
    expect(response.body.message).toBe(expectedMessage);
  }
}

/**
 * Validates that an object has the expected post structure
 * @param {Object} post - The post object to validate
 * @param {Object} expectedFields - Optional fields to check
 */
function validatePostStructure(post, expectedFields = {}) {
  expect(post._id).toBeDefined();
  expect(post.author_id).toBeDefined();
  expect(post.content).toBeDefined();
  expect(typeof post.likes_count).toBe('number');
  expect(typeof post.comments_count).toBe('number');
  expect(post.createdAt).toBeDefined();
  expect(post.updatedAt).toBeDefined();

  // Check optional expected fields
  Object.keys(expectedFields).forEach(field => {
    expect(post[field]).toBe(expectedFields[field]);
  });
}

/**
 * Validates that an object has the expected user structure (populated in likes)
 * @param {Object} user - The user object to validate
 */
function validateUserStructure(user) {
  expect(user._id).toBeDefined();
  expect(user.first_name).toBeDefined();
  expect(user.last_name).toBeDefined();
  expect(user.email).toBeDefined();
  expect(user.password).toBeUndefined(); // Should not be populated
}

/**
 * Validates that an array contains the expected number of items
 * @param {Array} array - The array to validate
 * @param {number} expectedLength - Expected length
 */
function validateArrayLength(array, expectedLength) {
  expect(Array.isArray(array)).toBe(true);
  expect(array.length).toBe(expectedLength);
}

/**
 * Creates a delay for testing async operations
 * @param {number} ms - Milliseconds to delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates random test data
 */
function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomEmail() {
  return `test${generateRandomString(8)}@example.com`;
}

/**
 * Test data generators
 */
const testData = {
  validPost: {
    content: "This is a valid test post content",
  },
  
  validPostWithMedia: {
    content: "Post with media content",
    media: [
      { url: "https://example.com/image.jpg", type: "photo" },
      { url: "https://example.com/video.mp4", type: "video" },
    ],
  },
  
  invalidPost: {
    // Missing required content field
    author_id: "some-id",
  },
  
  validUser: {
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
    password: "password123",
    role: "user",
  },
};

module.exports = {
  validateSuccessResponse,
  validateErrorResponse,
  validatePostStructure,
  validateUserStructure,
  validateArrayLength,
  delay,
  generateRandomString,
  generateRandomEmail,
  testData,
};