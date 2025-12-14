# Epic 5: Feed & Discovery

**Status**: ⬜ Not Started  
**Priority**: P0 (MVP)  
**Effort**: 8-10 days  
**Depends on**: Epic 1 (Authentication), Epic 2 (Social Features), Epic 3 (Posts)  
**Start Date**: TBD  
**Target Completion**: December 28, 2025

---

## Overview

Implement an intelligent feed algorithm that surfaces relevant content to users from their followed accounts and joined communities. Includes home feed (algorithmic), following feed (chronological), and community feed (chronological).

### Goals

- ✅ Personalized home feed with algorithmic ranking
- ✅ Chronological following feed (no algorithm)
- ✅ Community-specific feeds
- ✅ Fast feed generation (< 2 seconds uncached)
- ✅ Efficient caching strategy (5-minute TTL)
- ✅ Simple, transparent ranking algorithm

### Non-Goals (Post-MVP)

- ❌ Machine learning / AI recommendations
- ❌ Trending topics detection
- ❌ Content filtering by topics/tags
- ❌ Infinite scroll optimization
- ❌ Real-time feed updates (WebSocket)

---

## User Stories

### 1. View Home Feed
**As a** registered user  
**I want to** see a personalized feed of posts from people I follow and communities I joined  
**So that** I can discover relevant and engaging content

**Acceptance Criteria:**
- Feed shows posts from followed users and joined communities
- Posts ranked algorithmically (recency + engagement + source)
- Only shows posts from last 7 days
- Pagination supported (20 posts per page)
- Includes isLiked and isSaved flags
- Feed cached for 5 minutes

---

### 2. View Following Feed
**As a** registered user  
**I want to** see a chronological feed of posts from people I follow  
**So that** I can see the latest content in order

**Acceptance Criteria:**
- Feed shows only posts from followed users (not communities)
- Purely chronological (newest first, no ranking)
- Shows posts from last 30 days
- Pagination supported (20 posts per page)
- Includes isLiked and isSaved flags
- Feed cached for 1 minute

---

### 3. View Community Feed
**As a** user (authenticated or public)  
**I want to** see all posts in a specific community  
**So that** I can explore community content

**Acceptance Criteria:**
- Feed shows all posts in the community
- Chronological order (newest first)
- No time limit (shows all posts)
- Public access (no authentication required)
- Includes isLiked and isSaved for authenticated users
- Feed cached for 5 minutes per community

---

## Feed Algorithm

### Home Feed Ranking Formula

```
Score = (Engagement × 0.5) + (Recency × 0.3) + (Source × 0.2)
```

### 1. Engagement Score (0-100)

**Calculation:**
```javascript
engagementTotal = (likes × 1) + (comments × 3) + (reposts × 2)
normalized = Math.log10(engagementTotal + 1) // Logarithmic to prevent outliers
score = Math.min(normalized × 20, 100) // Scale to 0-100
```

**Weights:**
- Likes: 1x (baseline interaction)
- Comments: 3x (more meaningful engagement)
- Reposts: 2x (quality indicator)

**Example:**
- Post with 10 likes, 5 comments, 2 reposts:
  - Total = (10×1) + (5×3) + (2×2) = 29
  - Normalized = log10(30) = 1.477
  - Score = 1.477 × 20 = 29.5

---

### 2. Recency Score (0-100)

**Calculation:**
```javascript
ageInHours = (now - postCreatedAt) / (1000 * 60 * 60)

if (ageInHours < 1) return 100      // < 1 hour
if (ageInHours < 6) return 90       // 1-6 hours
if (ageInHours < 24) return 70      // 6-24 hours
if (ageInHours < 48) return 50      // 1-2 days
if (ageInHours < 72) return 30      // 2-3 days
if (ageInHours < 168) return 10     // 3-7 days
return 0 // Excluded (> 7 days)
```

**Rationale:**
- Recent posts prioritized heavily
- Steep decay in first 24 hours
- Posts older than 7 days excluded from home feed
- Simple tier system (easy to debug)

---

