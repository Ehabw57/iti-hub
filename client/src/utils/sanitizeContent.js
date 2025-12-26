/**
 * Sanitize textual content before mutations
 * - Trims leading/trailing whitespace
 * - Collapses more than two consecutive newlines to exactly two
 * - Returns null if content becomes empty after sanitation
 * 
 * @param {string} content - Raw content string
 * @returns {string|null} - Sanitized content or null if empty
 */
export function sanitizeContent(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Trim leading and trailing whitespace
  let sanitized = content.trim();

  // Collapse more than two consecutive newlines to exactly two
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Return null if empty after sanitation
  if (sanitized.length === 0) {
    return null;
  }

  return sanitized;
}

export default sanitizeContent;
