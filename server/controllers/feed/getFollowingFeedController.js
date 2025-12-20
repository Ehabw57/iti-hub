const Post = require('../../models/Post');
const Connection = require('../../models/Connection');
const Enrollment = require('../../models/Enrollment');
const feedCache = require('../../utils/feedCache');
const { buildPostResponse } = require('../../utils/postHelpers');
const { 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  FOLLOWING_FEED_DAYS,
  FEED_CACHE_TTL
} = require('../../utils/constants');

/**
 * Get following feed
 * @route GET /feed/following
 * @access Private (authentication required)
 * 
 * Chronological feed from followed users and enrolled communities
 */
async function getFollowingFeed(req, res) {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const currentUserId = req.user._id;

    // Pagination
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = feedCache.generateCacheKey('following', currentUserId.toString(), page);

    // Check cache
    try {
      const cached = await feedCache.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          cached: true,
          feedType: 'following',
          data: cached
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
      // Continue without cache
    }

    // Fetch user connections and enrollments
    const [connections, enrollments] = await Promise.all([
      Connection.find({ follower: currentUserId }),
      Enrollment.find({ user: currentUserId })
    ]);

    const followedUserIds = connections.map(c => c.following);
    const communityIds = enrollments.map(e => e.branch);

    // If user has no connections or communities, return empty feed
    if (followedUserIds.length === 0 && communityIds.length === 0) {
      return res.status(200).json({
        success: true,
        cached: false,
        feedType: 'following',
        data: {
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Build query for posts from followed users and communities
    const query = {
      $or: []
    };
    
    if (followedUserIds.length > 0) {
      query.$or.push({ author: { $in: followedUserIds } });
    }
    
    if (communityIds.length > 0) {
      query.$or.push({ community: { $in: communityIds } });
    }

    // Add time filter for following feed
    const timeThreshold = new Date();
    timeThreshold.setDate(timeThreshold.getDate() - FOLLOWING_FEED_DAYS);
    query.createdAt = { $gte: timeThreshold };

    // Fetch posts chronologically (no algorithmic sorting)
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
      await feedCache.set(cacheKey, responseData, FEED_CACHE_TTL.FOLLOWING);
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
      // Continue without caching
    }

    return res.status(200).json({
      success: true,
      cached: false,
      feedType: 'following',
      data: responseData
    });

  } catch (error) {
    console.error('Get following feed error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FEED_ERROR',
        message: 'Failed to fetch following feed'
      }
    });
  }
}

module.exports = getFollowingFeed;