### 3. Source Score (0-100)

**Calculation:**
```javascript
isFollowedUser = post.author is followed by user
isJoinedCommunity = post.community is joined by user

if (isFollowedUser && isJoinedCommunity) return 100  // Both
if (isFollowedUser) return 80                         // Followed user only
if (isJoinedCommunity) return 60                      // Community only
return 0 // Neither (shouldn't happen in home feed)
```

**Rationale:**
- Content from followed users prioritized
- Community posts slightly lower priority
- Bonus for posts from followed users in joined communities

---

### Combined Score Example

**Post A:**
- Engagement: 50 (moderate engagement)
- Recency: 90 (2 hours old)
- Source: 80 (followed user)
- **Score = (50×0.5) + (90×0.3) + (80×0.2) = 25 + 27 + 16 = 68**

**Post B:**
- Engagement: 80 (high engagement)
- Recency: 30 (2.5 days old)
- Source: 60 (community post)
- **Score = (80×0.5) + (30×0.3) + (60×0.2) = 40 + 9 + 12 = 61**

**Result:** Post A ranks higher despite lower engagement due to recency

---

## Technical Architecture

### Feed Generation Flow

```
User Request
    ↓
Check Cache
    ↓ (miss)
Query Database
    ↓
Calculate Scores
    ↓
Sort by Score
    ↓
Enrich with User Data
    ↓
Cache Results (5 min)
    ↓
Return to User
```

### Caching Strategy

**Cache Keys:**
- Home: `feed:home:{userId}:page:{page}`
- Following: `feed:following:{userId}:page:{page}`
- Community: `feed:community:{communityId}:page:{page}`

**TTL:**
- Home feed: 5 minutes (300s)
- Following feed: 1 minute (60s)
- Community feed: 5 minutes (300s)

**Cache Library:** node-cache (in-memory) or Redis (production)

**Invalidation:**
- User creates post → invalidate followers' home feeds
- User likes/comments → no invalidation (optional)
- Community post → invalidate community feed

---

## Implementation Tasks

### Phase 1: Feed Algorithm Core (3 days)

**T043: Create Feed Algorithm Utilities** (2 days)
- File: `/server/utils/feedAlgorithm.js`
- Functions:
  - `calculateEngagementScore(post)` - Weighted engagement with log normalization
  - `calculateRecencyScore(post)` - Time-based decay
  - `calculateSourceScore(post, userId)` - User/community prioritization
  - `calculateFeedScore(post, userId)` - Combined weighted score
- Tests: 25+ unit tests covering:
  - Engagement scoring with various counts
  - Recency scoring across time ranges
  - Source scoring combinations
  - Combined scoring accuracy
  - Edge cases (zero engagement, very old posts)

**T044: Create Feed Cache Manager** (1 day)
- File: `/server/utils/feedCache.js`
- Functions:
  - `getCachedFeed(key)` - Retrieve from cache
  - `setCachedFeed(key, data, ttl)` - Store in cache
  - `invalidateFeed(userId, type)` - Clear specific feed
  - `invalidateFollowerFeeds(userId)` - Clear followers' feeds
  - `invalidateCommunityFeed(communityId)` - Clear community feed
- Cache library setup (node-cache or Redis)
- Tests: 15+ tests covering:
  - Cache hit/miss behavior
  - TTL expiration
  - Invalidation logic
  - Key generation

---

### Phase 2: Home Feed (2 days)

**T045: Implement Home Feed Controller** (2 days)
- File: `/server/controllers/feed/getHomeFeedController.js`
- Route: `GET /feed/home`
- Middleware: `checkAuth`

