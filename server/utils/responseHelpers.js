/**
 * Response Helper Utilities
 * These functions ensure consistent response formatting across all endpoints
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Optional metadata (e.g., cached, feedType)
 */
function sendSuccess(res, data, message = null, statusCode = 200, meta = null) {
  const response = {
    success: true
  };

  if (message) {
    response.message = message;
  }

  response.data = data;

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}


/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message (default: 'Resource created successfully')
 */
function sendCreated(res, data, message = 'Resource created successfully') {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send no content response (204)
 * Used for successful DELETE operations with no response body
 * @param {Object} res - Express response object
 */
function sendNoContent(res) {
  return res.status(204).send();
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendNoContent
};
