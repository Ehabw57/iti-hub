const NodeCache = require('node-cache');

// Initialize cache with default options
const cache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Don't clone objects for better performance
});

/**
 * Generate a cache key for a feed
 * @param {string} feedType - Type of feed (home, following, trending, community)
 * @param {string} userId - User ID or 'public' for unauthenticated
 * @param {number} page - Page number
 * @param {string} communityId - Community ID (for community feeds)
 * @returns {string} Cache key
 */
function generateCacheKey(feedType, userId, page, communityId = null) {
  if (feedType === 'community' && communityId) {
    return `feed:community:${communityId}:${userId}:page:${page}`;
  }
  return `feed:${feedType}:${userId}:page:${page}`;
}

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null if not found
 */
async function get(key) {
  const value = cache.get(key);
  return value === undefined ? null : value;
}

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
async function set(key, data, ttl) {
  return cache.set(key, data, ttl);
}

/**
 * Delete a specific key from cache
 * @param {string} key - Cache key
 * @returns {Promise<number>} Number of deleted keys
 */
async function del(key) {
  const deleted = cache.del(key);
  return deleted;
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern with wildcards (*)
 * @returns {Promise<number>} Number of deleted keys
 */
async function deletePattern(pattern) {
  const keys = cache.keys();
  
  // Convert pattern to regex
  // Escape special regex characters except *
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  
  const regex = new RegExp(`^${regexPattern}$`);
  
  // Find matching keys
  const matchingKeys = keys.filter(key => regex.test(key));
  
  // Delete matching keys
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
  }
  
  return matchingKeys.length;
}

/**
 * Invalidate a specific feed type for a user
 * @param {string} userId - User ID
 * @param {string} feedType - Type of feed to invalidate
 * @returns {Promise<number>} Number of deleted keys
 */
async function invalidateFeed(userId, feedType) {
  return deletePattern(`feed:${feedType}:${userId}:*`);
}

/**
 * Invalidate home and following feeds for multiple followers
 * Used when a user creates a post - invalidates feeds of their followers
 * @param {string[]} followerIds - Array of follower user IDs
 * @returns {Promise<number>} Number of deleted keys
 */
async function invalidateFollowerFeeds(followerIds) {
  if (!followerIds || followerIds.length === 0) {
    return 0;
  }
  
  let totalDeleted = 0;
  
  for (const followerId of followerIds) {
    // Invalidate both home and following feeds
    totalDeleted += await invalidateFeed(followerId, 'home');
    totalDeleted += await invalidateFeed(followerId, 'following');
  }
  
  return totalDeleted;
}

/**
 * Invalidate all feeds for a specific community
 * Used when a post is created in a community
 * @param {string} communityId - Community ID
 * @returns {Promise<number>} Number of deleted keys
 */
async function invalidateCommunityFeed(communityId) {
  return deletePattern(`feed:community:${communityId}:*`);
}

/**
 * Invalidate all trending feeds
 * Used when post engagement changes significantly
 * @returns {Promise<number>} Number of deleted keys
 */
async function invalidateTrendingFeed() {
  return deletePattern('feed:trending:*');
}

/**
 * Clear all cache entries
 */
function clearAll() {
  cache.flushAll();
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
function getStats() {
  return cache.getStats();
}

module.exports = {
  generateCacheKey,
  get,
  set,
  del,
  deletePattern,
  invalidateFeed,
  invalidateFollowerFeeds,
  invalidateCommunityFeed,
  invalidateTrendingFeed,
  clearAll,
  getStats
};