**Implementation:**
```javascript
async function getHomeFeed(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user._id;
  
  // 1. Check cache
  const cacheKey = `feed:home:${userId}:page:${page}`;
  const cached = await feedCache.get(cacheKey);
  if (cached) return res.json(cached);
  
  // 2. Get followed users and joined communities
  const followedUsers = await Connection.find({ 
    follower: userId, 
    status: 'following' 
  }).select('following');
  
  const joinedCommunities = await Enrollment.find({ 
    user: userId 
  }).select('community');
  
  // 3. Query posts from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
  
  const posts = await Post.find({
    $or: [
      { author: { $in: followedUsers } },
      { community: { $in: joinedCommunities } }
    ],
    createdAt: { $gte: sevenDaysAgo },
    isDeleted: false
  })
  .populate('author', 'username fullName profilePicture')
  .populate('community', 'name')
  .lean();
  
  // 4. Calculate scores
  const scoredPosts = posts.map(post => ({
    ...post,
    feedScore: calculateFeedScore(post, userId)
  }));
  
  // 5. Sort by score
  scoredPosts.sort((a, b) => b.feedScore - a.feedScore);
  
  // 6. Paginate
  const start = (page - 1) * limit;
  const paginatedPosts = scoredPosts.slice(start, start + limit);
  
  // 7. Enrich with user data (isLiked, isSaved)
  const enrichedPosts = await enrichPostsWithUserData(paginatedPosts, userId);
  
  // 8. Cache and return
  const result = {
    success: true,
    data: {
      posts: enrichedPosts,
      pagination: {
        page, limit,
        total: scoredPosts.length,
        pages: Math.ceil(scoredPosts.length / limit)
      }
    }
  };
  
  await feedCache.set(cacheKey, result, 300); // 5 minutes
  return res.json(result);
}
```

**Tests: 20+ tests**
- Generate feed for user with follows
- Generate feed for user with communities
- Generate feed with both
- Correct algorithmic ranking
- Only posts from last 7 days
- Pagination works
- Cache hit returns cached data
- Cache miss generates new feed
- isLiked/isSaved flags correct
- Empty feed (no follows/communities)

---

### Phase 3: Following Feed (1 day)

**T046: Implement Following Feed Controller** (1 day)
- File: `/server/controllers/feed/getFollowingFeedController.js`
- Route: `GET /feed/following`
- Middleware: `checkAuth`

**Implementation:**
```javascript
async function getFollowingFeed(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user._id;
  
  // 1. Check cache (1-minute TTL)
  const cacheKey = `feed:following:${userId}:page:${page}`;
  const cached = await feedCache.get(cacheKey);
  if (cached) return res.json(cached);
  
  // 2. Get followed users
  const followedUsers = await Connection.find({ 
    follower: userId, 
    status: 'following' 
  }).select('following');
  
  // 3. Query posts (chronological, last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
  
  const posts = await Post.find({
    author: { $in: followedUsers },
    community: null, // Exclude community posts
    createdAt: { $gte: thirtyDaysAgo },
    isDeleted: false
  })
  .sort({ createdAt: -1 }) // Chronological
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('author', 'username fullName profilePicture')
  .lean();
  
  // 4. Enrich with user data
  const enrichedPosts = await enrichPostsWithUserData(posts, userId);
  
  // 5. Get total count
  const total = await Post.countDocuments({
    author: { $in: followedUsers },
    community: null,
    createdAt: { $gte: thirtyDaysAgo },
    isDeleted: false
  });
  
  // 6. Cache and return
  const result = {
    success: true,
    data: {
      posts: enrichedPosts,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit)
      }
    }
  };
  
  await feedCache.set(cacheKey, result, 60); // 1 minute
  return res.json(result);
}
```

**Tests: 15+ tests**
- Chronological order verified
- Only followed users' posts
- No community posts
- Posts from last 30 days only
- Pagination works
- Cache working (1-minute TTL)
- isLiked/isSaved flags correct

---

### Phase 4: Community Feed (1 day)

**T047: Implement Community Feed Controller** (1 day)
- File: `/server/controllers/community/getCommunityFeedController.js`
- Route: `GET /communities/:id/feed`
- Middleware: `optionalAuth` (public access)

