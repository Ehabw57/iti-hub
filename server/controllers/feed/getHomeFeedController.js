const Post = require('../../models/Post');
const Connection = require('../../models/Connection');
const Enrollment = require('../../models/Enrollment');
const feedAlgorithm = require('../../utils/feedAlgorithm');
const feedCache = require('../../utils/feedCache');
const { buildPostResponse } = require('../../utils/postHelpers');
const { 
  DEFAULT_PAGE, 
  DEFAULT_LIMIT, 
  MAX_LIMIT,
  FEATURED_TAGS,
  HOME_FEED_DAYS,
  FEED_CACHE_TTL
} = require('../../utils/constants');

/**
 * Get home feed
 * @route GET /feed/home
 * @access Public (optional auth)
 * 
 * Authenticated: Algorithmic feed from connections and communities
 * Unauthenticated: Featured tags, chronological
 */
async function getHomeFeed(req, res) {
  try {
    const currentUserId = req.user?._id;
    const isAuthenticated = !!currentUserId;

    // Pagination
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Generate cache key
    const userId = isAuthenticated ? currentUserId.toString() : 'public';
    const cacheKey = feedCache.generateCacheKey('home', userId, page);

    // Check cache
    try {
      const cached = await feedCache.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          cached: true,
          feedType: 'home',
          data: cached
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
      // Continue without cache
    }

    let posts;
    let total;

    if (isAuthenticated) {
      // Authenticated: Algorithmic feed
      const [connections, enrollments] = await Promise.all([
        Connection.find({ follower: currentUserId }),
        Enrollment.find({ user: currentUserId })
      ]);

      const followedUserIds = connections.map(c => c.following);
      const communityIds = enrollments.map(e => e.branch);

      // Build query for posts from followed users and communities
      const query = {};
      
      if (followedUserIds.length > 0 || communityIds.length > 0) {
        query.$or = [];
        
        if (followedUserIds.length > 0) {
          query.$or.push({ author: { $in: followedUserIds } });
        }
        
        if (communityIds.length > 0) {
          query.$or.push({ community: { $in: communityIds } });
        }
      } else {
        // User has no connections or communities - return empty feed
        return res.status(200).json({
          success: true,
          cached: false,
          feedType: 'home',
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

      // Add time filter for home feed
      const timeThreshold = new Date();
      timeThreshold.setDate(timeThreshold.getDate() - HOME_FEED_DAYS);
      query.createdAt = { $gte: timeThreshold };

      // Fetch more posts than needed for algorithmic sorting
      const fetchLimit = limit * 3; // Fetch 3x to have enough for sorting

      posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(fetchLimit)
        .populate('author', 'username fullName profilePicture')
        .populate('originalPost')
        .populate('community', 'name');

      // Get total count
      total = await Post.countDocuments(query);

      // Calculate feed scores and sort
      const userConnections = {
        followedUsers: followedUserIds.map(id => id.toString()),
        communities: communityIds.map(id => id.toString())
      };

      const postsWithScores = posts.map(post => {
        const postObj = post.toObject();
        const score = feedAlgorithm.calculateFeedScore(
          postObj,
          currentUserId.toString(),
          userConnections,
          'home'
        );
        return { ...postObj, _score: score };
      });

      // Sort by score and take only requested limit
      postsWithScores.sort((a, b) => b._score - a._score);
      posts = postsWithScores.slice(skip, skip + limit);

      // Remove score from final output
      posts = posts.map(post => {
        const { _score, ...postWithoutScore } = post;
        return postWithoutScore;
      });

    } else {
      // Unauthenticated: Show recent posts (no featured tags filter until Tag system is implemented)
      const query = {};

      posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username fullName profilePicture')
        .populate('originalPost')
        .populate('community', 'name');

      total = await Post.countDocuments(query);
    }

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
      await feedCache.set(cacheKey, responseData, FEED_CACHE_TTL.HOME);
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
      // Continue without caching
    }

    return res.status(200).json({
      success: true,
      cached: false,
      feedType: 'home',
      data: responseData
    });

  } catch (error) {
    console.error('Get home feed error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FEED_ERROR',
        message: 'Failed to fetch home feed'
      }
    });
  }
}

module.exports = getHomeFeed;
