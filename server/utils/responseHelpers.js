/**
 * Standard response helper functions
 * Provides consistent response format across the API
 */

/**
 * Standard success response
 * @param {Response} res - Express response object
 * @param {Object} data - Response data
 * @param {string|null} message - Optional message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(message && { message }),
    data
  };
  return res.status(statusCode).json(response);
};

/**
 * Success response for resource creation (201)
 * @param {Response} res - Express response object
 * @param {Object} data - Created resource data
 * @param {string} message - Success message
 */
const createdResponse = (res, data, message = 'Created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * Success response with no content (204)
 * @param {Response} res - Express response object
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Success response for list/paginated data
 * @param {Response} res - Express response object
 * @param {string} resourceName - Name of the resource (e.g., 'posts', 'users')
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info { page, limit, total }
 * @param {string|null} message - Optional message
 */
const listResponse = (res, resourceName, items, pagination, message = null) => {
  const response = {
    success: true,
    ...(message && { message }),
    data: {
      [resourceName]: items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    }
  };
  return res.status(200).json(response);
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  listResponse
};
