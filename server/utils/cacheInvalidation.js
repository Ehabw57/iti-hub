const feedCache = require('./feedCache');
const Connection = require('../models/Connection');

/**
 * Cache Invalidation Utilities
 * These functions invalidate feed caches when content changes
 */

/**
 * Invalidate feeds when a user creates a new post
 * Invalidates:
 * - Follower's home feeds
 * - Follower's following feeds
 * - Global trending feed
 * 
 * @param {string} authorId - User ID who created the post
 * @param {string} communityId - Community ID if post is in a community (optional)
 */
async function invalidateOnPostCreate(authorId, communityId = null) {
  try {
    // Get the author's followers
    const connections = await Connection.find({ following: authorId }).select('follower');
    const followerIds = connections.map(c => c.follower.toString());

    // Invalidate follower feeds (home and following)
    if (followerIds.length > 0) {
      await feedCache.invalidateFollowerFeeds(followerIds);
    }

    // Invalidate author's own feeds
    await feedCache.invalidateFeed(authorId.toString(), 'home');
    await feedCache.invalidateFeed(authorId.toString(), 'following');

    // Invalidate trending feed (global)
    await feedCache.invalidateTrendingFeed();

    // If post is in a community, invalidate community feed
    if (communityId) {
      await feedCache.invalidateCommunityFeed(communityId.toString());
    }

    return { success: true };
  } catch (error) {
    console.error('Cache invalidation error on post create:', error);
    // Don't throw - cache invalidation failure shouldn't block post creation
    return { success: false, error };
  }
}

/**
 * Invalidate feeds when a post is updated
 * Invalidates:
 * - Trending feed (engagement might have changed)
 * - Community feed if post belongs to a community
 * 
 * @param {string} postId - Post ID
 * @param {string} authorId - User ID who owns the post
 * @param {string} communityId - Community ID if post is in a community (optional)
 */
async function invalidateOnPostUpdate(postId, authorId, communityId = null) {
  try {
    // Invalidate trending feed (post content might affect engagement)
    await feedCache.invalidateTrendingFeed();

    // If post is in a community, invalidate community feed
    if (communityId) {
      await feedCache.invalidateCommunityFeed(communityId.toString());
    }

    return { success: true };
  } catch (error) {
    console.error('Cache invalidation error on post update:', error);
    return { success: false, error };
  }
}

/**
 * Invalidate feeds when a post is deleted
 * Invalidates:
 * - Follower's home feeds
 * - Follower's following feeds
 * - Trending feed
 * - Community feed if applicable
 * 
 * @param {string} authorId - User ID who owned the post
 * @param {string} communityId - Community ID if post was in a community (optional)
 */
async function invalidateOnPostDelete(authorId, communityId = null) {
  try {
    // Get the author's followers
    const connections = await Connection.find({ following: authorId }).select('follower');
    const followerIds = connections.map(c => c.follower.toString());

    // Invalidate follower feeds
    if (followerIds.length > 0) {
      await feedCache.invalidateFollowerFeeds(followerIds);
    }

    // Invalidate author's own feeds
    await feedCache.invalidateFeed(authorId.toString(), 'home');
    await feedCache.invalidateFeed(authorId.toString(), 'following');

    // Invalidate trending feed
    await feedCache.invalidateTrendingFeed();

    // If post was in a community, invalidate community feed
    if (communityId) {
      await feedCache.invalidateCommunityFeed(communityId.toString());
    }

    return { success: true };
  } catch (error) {
    console.error('Cache invalidation error on post delete:', error);
    return { success: false, error };
  }
}

/**
 * Invalidate feeds when a post gets new engagement (like, comment, repost)
 * Invalidates:
 * - Trending feed (engagement affects trending score)
 * - Home feeds of followers (engagement affects home feed score)
 * 
 * @param {string} postId - Post ID
 * @param {string} authorId - User ID who owns the post
 */
async function invalidateOnPostEngagement(postId, authorId) {
  try {
    // Invalidate trending feed (engagement changes trending score significantly)
    await feedCache.invalidateTrendingFeed();

    // Get the author's followers and invalidate their home feeds
    const connections = await Connection.find({ following: authorId }).select('follower');
    const followerIds = connections.map(c => c.follower.toString());

    // Invalidate follower home feeds (engagement affects algorithmic home feed)
    for (const followerId of followerIds) {
      await feedCache.invalidateFeed(followerId, 'home');
    }

    // Invalidate author's home feed
    await feedCache.invalidateFeed(authorId.toString(), 'home');

    return { success: true };
  } catch (error) {
    console.error('Cache invalidation error on post engagement:', error);
    return { success: false, error };
  }
}

/**
 * Invalidate feeds when user follows/unfollows someone
 * Invalidates:
 * - User's home feed
 * - User's following feed
 * 
 * @param {string} userId - User ID who followed/unfollowed
 */
async function invalidateOnConnectionChange(userId) {
  try {
    await feedCache.invalidateFeed(userId.toString(), 'home');
    await feedCache.invalidateFeed(userId.toString(), 'following');

    return { success: true };
  } catch (error) {
    console.error('Cache invalidation error on connection change:', error);
    return { success: false, error };
  }
}

/**
 * Invalidate feeds when user joins/leaves a community
 * Invalidates:
 * - User's home feed
 * - User's following feed
 * 
 * @param {string} userId - User ID who joined/left community
 */
async function invalidateOnEnrollmentChange(userId) {
  try {
    await feedCache.invalidateFeed(userId.toString(), 'home');
    await feedCache.invalidateFeed(userId.toString(), 'following');

    return { success: true };
  } catch (error) {
    console.error('Cache invalidation error on enrollment change:', error);
    return { success: false, error };
  }
}

module.exports = {
  invalidateOnPostCreate,
  invalidateOnPostUpdate,
  invalidateOnPostDelete,
  invalidateOnPostEngagement,
  invalidateOnConnectionChange,
  invalidateOnEnrollmentChange
};
