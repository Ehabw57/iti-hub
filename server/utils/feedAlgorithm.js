const { FEED_WEIGHTS } = require('./constants');

/**
 * Calculate engagement score for a post (0-100)
 * Uses logarithmic scale to prevent outliers from dominating
 * 
 * @param {Object} post - Post object with likesCount, commentsCount, repostsCount
 * @returns {number} Score between 0-100
 */
function calculateEngagementScore(post) {
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const reposts = post.repostsCount || 0;
  
  // Weight: likes=1x, comments=3x, reposts=2x
  const engagementTotal = (likes * 1) + (comments * 3) + (reposts * 2);
  
  // Logarithmic normalization to prevent outliers
  const normalized = Math.log10(engagementTotal + 1);
  
  // Scale to 0-100, cap at 100
  // Using multiplier of 25 to reach 100 at ~1600 total engagement
  const score = Math.min(normalized * 25, 100);
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate recency score for a post (0-100)
 * Tiered system with steep decay in first 24 hours
 * 
 * @param {Object} post - Post object with createdAt
 * @returns {number} Score between 0-100
 */
function calculateRecencyScore(post) {
  const now = Date.now();
  const createdAt = post.createdAt ? new Date(post.createdAt).getTime() : now;
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);
  
  if (ageInHours < 1) return 100;       // < 1 hour
  if (ageInHours < 6) return 90;        // 1-6 hours
  if (ageInHours < 24) return 70;       // 6-24 hours
  if (ageInHours < 48) return 50;       // 1-2 days
  if (ageInHours < 72) return 30;       // 2-3 days
  if (ageInHours < 168) return 10;      // 3-7 days
  return 0; // > 7 days
}

/**
 * Calculate source score for a post (0-100)
 * Prioritizes content from followed users and joined communities
 * Only used for Home feed
 * 
 * @param {Object} post - Post object with author and community
 * @param {string} userId - Current user ID
 * @param {Object} userConnections - Object with followedUsers and joinedCommunities arrays
 * @returns {number} Score between 0-100
 */
function calculateSourceScore(post, userId, userConnections) {
  if (!userConnections) {
    return 0;
  }
  
  const { followedUsers = [], joinedCommunities = [] } = userConnections;
  
  // Extract IDs from objects if necessary
  const authorId = post.author?._id || post.author;
  const communityId = post.community?._id || post.community;
  
  const isFollowedUser = authorId && followedUsers.includes(authorId.toString());
  const isJoinedCommunity = communityId && joinedCommunities.includes(communityId.toString());
  
  if (isFollowedUser && isJoinedCommunity) return 100;  // Both
  if (isFollowedUser) return 80;                        // Followed user only
  if (isJoinedCommunity) return 60;                     // Community only
  return 0; // Neither
}

/**
 * Calculate combined feed score for a post
 * Uses different weights based on feed type
 * 
 * @param {Object} post - Post object
 * @param {string} userId - Current user ID (null for trending feed)
 * @param {Object} userConnections - User's connections (null for trending feed)
 * @param {string} feedType - 'home' or 'trending' (default: 'home')
 * @returns {number} Combined score
 */
function calculateFeedScore(post, userId, userConnections, feedType = 'home') {
  const engagement = calculateEngagementScore(post);
  const recency = calculateRecencyScore(post);
  
  if (feedType === 'trending') {
    // Trending feed: no source score, higher engagement weight
    const weights = FEED_WEIGHTS.TRENDING;
    return (engagement * weights.engagement) + (recency * weights.recency);
  }
  
  // Home feed: includes source score
  const source = calculateSourceScore(post, userId, userConnections);
  const weights = FEED_WEIGHTS.HOME;
  
  return (engagement * weights.engagement) + 
         (recency * weights.recency) + 
         (source * weights.source);
}

module.exports = {
  calculateEngagementScore,
  calculateRecencyScore,
  calculateSourceScore,
  calculateFeedScore
};
