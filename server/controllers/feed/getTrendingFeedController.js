const Post = require('../../models/Post');
const feedAlgorithm = require('../../utils/feedAlgorithm');
const feedCache = require('../../utils/feedCache');
const { buildPostResponse } = require('../../utils/postHelpers');
const { 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  TRENDING_FEED_DAYS,
  FEED_CACHE_TTL
} = require('../../utils/constants');

/**
 * Get trending feed
 * @route GET /feed/trending
 * @access Public (optional auth)
 * 
 * Global trending feed with algorithmic sorting
 */
async function getTrendingFeed(req, res) {
  try {
    const currentUserId = req.user?._id;
    const isAuthenticated = !!currentUserId;

    // Pagination
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Generate cache key
    const userId = isAuthenticated ? currentUserId.toString() : 'public';
    const cacheKey = feedCache.generateCacheKey('trending', userId, page);

    // Check cache
    try {
      const cached = await feedCache.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          cached: true,
          feedType: 'trending',
          ...cached
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
      // Continue without cache
    }

    // Build query for trending posts (global, time-limited)
    const timeThreshold = new Date();
    timeThreshold.setDate(timeThreshold.getDate() - TRENDING_FEED_DAYS);
    
    const query = {
      createdAt: { $gte: timeThreshold }
    };

    // Fetch more posts than needed for algorithmic sorting
    const fetchLimit = limit * 3; // Fetch 3x to have enough for sorting

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .populate('author', 'username fullName profilePicture')
      .populate('originalPost')
      .populate('community', 'name');

    // Get total count
    const total = await Post.countDocuments(query);

    // Calculate trending scores and sort
    const userConnections = {
      followedUsers: [],
      communities: []
    };

    const postsWithScores = posts.map(post => {
      const postObj = post.toObject();
      const score = feedAlgorithm.calculateFeedScore(
        postObj,
        isAuthenticated ? currentUserId.toString() : null,
        userConnections,
        'trending'
      );
      return { ...postObj, _score: score };
    });

    // Sort by score and take only requested items (with pagination)
    postsWithScores.sort((a, b) => b._score - a._score);
    const paginatedPosts = postsWithScores.slice(skip, skip + limit);

    // Remove score from final output
    const finalPosts = paginatedPosts.map(post => {
      const { _score, ...postWithoutScore } = post;
      return postWithoutScore;
    });

    // Build post responses with user-specific data
    const postsWithUserData = await Promise.all(
      finalPosts.map(post => buildPostResponse(post, currentUserId))
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
      await feedCache.set(cacheKey, responseData, FEED_CACHE_TTL.TRENDING);
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
      // Continue without caching
    }

    return res.status(200).json({
      success: true,
      cached: false,
      feedType: 'trending',
      ...responseData
    });

  } catch (error) {
    console.error('Get trending feed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trending feed'
    });
  }
}

module.exports = getTrendingFeed;
