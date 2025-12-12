# Feed Algorithm Specification

**Project**: ITI Hub Social Media Platform  
**Version**: 1.0 (MVP)  
**Date**: December 12, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Feed Types](#feed-types)
3. [Home Feed Algorithm](#home-feed-algorithm)
4. [Following Feed Algorithm](#following-feed-algorithm)
5. [Community Feed Algorithm](#community-feed-algorithm)
6. [Caching Strategy](#caching-strategy)
7. [Performance Optimization](#performance-optimization)
8. [Implementation Details](#implementation-details)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### Design Principles

**Simplicity Over Complexity**
- No complex machine learning or AI
- Transparent, predictable ranking
- Easy to debug and maintain
- Fast query performance

**Key Metrics for Ranking**
1. **Recency**: When the post was created
2. **Engagement**: Total interactions (likes + comments + reposts)
3. **Relevance**: Source (followed user or joined community)

### Feed Requirements

| Feed Type | Source | Order | Personalization |
|-----------|--------|-------|-----------------|
| Home Feed | Followed users + Communities | Algorithmic | Medium |
| Following Feed | Followed users only | Chronological | Low |
| Community Feed | Single community | Chronological | None |

---

## Feed Types

### 1. Home Feed

**Purpose**: Main discovery feed with content from followed users and joined communities

**Characteristics:**
- Algorithmic ranking
- Shows posts from last 7 days
- Includes reposts
- Personalized per user
- Cached for 5 minutes

**Endpoint**: `GET /api/v1/feed/home`

---

### 2. Following Feed

**Purpose**: Chronological feed of posts from users you follow

**Characteristics:**
- Purely chronological (newest first)
- Only direct posts (no community posts unless reposted)
- No algorithmic ranking
- Shows posts from last 30 days
- Lighter caching (1 minute)

**Endpoint**: `GET /api/v1/feed/following`

---

### 3. Community Feed

**Purpose**: All posts within a specific community

**Characteristics:**
- Chronological order
- Visible to non-members (public)
- No personalization
- Shows all posts (no time limit)
- Cached per community (5 minutes)

**Endpoint**: `GET /api/v1/communities/:communityId/posts`

---

## Home Feed Algorithm

### Algorithm Overview

**Formula:**
```
Score = (Engagement Weight × Engagement Score) + (Recency Weight × Recency Score) + (Source Weight × Source Score)
```

**Weights (can be tuned):**
- Engagement Weight: 0.5
- Recency Weight: 0.3
- Source Weight: 0.2

### 1. Engagement Score

**Calculation:**
```javascript
function calculateEngagementScore(post) {
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const reposts = post.repostsCount || 0;
  
  // Weighted engagement
  const engagementTotal = (likes * 1) + (comments * 3) + (reposts * 2);
  
  // Normalize using logarithm to prevent viral posts from dominating
  const normalized = Math.log10(engagementTotal + 1);
  
  // Scale to 0-100
  return Math.min(normalized * 20, 100);
}
```

**Rationale:**
- Comments valued 3x likes (more meaningful interaction)
- Reposts valued 2x likes (indicates quality)
- Logarithmic normalization prevents outliers
- Caps at 100 for consistency

### 2. Recency Score

**Calculation:**
```javascript
function calculateRecencyScore(post) {
  const now = Date.now();
  const postTime = new Date(post.createdAt).getTime();
  const ageInHours = (now - postTime) / (1000 * 60 * 60);
  
  // Decay function: newer posts score higher
  if (ageInHours < 1) return 100;           // < 1 hour: 100
  if (ageInHours < 6) return 90;            // 1-6 hours: 90
  if (ageInHours < 24) return 70;           // 6-24 hours: 70
  if (ageInHours < 48) return 50;           // 1-2 days: 50
  if (ageInHours < 72) return 30;           // 2-3 days: 30
  if (ageInHours < 168) return 10;          // 3-7 days: 10
  return 0;                                 // > 7 days: 0 (excluded)
}
```

**Rationale:**
- Recent posts prioritized
- Steep decay in first 24 hours
- Posts older than 7 days excluded
- Simple tier system (easy to understand)

### 3. Source Score

**Calculation:**
```javascript
function calculateSourceScore(post, userId) {
  // Check if post author is followed by user
  const isFollowedUser = post.author.isFollowedByUser;
  
  // Check if post is in joined community
  const isJoinedCommunity = post.community && post.community.isJoinedByUser;
  
  // Scoring
  if (isFollowedUser && isJoinedCommunity) return 100; // Both
  if (isFollowedUser) return 80;                        // Followed user
  if (isJoinedCommunity) return 60;                     // Community only
  return 0;                                              // Neither (shouldn't happen)
}
```

**Rationale:**
- Followed users prioritized
- Community posts slightly lower
- Posts from both sources get bonus

### 4. Combined Score

**Implementation:**
```javascript
function calculateFeedScore(post, userId) {
  const engagementScore = calculateEngagementScore(post);
  const recencyScore = calculateRecencyScore(post);
  const sourceScore = calculateSourceScore(post, userId);
  
  // Weighted combination
  const score = 
    (engagementScore * 0.5) + 
    (recencyScore * 0.3) + 
    (sourceScore * 0.2);
  
  return score;
}
```

### 5. Feed Generation Process

```javascript
async function generateHomeFeed(userId, page = 1, limit = 20) {
  // 1. Get user's followed users
  const followedUserIds = await getFollowedUsers(userId);
  
  // 2. Get user's joined communities
  const joinedCommunityIds = await getJoinedCommunities(userId);
  
  // 3. Query posts from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const posts = await Post.find({
    $or: [
      { author: { $in: followedUserIds } },
      { community: { $in: joinedCommunityIds } }
    ],
    isDeleted: false,
    createdAt: { $gte: sevenDaysAgo }
  })
  .populate('author', 'username fullName profilePicture')
  .populate('community', 'name')
  .lean();
  
  // 4. Calculate scores for each post
  const scoredPosts = posts.map(post => ({
    ...post,
    feedScore: calculateFeedScore(post, userId)
  }));
  
  // 5. Sort by score (descending)
  scoredPosts.sort((a, b) => b.feedScore - a.feedScore);
  
  // 6. Apply pagination
  const startIndex = (page - 1) * limit;
  const paginatedPosts = scoredPosts.slice(startIndex, startIndex + limit);
  
  // 7. Attach user-specific data (isLiked, isSaved)
  const enrichedPosts = await enrichPostsWithUserData(paginatedPosts, userId);
  
  return {
    posts: enrichedPosts,
    pagination: {
      page: page,
      limit: limit,
      total: scoredPosts.length,
      totalPages: Math.ceil(scoredPosts.length / limit)
    }
  };
}
```

### Algorithm Flowchart

```
┌─────────────────────────┐
│   User Requests Feed    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Check Cache (5 min)    │
└────────────┬────────────┘
             │
         Cache Hit? ───Yes──> Return Cached Feed
             │ No
             ▼
┌─────────────────────────┐
│ Get Followed Users IDs  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│Get Joined Communities ID│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│Query Posts (Last 7 days)│
│ - From followed users   │
│ - From communities      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Calculate Scores       │
│ - Engagement Score      │
│ - Recency Score         │
│ - Source Score          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Sort by Score (Desc)  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Apply Pagination     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Enrich with User Data  │
│  (isLiked, isSaved)     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│     Cache Result        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Return to Client     │
└─────────────────────────┘
```

---

## Following Feed Algorithm

### Simple Chronological Sorting

**Implementation:**
```javascript
async function generateFollowingFeed(userId, page = 1, limit = 20) {
  // 1. Get followed users
  const followedUserIds = await getFollowedUsers(userId);
  
  // 2. Query posts (chronological)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const posts = await Post.find({
    author: { $in: followedUserIds },
    isDeleted: false,
    createdAt: { $gte: thirtyDaysAgo }
  })
  .sort({ createdAt: -1 }) // Newest first
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('author', 'username fullName profilePicture')
  .populate('community', 'name')
  .lean();
  
  // 3. Enrich with user data
  const enrichedPosts = await enrichPostsWithUserData(posts, userId);
  
  // 4. Get total count for pagination
  const total = await Post.countDocuments({
    author: { $in: followedUserIds },
    isDeleted: false,
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  return {
    posts: enrichedPosts,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

**Characteristics:**
- Pure chronological order
- Simpler query (faster execution)
- No scoring calculation
- Lighter database load

---

## Community Feed Algorithm

### Chronological Within Community

**Implementation:**
```javascript
async function generateCommunityFeed(communityId, page = 1, limit = 20, userId = null) {
  // Query posts in community
  const posts = await Post.find({
    community: communityId,
    isDeleted: false
  })
  .sort({ createdAt: -1 }) // Newest first
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('author', 'username fullName profilePicture')
  .lean();
  
  // Enrich with user data if authenticated
  let enrichedPosts = posts;
  if (userId) {
    enrichedPosts = await enrichPostsWithUserData(posts, userId);
  }
  
  // Get total count
  const total = await Post.countDocuments({
    community: communityId,
    isDeleted: false
  });
  
  return {
    posts: enrichedPosts,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

**Note**: No algorithmic ranking, just chronological order

---

## Caching Strategy

### Cache Layers

```
┌─────────────────────────────────────────┐
│          Application Layer              │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼─────────┐
         │   Cache Layer     │
         │   (Redis/Memory)  │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │   Database Layer  │
         │    (MongoDB)      │
         └───────────────────┘
```

### Cache Keys

**Home Feed:**
```
Key: `feed:home:${userId}:page:${page}`
TTL: 5 minutes (300 seconds)
```

**Following Feed:**
```
Key: `feed:following:${userId}:page:${page}`
TTL: 1 minute (60 seconds)
```

**Community Feed:**
```
Key: `feed:community:${communityId}:page:${page}`
TTL: 5 minutes (300 seconds)
```

### Cache Implementation

**Using Node-Cache (Simple, in-memory):**

```javascript
const NodeCache = require('node-cache');
const feedCache = new NodeCache({ stdTTL: 300 }); // 5 minutes default

/**
 * Get or generate home feed with caching
 */
async function getHomeFeed(userId, page = 1, limit = 20) {
  const cacheKey = `feed:home:${userId}:page:${page}`;
  
  // Try to get from cache
  const cached = feedCache.get(cacheKey);
  if (cached) {
    console.log('Cache hit:', cacheKey);
    return cached;
  }
  
  // Generate feed
  console.log('Cache miss:', cacheKey);
  const feed = await generateHomeFeed(userId, page, limit);
  
  // Store in cache
  feedCache.set(cacheKey, feed, 300); // 5 minutes
  
  return feed;
}
```

**Using Redis (Recommended for production):**

```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

/**
 * Get or generate home feed with Redis caching
 */
async function getHomeFeed(userId, page = 1, limit = 20) {
  const cacheKey = `feed:home:${userId}:page:${page}`;
  
  try {
    // Try to get from cache
    const cached = await client.get(cacheKey);
    if (cached) {
      console.log('Redis cache hit:', cacheKey);
      return JSON.parse(cached);
    }
    
    // Generate feed
    console.log('Redis cache miss:', cacheKey);
    const feed = await generateHomeFeed(userId, page, limit);
    
    // Store in cache with TTL
    await client.setEx(cacheKey, 300, JSON.stringify(feed)); // 5 minutes
    
    return feed;
  } catch (error) {
    console.error('Redis error:', error);
    // Fallback to generating without cache
    return await generateHomeFeed(userId, page, limit);
  }
}
```

### Cache Invalidation

**When to invalidate cache:**

1. **User creates a post**
   - Invalidate home feed for all followers
   - Invalidate community feed if posted in community

2. **User deletes a post**
   - Invalidate all feeds containing the post

3. **User follows/unfollows**
   - Invalidate their home feed

4. **User joins/leaves community**
   - Invalidate their home feed

**Implementation:**

```javascript
/**
 * Invalidate home feed cache for user's followers
 */
async function invalidateFollowerFeeds(userId) {
  // Get all followers
  const followers = await Connection.find({ following: userId });
  
  // Invalidate each follower's cache
  for (const follower of followers) {
    const pattern = `feed:home:${follower.follower}:*`;
    await invalidateCachePattern(pattern);
  }
}

/**
 * Invalidate cache by pattern
 */
async function invalidateCachePattern(pattern) {
  if (useRedis) {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } else {
    // Node-cache doesn't support patterns well
    feedCache.flushAll(); // Simple solution: flush all
  }
}
```

**Trade-off for MVP:**
- Don't invalidate on every action (too complex)
- Rely on TTL expiration (5 minutes)
- Users see slightly stale data (acceptable)

---

## Performance Optimization

### 1. Database Indexes

**Critical Indexes:**

```javascript
// Post indexes for feed queries
PostSchema.index({ author: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ community: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1, isDeleted: 1 });

// Connection index for followers query
ConnectionSchema.index({ following: 1 });
ConnectionSchema.index({ follower: 1 });

// Community membership index
CommunityMemberSchema.index({ user: 1 });
```

### 2. Query Optimization

**Use Lean Queries:**
```javascript
// Don't use full Mongoose documents (slower)
const posts = await Post.find(query);

// Use lean() for read-only data (faster)
const posts = await Post.find(query).lean();
```

**Select Only Needed Fields:**
```javascript
// Don't fetch all fields
const posts = await Post.find(query).populate('author');

// Select specific fields
const posts = await Post.find(query)
  .select('content images author community likesCount createdAt')
  .populate('author', 'username profilePicture');
```

**Limit Results:**
```javascript
// Always use pagination
const posts = await Post.find(query)
  .limit(20) // Never fetch all
  .skip((page - 1) * 20);
```

### 3. Batch Operations

**Enrich Posts in Batch:**

```javascript
/**
 * Enrich multiple posts with user data in single query
 */
async function enrichPostsWithUserData(posts, userId) {
  if (posts.length === 0) return [];
  
  const postIds = posts.map(p => p._id);
  
  // Batch query for likes
  const userLikes = await PostLike.find({
    user: userId,
    post: { $in: postIds }
  }).lean();
  
  const likedPostIds = new Set(userLikes.map(l => l.post.toString()));
  
  // Batch query for saved posts
  const userSaves = await SavedPost.find({
    user: userId,
    post: { $in: postIds }
  }).lean();
  
  const savedPostIds = new Set(userSaves.map(s => s.post.toString()));
  
  // Enrich posts
  return posts.map(post => ({
    ...post,
    isLiked: likedPostIds.has(post._id.toString()),
    isSaved: savedPostIds.has(post._id.toString())
  }));
}
```

### 4. Pagination Best Practices

**Offset-Based Pagination (Simple, MVP):**
```javascript
.skip((page - 1) * limit)
.limit(limit)
```

**Cursor-Based Pagination (Better performance, future):**
```javascript
// Instead of page number, use last post ID
const posts = await Post.find({
  _id: { $lt: lastPostId }, // Posts before this ID
  ...otherFilters
})
.limit(20)
.sort({ _id: -1 });
```

### 5. Monitoring & Metrics

**Track Feed Performance:**

```javascript
async function getHomeFeed(userId, page, limit) {
  const startTime = Date.now();
  
  try {
    const feed = await generateHomeFeed(userId, page, limit);
    
    const duration = Date.now() - startTime;
    console.log(`Feed generation took ${duration}ms for user ${userId}`);
    
    // Log slow queries (> 500ms)
    if (duration > 500) {
      console.warn(`Slow feed generation: ${duration}ms`);
    }
    
    return feed;
  } catch (error) {
    console.error('Feed generation error:', error);
    throw error;
  }
}
```

---

## Implementation Details

### Feed Controller

**File**: `controllers/feedController.js`

```javascript
const feedService = require('../services/feedService');

/**
 * GET /api/v1/feed/home
 * Get home feed (algorithmic)
 */
exports.getHomeFeed = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Invalid page or limit value'
        }
      });
    }
    
    // Get feed
    const feed = await feedService.getHomeFeed(userId, page, limit);
    
    return res.status(200).json({
      success: true,
      data: feed.posts,
      pagination: feed.pagination
    });
  } catch (error) {
    console.error('Home feed error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FEED_GENERATION_FAILED',
        message: 'Failed to generate feed'
      }
    });
  }
};

/**
 * GET /api/v1/feed/following
 * Get following feed (chronological)
 */
exports.getFollowingFeed = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Get feed
    const feed = await feedService.getFollowingFeed(userId, page, limit);
    
    return res.status(200).json({
      success: true,
      data: feed.posts,
      pagination: feed.pagination
    });
  } catch (error) {
    console.error('Following feed error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FEED_GENERATION_FAILED',
        message: 'Failed to generate feed'
      }
    });
  }
};
```

### Feed Routes

**File**: `routes/feedRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const checkAuth = require('../middlewares/checkAuth');

/**
 * GET /api/v1/feed/home
 * Get algorithmic home feed
 */
router.get('/home', checkAuth, feedController.getHomeFeed);

/**
 * GET /api/v1/feed/following
 * Get chronological following feed
 */
router.get('/following', checkAuth, feedController.getFollowingFeed);

module.exports = router;
```

---

## Future Enhancements

### Phase 1: Personalization Improvements

1. **User Preferences**
   - Allow users to hide certain tags
   - Allow users to mute users/communities temporarily
   - Track user interaction patterns

2. **Content Diversity**
   - Ensure variety of content types
   - Prevent same author dominating feed
   - Mix old and new content

### Phase 2: Advanced Ranking

1. **Machine Learning**
   - Train model on user interactions
   - Predict content user will engage with
   - Personalized engagement weights

2. **Time-of-Day Optimization**
   - Show different content at different times
   - Learn user's active hours
   - Optimize post delivery timing

### Phase 3: Real-Time Updates

1. **Live Feed**
   - WebSocket for real-time posts
   - "New posts available" notification
   - Auto-refresh option

2. **Trending Section**
   - Identify viral posts
   - Show trending topics
   - Community-specific trending

### Phase 4: A/B Testing Framework

1. **Algorithm Variants**
   - Test different weight combinations
   - Measure engagement metrics
   - Roll out best-performing algorithm

2. **User Segmentation**
   - Different algorithms for different user types
   - Power users vs casual users
   - Content creators vs consumers

---

## Testing

### Unit Tests

```javascript
describe('Feed Algorithm', () => {
  describe('Engagement Score', () => {
    it('should calculate engagement score correctly', () => {
      const post = {
        likesCount: 10,
        commentsCount: 5,
        repostsCount: 2
      };
      const score = calculateEngagementScore(post);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Recency Score', () => {
    it('should score recent posts higher', () => {
      const recentPost = { createdAt: new Date() };
      const oldPost = { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) };
      
      const recentScore = calculateRecencyScore(recentPost);
      const oldScore = calculateRecencyScore(oldPost);
      
      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });
});
```

### Integration Tests

```javascript
describe('GET /api/v1/feed/home', () => {
  it('should return home feed for authenticated user', async () => {
    const response = await request(app)
      .get('/api/v1/feed/home')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });
  
  it('should return 401 without auth', async () => {
    const response = await request(app).get('/api/v1/feed/home');
    expect(response.status).toBe(401);
  });
});
```

---

**End of Feed Algorithm Specification**