**Implementation:**
```javascript
async function getCommunityFeed(req, res) {
  const { id: communityId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user?._id; // Optional auth
  
  // 1. Check cache
  const cacheKey = `feed:community:${communityId}:page:${page}`;
  const cached = await feedCache.get(cacheKey);
  if (cached) {
    // Re-enrich if user authenticated (for isLiked/isSaved)
    if (userId) {
      cached.data.posts = await enrichPostsWithUserData(cached.data.posts, userId);
    }
    return res.json(cached);
  }
  
  // 2. Verify community exists
  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  // 3. Query posts (chronological, no time limit)
  const posts = await Post.find({
    community: communityId,
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('author', 'username fullName profilePicture')
  .lean();
  
  // 4. Enrich if authenticated
  let enrichedPosts = posts;
  if (userId) {
    enrichedPosts = await enrichPostsWithUserData(posts, userId);
  }
  
  // 5. Get total count
  const total = await Post.countDocuments({
    community: communityId,
    isDeleted: false
  });
  
  // 6. Cache and return
  const result = {
    success: true,
    data: {
      posts: enrichedPosts,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit)
      }
    }
  };
  
  await feedCache.set(cacheKey, result, 300); // 5 minutes
  return res.json(result);
}
```

**Tests: 12+ tests**
- Public access works
- Authenticated access includes flags
- Chronological order
- All posts (no time limit)
- Pagination works
- 404 if community not found
- Cache working

---

### Phase 5: Cache Invalidation (1 day)

**T048: Implement Cache Invalidation Logic** (1 day)
- File: `/server/utils/cacheInvalidation.js`
- Hook into existing controllers

**Invalidation Rules:**
1. User creates post → Invalidate followers' home feeds
2. User creates community post → Invalidate community feed
3. User likes/comments → Optional invalidation
4. Post deleted → Invalidate relevant feeds

**Implementation:**
```javascript
// In createPostController.js
await post.save();

// Invalidate caches
if (post.community) {
  await invalidateCommunityFeed(post.community);
} else {
  await invalidateFollowerFeeds(req.user._id);
}
```

**Functions:**
```javascript
async function invalidateFollowerFeeds(userId) {
  const followers = await Connection.find({ 
    following: userId 
  }).select('follower');
  
  for (const follower of followers) {
    await feedCache.del(`feed:home:${follower.follower}:*`);
  }
}

async function invalidateCommunityFeed(communityId) {
  await feedCache.del(`feed:community:${communityId}:*`);
}
```

**Tests: 10+ tests**
- Creating post invalidates followers' feeds
- Community post invalidates community feed
- Deleting post invalidates feeds
- Invalidation doesn't affect other users

---

### Phase 6: Routes & Integration (2 days)

**T049: Create Feed Routes** (0.5 days)
- File: `/server/routes/feedRoutes.js`
- Routes:
  - `GET /feed/home` → getHomeFeed (checkAuth)
  - `GET /feed/following` → getFollowingFeed (checkAuth)
- Community feed route in communityRoutes:
  - `GET /communities/:id/feed` → getCommunityFeed (optionalAuth)

**T050: Create Feed Integration Tests** (1.5 days)
- File: `/server/spec/integration/feed.integration.spec.js`
- Tests: 30+ end-to-end tests

**Test Scenarios:**
- Home feed returns correct posts
- Home feed ranks posts correctly
- Following feed is chronological
- Community feed accessible publicly
- Cache hit returns same data
- Cache miss generates new feed
- Pagination works across all feeds
- isLiked/isSaved flags accurate
- Empty feeds handled correctly
- Performance acceptable (< 2s uncached)

**T051: Update API Documentation** (0.5 days)
- File: `/server/docs/feed.yaml`
- Document all feed endpoints
- Explain ranking algorithm
- Query parameters (page, limit)
- Response schemas
- Performance expectations

---

## API Endpoints

### Get Home Feed

```http
GET /feed/home?page=1&limit=20
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "...",
        "content": "...",
        "author": { ... },
        "feedScore": 68,
        "isLiked": false,
        "isSaved": true,
        "createdAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Following Feed

```http
GET /feed/following?page=1&limit=20
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "posts": [ ... ],
    "pagination": { ... }
  }
}
```

### Get Community Feed

```http
GET /communities/:id/feed?page=1&limit=20
Authorization: Bearer <token> (optional)

