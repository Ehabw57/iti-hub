const { MIN_SEARCH_QUERY_LENGTH, MAX_SEARCH_RESULTS, DEFAULT_SEARCH_LIMIT } = require('./constants');

/**
 * Validate search query string
 * @param {string} query - The search query to validate
 * @returns {string} - Trimmed query string
 * @throws {Error} - If query is invalid
 */
function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required');
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    throw new Error('Search query cannot be empty');
  }

  if (trimmedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
    throw new Error(`Search query must be at least ${MIN_SEARCH_QUERY_LENGTH} characters`);
  }

  return trimmedQuery;
}

/**
 * Sanitize search query by removing special regex characters
 * @param {string} query - The query to sanitize
 * @returns {string} - Sanitized query
 */
function sanitizeSearchQuery(query) {
  if (!query) {
    return '';
  }

  // Remove special regex characters that could cause issues
  // We escape these characters: . * + ? ^ $ { } ( ) | [ ] \
  return query
    .toString()
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '');
}

/**
 * Build MongoDB search filter combining text search with additional filters
 * @param {string} query - The search query
 * @param {Object} additionalFilters - Additional filters to combine
 * @returns {Object} - MongoDB filter object
 */
function buildSearchFilter(query, additionalFilters = {}) {
  const filter = {
    $text: {
      $search: query
    }
  };

  // Merge additional filters
  if (additionalFilters && typeof additionalFilters === 'object') {
    Object.assign(filter, additionalFilters);
  }

  return filter;
}

/**
 * Parse and validate pagination parameters for search
 * @param {number|string} page - Page number
 * @param {number|string} limit - Items per page
 * @returns {Object} - Parsed pagination object { page, limit, skip }
 */
function parseSearchPagination(page, limit) {
  // Parse page number
  let parsedPage = parseInt(page, 10);
  if (isNaN(parsedPage) || parsedPage < 1) {
    parsedPage = 1;
  }

  // Parse limit
  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    parsedLimit = DEFAULT_SEARCH_LIMIT;
  }

  // Enforce maximum limit
  if (parsedLimit > MAX_SEARCH_RESULTS) {
    parsedLimit = MAX_SEARCH_RESULTS;
  }

  // Calculate skip
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip
  };
}

module.exports = {
  validateSearchQuery,
  sanitizeSearchQuery,
  buildSearchFilter,
  parseSearchPagination
};
