const Post = require('../../models/Post');
const feedCache = require('../../utils/feedCache');
const { buildPostResponse } = require('../../utils/postHelpers');
const { 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  FEED_CACHE_TTL
} = require('../../utils/constants');

/**
 * Get community feed
 * @route GET /communities/:communityId/feed
 * @access Public (optional auth)
 * 
 * Chronological feed of posts from a specific community
 */
async function getCommunityFeed(req, res) {
  try {
    const { communityId } = req.params;
    
    // Validate communityId
    if (!communityId) {
      return res.status(400).json({
        success: false,
        message: 'Community ID is required'
      });
    }

    const currentUserId = req.user?._id;
    const isAuthenticated = !!currentUserId;

    // Pagination
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Generate cache key
    const userId = isAuthenticated ? currentUserId.toString() : 'public';
    const cacheKey = feedCache.generateCacheKey('community', userId, page, communityId);

    // Check cache
    try {
      const cached = await feedCache.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          cached: true,
          feedType: 'community',
          communityId,
          data: cached
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
      // Continue without cache
    }

    // Build query for community posts
    const query = {
      community: communityId
    };

    // Fetch posts chronologically (no algorithmic sorting for community feeds)
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .populate('originalPost')
      .populate('community', 'name');

    // Get total count
    const total = await Post.countDocuments(query);

    // Build post responses with user-specific data
    const postsWithUserData = await Promise.all(
      posts.map(post => buildPostResponse(post, currentUserId))
    );

    // Prepare response
    const responseData = {
      posts: postsWithUserData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache the results
    try {
      await feedCache.set(cacheKey, responseData, FEED_CACHE_TTL.COMMUNITY);
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
      // Continue without caching
    }

    return res.status(200).json({
      success: true,
      cached: false,
      feedType: 'community',
      communityId,
      data: responseData
    });

  } catch (error) {
    console.error('Get community feed error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FEED_ERROR',
        message: 'Failed to fetch community feed'
      }
    });
  }
}

module.exports = getCommunityFeed;