Response 200:
{
  "success": true,
  "data": {
    "posts": [ ... ],
    "pagination": { ... }
  }
}
```

---

## Performance Optimization

### Database Indexes

**Required Indexes:**
```javascript
// Posts collection
{ author: 1, createdAt: -1 }
{ community: 1, createdAt: -1 }
{ createdAt: -1, isDeleted: 1 }

// Connections collection
{ follower: 1, status: 1 }
{ following: 1, status: 1 }

// Enrollments collection
{ user: 1 }
{ community: 1 }
```

### Query Optimization

- Use `.lean()` for read-only operations (30-40% faster)
- Project only needed fields
- Limit populated fields to minimum
- Use pagination efficiently (skip + limit)

### Expected Performance

- **Cached feed**: < 50ms
- **Uncached feed (< 1000 posts)**: < 2 seconds
- **Uncached feed (> 1000 posts)**: < 5 seconds
- **Cache invalidation**: < 100ms

---

## Testing Strategy

### Unit Tests (97+ tests)

**Feed Algorithm (25 tests):**
- Engagement score calculation
- Recency score calculation
- Source score calculation
- Combined score accuracy
- Edge cases

**Feed Cache (15 tests):**
- Cache CRUD operations
- TTL behavior
- Key generation
- Invalidation logic

**Feed Controllers (57 tests):**
- Home feed (20 tests)
- Following feed (15 tests)
- Community feed (12 tests)
- Cache invalidation (10 tests)

### Integration Tests (30+ tests)

**End-to-End Feed Flows:**
- Home feed generation and ranking
- Following feed chronological order
- Community feed public access
- Cache behavior (hit/miss)
- Pagination accuracy
- User data enrichment (isLiked, isSaved)
- Performance benchmarks

---

## Monitoring & Tuning

### Algorithm Tuning

**Adjustable Weights:**
```javascript
const WEIGHTS = {
  engagement: 0.5,  // Can adjust between 0.3-0.7
  recency: 0.3,     // Can adjust between 0.2-0.4
  source: 0.2       // Can adjust between 0.1-0.3
};
```

**Metrics to Monitor:**
- Average feed score distribution
- User engagement with ranked posts
- Cache hit rate (target: > 80%)
- Feed generation time (target: < 2s)

### Cache Monitoring

- Cache hit/miss ratio
- Memory usage (node-cache) or Redis memory
- TTL effectiveness
- Invalidation frequency

---

## Success Criteria

- [ ] All 9 tasks completed (T043-T051)
- [ ] All 97+ unit tests passing
- [ ] All 30+ integration tests passing
- [ ] Home feed ranks posts algorithmically
- [ ] Following feed is strictly chronological
- [ ] Community feed accessible to public
- [ ] Cache hit rate > 80%
- [ ] Cached feed < 50ms response time
- [ ] Uncached feed < 2s response time
- [ ] Cache invalidation working correctly
- [ ] Algorithm produces sensible rankings
- [ ] API documentation complete
- [ ] Manual testing successful

---

## Future Enhancements (Post-MVP)

- [ ] Personalized weight adjustment per user
- [ ] Trending topics detection
- [ ] Content filtering by tags/interests
- [ ] Collaborative filtering (similar users)
- [ ] Real-time feed updates (WebSocket)
- [ ] Feed quality metrics and A/B testing
- [ ] Machine learning recommendations
- [ ] Infinite scroll optimization

---

## Dependencies

**Epic 1**: Authentication (checkAuth, optionalAuth)  
**Epic 2**: Social Features (follows, connections)  
**Epic 3**: Posts & Comments (post data, engagement counts)  
**Epic 6**: Communities (community posts, enrollments)

**NPM Packages:**
- `node-cache` (^5.1.2) - In-memory caching
- OR `redis` (^4.6.0) - Production caching (optional)

---

**Epic Owner**: TBD  
**Review Date**: December 28, 2025  
**Status**: Not Started
