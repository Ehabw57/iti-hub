# Epic 5: Feed & Discovery# Epic 5: Feed & Discovery



**Status**: ⬜ Not Started  **Status**: ⬜ Not Started  

**Priority**: P0 (MVP)  **Priority**: P0 (MVP)  

**Effort**: 10-12 days  **Effort**: 8-10 days  

**Depends on**: Epic 1 (Authentication), Epic 2 (Social Features), Epic 3 (Posts)  **Depends on**: Epic 1 (Authentication), Epic 2 (Social Features), Epic 3 (Posts)  

**Start Date**: TBD  **Start Date**: TBD  

**Target Completion**: December 28, 2025**Target Completion**: December 28, 2025



------



## Overview## Overview



Implement a comprehensive feed system with 4 distinct feed types to surface relevant content to users. Includes algorithmic ranking for Home and Trending feeds, chronological feeds for Following and Community posts, with flexible authentication requirements.Implement an intelligent feed algorithm that surfaces relevant content to users from their followed accounts and joined communities. Includes home feed (algorithmic), following feed (chronological), and community feed (chronological).



### Goals### Goals



- ✅ 4 feed types: Home, Following, Trending, Community- ✅ Personalized home feed with algorithmic ranking

- ✅ Personalized home feed with algorithmic ranking (authenticated)- ✅ Chronological following feed (no algorithm)

- ✅ Featured content for unauthenticated users (tag-based)- ✅ Community-specific feeds

- ✅ Chronological following feed (users + communities)- ✅ Fast feed generation (< 2 seconds uncached)

- ✅ Global trending feed (2-day window)- ✅ Efficient caching strategy (5-minute TTL)

- ✅ Community-specific feeds- ✅ Simple, transparent ranking algorithm

- ✅ Fast feed generation (< 2 seconds uncached)

- ✅ Efficient caching strategy (configurable TTL)### Non-Goals (Post-MVP)

- ✅ Simple, transparent ranking algorithm

- ❌ Machine learning / AI recommendations

### Non-Goals (Post-MVP)- ❌ Trending topics detection

- ❌ Content filtering by topics/tags

- ❌ Machine learning / AI recommendations- ❌ Infinite scroll optimization

- ❌ Real-time feed updates (WebSocket)- ❌ Real-time feed updates (WebSocket)

- ❌ Infinite scroll optimization

- ❌ Content filtering by multiple topics/tags---

- ❌ Personalized weight adjustment per user

## User Stories

---

### 1. View Home Feed

## User Stories**As a** registered user  

**I want to** see a personalized feed of posts from people I follow and communities I joined  

### 1. View Home Feed (Optional Auth)**So that** I can discover relevant and engaging content

**As a** visitor or registered user  

**I want to** see a feed of relevant posts  **Acceptance Criteria:**

**So that** I can discover engaging content- Feed shows posts from followed users and joined communities

- Posts ranked algorithmically (recency + engagement + source)

**Acceptance Criteria:**- Only shows posts from last 7 days

- **Unauthenticated**: Shows posts filtered by featured tags (developer-picked)- Pagination supported (20 posts per page)

- **Authenticated**: Shows personalized algorithmic feed from followed users + joined communities- Includes isLiked and isSaved flags

- Posts ranked algorithmically (engagement + recency + source)- Feed cached for 5 minutes

- Only shows posts from last 7 days

- Pagination supported (20 posts per page)---

- Includes isLiked and isSaved flags (when authenticated)

- Feed cached for 5 minutes### 2. View Following Feed

**As a** registered user  

---**I want to** see a chronological feed of posts from people I follow  

**So that** I can see the latest content in order

### 2. View Following Feed (Auth Required)

**As a** registered user  **Acceptance Criteria:**

**I want to** see a chronological feed of posts from people I follow and communities I joined  - Feed shows only posts from followed users (not communities)

**So that** I can see the latest content in order- Purely chronological (newest first, no ranking)

- Shows posts from last 30 days

**Acceptance Criteria:**- Pagination supported (20 posts per page)

- **Requires authentication**- Includes isLiked and isSaved flags

- Feed shows posts from both followed users AND joined communities- Feed cached for 1 minute

- Purely chronological (newest first, no ranking)

- Shows posts from last 30 days---

- Pagination supported (20 posts per page)

- Includes isLiked and isSaved flags### 3. View Community Feed

- Feed cached for 1 minute**As a** user (authenticated or public)  

**I want to** see all posts in a specific community  

---**So that** I can explore community content



### 3. View Trending Feed (Optional Auth)**Acceptance Criteria:**

**As a** visitor or registered user  - Feed shows all posts in the community

**I want to** see what's trending globally  - Chronological order (newest first)

**So that** I can discover popular and engaging content- No time limit (shows all posts)

- Public access (no authentication required)

**Acceptance Criteria:**- Includes isLiked and isSaved for authenticated users

- **Global scope**: Shows all public posts from everyone- Feed cached for 5 minutes per community

- Posts ranked algorithmically (engagement + recency)

- Only shows posts from last 2 days (high recency focus)---

- Pagination supported (20 posts per page)

- Includes isLiked and isSaved flags (when authenticated)## Feed Algorithm

- Feed cached for 5 minutes

### Home Feed Ranking Formula

---

```

### 4. View Community Feed (Optional Auth)Score = (Engagement × 0.5) + (Recency × 0.3) + (Source × 0.2)

**As a** user (authenticated or public)  ```

**I want to** see all posts in a specific community  

**So that** I can explore community content### 1. Engagement Score (0-100)



**Acceptance Criteria:****Calculation:**

- Feed shows all posts in the community```javascript

- Chronological order (newest first)engagementTotal = (likes × 1) + (comments × 3) + (reposts × 2)

- No time limit (shows all posts)normalized = Math.log10(engagementTotal + 1) // Logarithmic to prevent outliers

- Public access (no authentication required)score = Math.min(normalized × 20, 100) // Scale to 0-100

- Includes isLiked and isSaved for authenticated users```

- Feed cached for 5 minutes per community

**Weights:**

---- Likes: 1x (baseline interaction)

- Comments: 3x (more meaningful engagement)

## Feed Configuration (Constants)- Reposts: 2x (quality indicator)



All feed parameters are configurable via `/server/utils/constants.js`:**Example:**

- Post with 10 likes, 5 comments, 2 reposts:

```javascript  - Total = (10×1) + (5×3) + (2×2) = 29

// Time windows for different feed types  - Normalized = log10(30) = 1.477

const TRENDING_FEED_DAYS = 2;      // 2 days for trending  - Score = 1.477 × 20 = 29.5

const HOME_FEED_DAYS = 7;          // 7 days for home feed

const FOLLOWING_FEED_DAYS = 30;    // 30 days for following feed---



// Featured tags for unauthenticated home feed### 2. Recency Score (0-100)

const FEATURED_TAGS = ['technology', 'programming', 'design', 'business', 'education'];

**Calculation:**

// Feed algorithm weights```javascript

const FEED_WEIGHTS = {ageInHours = (now - postCreatedAt) / (1000 * 60 * 60)

  HOME: {

    engagement: 0.5,if (ageInHours < 1) return 100      // < 1 hour

    recency: 0.3,if (ageInHours < 6) return 90       // 1-6 hours

    source: 0.2if (ageInHours < 24) return 70      // 6-24 hours

  },if (ageInHours < 48) return 50      // 1-2 days

  TRENDING: {if (ageInHours < 72) return 30      // 2-3 days

    engagement: 0.6,if (ageInHours < 168) return 10     // 3-7 days

    recency: 0.4return 0 // Excluded (> 7 days)

  }```

};

**Rationale:**

// Cache TTL (in seconds)- Recent posts prioritized heavily

const FEED_CACHE_TTL = {- Steep decay in first 24 hours

  HOME: 300,        // 5 minutes- Posts older than 7 days excluded from home feed

  FOLLOWING: 60,    // 1 minute- Simple tier system (easy to debug)

  TRENDING: 300,    // 5 minutes

  COMMUNITY: 300    // 5 minutes---

};

```### 3. Source Score (0-100)



---**Calculation:**

```javascript

## Feed Types ComparisonisFollowedUser = post.author is followed by user

isJoinedCommunity = post.community is joined by user

| Feed Type | Auth Required | Scope | Algorithm | Time Window | Cache TTL |

|-----------|--------------|-------|-----------|-------------|-----------|if (isFollowedUser && isJoinedCommunity) return 100  // Both

| **Home** | Optional | Authenticated: Followed users + communities<br>Unauthenticated: Featured tags | Algorithmic (E:0.5, R:0.3, S:0.2) | 7 days | 5 min |if (isFollowedUser) return 80                         // Followed user only

| **Following** | Required | Followed users + joined communities | Chronological | 30 days | 1 min |if (isJoinedCommunity) return 60                      // Community only

| **Trending** | Optional | Global (all public posts) | Algorithmic (E:0.6, R:0.4) | 2 days | 5 min |return 0 // Neither (shouldn't happen in home feed)

| **Community** | Optional | Specific community | Chronological | No limit | 5 min |```



---**Rationale:**

- Content from followed users prioritized

## Feed Algorithm- Community posts slightly lower priority

- Bonus for posts from followed users in joined communities

### Shared Components (Home & Trending)

---

Both Home and Trending feeds use the same scoring functions with different weights.

### Combined Score Example

### 1. Engagement Score (0-100)

**Post A:**

**Calculation:**- Engagement: 50 (moderate engagement)

```javascript- Recency: 90 (2 hours old)

function calculateEngagementScore(post) {- Source: 80 (followed user)

  const engagementTotal = (post.likesCount × 1) + - **Score = (50×0.5) + (90×0.3) + (80×0.2) = 25 + 27 + 16 = 68**

                          (post.commentsCount × 3) + 

                          (post.repostsCount × 2);**Post B:**

  - Engagement: 80 (high engagement)

  const normalized = Math.log10(engagementTotal + 1); // Logarithmic to prevent outliers- Recency: 30 (2.5 days old)

  const score = Math.min(normalized × 20, 100); // Scale to 0-100- Source: 60 (community post)

  - **Score = (80×0.5) + (30×0.3) + (60×0.2) = 40 + 9 + 12 = 61**

  return score;

}**Result:** Post A ranks higher despite lower engagement due to recency

```

---

**Weights:**

- Likes: 1x (baseline interaction)## Technical Architecture

- Comments: 3x (more meaningful engagement)

- Reposts: 2x (quality indicator)### Feed Generation Flow



**Example:**```

- Post with 10 likes, 5 comments, 2 reposts:User Request

  - Total = (10×1) + (5×3) + (2×2) = 29    ↓

  - Normalized = log10(30) = 1.477Check Cache

  - Score = 1.477 × 20 = **29.5**    ↓ (miss)

Query Database

---    ↓

Calculate Scores

### 2. Recency Score (0-100)    ↓

Sort by Score

**Calculation:**    ↓

```javascriptEnrich with User Data

function calculateRecencyScore(post) {    ↓

  const now = Date.now();Cache Results (5 min)

  const ageInHours = (now - post.createdAt) / (1000 * 60 * 60);    ↓

  Return to User

  if (ageInHours < 1) return 100;       // < 1 hour```

  if (ageInHours < 6) return 90;        // 1-6 hours

  if (ageInHours < 24) return 70;       // 6-24 hours### Caching Strategy

  if (ageInHours < 48) return 50;       // 1-2 days

  if (ageInHours < 72) return 30;       // 2-3 days**Cache Keys:**

  if (ageInHours < 168) return 10;      // 3-7 days- Home: `feed:home:{userId}:page:{page}`

  return 0; // > 7 days- Following: `feed:following:{userId}:page:{page}`

}- Community: `feed:community:{communityId}:page:{page}`

```

**TTL:**

**Rationale:**- Home feed: 5 minutes (300s)

- Recent posts prioritized heavily- Following feed: 1 minute (60s)

- Steep decay in first 24 hours- Community feed: 5 minutes (300s)

- Simple tier system (easy to debug)

- Posts older than feed time window excluded**Cache Library:** node-cache (in-memory) or Redis (production)



---**Invalidation:**

- User creates post → invalidate followers' home feeds

### 3. Source Score (0-100) - Home Feed Only- User likes/comments → no invalidation (optional)

- Community post → invalidate community feed

**Calculation:**

```javascript---

function calculateSourceScore(post, userId) {

  const isFollowedUser = post.author is followed by userId;## Implementation Tasks

  const isJoinedCommunity = post.community is joined by userId;
  ```

  ### Phase 1: Feed Algorithm Core (3 days)

  if (isFollowedUser && isJoinedCommunity) return 100;  // Both

  if (isFollowedUser) return 80;                        // Followed user only**T043: Create Feed Algorithm Utilities** (2 days)

  if (isJoinedCommunity) return 60;                     // Community only- File: `/server/utils/feedAlgorithm.js`

  return 0; // Neither (shouldn't happen in home feed)- Functions:

}  - `calculateEngagementScore(post)` - Weighted engagement with log normalization

```  - `calculateRecencyScore(post)` - Time-based decay

  - `calculateSourceScore(post, userId)` - User/community prioritization

**Rationale:**  - `calculateFeedScore(post, userId)` - Combined weighted score

- Content from followed users prioritized- Tests: 25+ unit tests covering:

- Community posts slightly lower priority  - Engagement scoring with various counts

- Bonus for posts from followed users in joined communities  - Recency scoring across time ranges

  - Source scoring combinations

---  - Combined scoring accuracy

  - Edge cases (zero engagement, very old posts)

### 4. Combined Score

**T044: Create Feed Cache Manager** (1 day)

**Home Feed Formula:**- File: `/server/utils/feedCache.js`

```- Functions:

Score = (Engagement × 0.5) + (Recency × 0.3) + (Source × 0.2)  - `getCachedFeed(key)` - Retrieve from cache

```  - `setCachedFeed(key, data, ttl)` - Store in cache

  - `invalidateFeed(userId, type)` - Clear specific feed

**Trending Feed Formula:**  - `invalidateFollowerFeeds(userId)` - Clear followers' feeds

```  - `invalidateCommunityFeed(communityId)` - Clear community feed

Score = (Engagement × 0.6) + (Recency × 0.4)- Cache library setup (node-cache or Redis)

```- Tests: 15+ tests covering:

  - Cache hit/miss behavior

**Example (Home Feed):**  - TTL expiration

  - Invalidation logic

**Post A:**  - Key generation

- Engagement: 50 (moderate engagement)

- Recency: 90 (2 hours old)---

- Source: 80 (followed user)

- **Score = (50×0.5) + (90×0.3) + (80×0.2) = 25 + 27 + 16 = 68**### Phase 2: Home Feed (2 days)



**Post B:****T045: Implement Home Feed Controller** (2 days)

- Engagement: 80 (high engagement)- File: `/server/controllers/feed/getHomeFeedController.js`

- Recency: 30 (2.5 days old)- Route: `GET /feed/home`

- Source: 60 (community post)- Middleware: `checkAuth`

- **Score = (80×0.5) + (30×0.3) + (60×0.2) = 40 + 9 + 12 = 61**

**Implementation:**

**Result:** Post A ranks higher despite lower engagement due to recency```javascript

async function getHomeFeed(req, res) {

---  const { page = 1, limit = 20 } = req.query;

  const userId = req.user._id;

## Technical Architecture  

  // 1. Check cache

### Feed Generation Flow  const cacheKey = `feed:home:${userId}:page:${page}`;

  const cached = await feedCache.get(cacheKey);

```  if (cached) return res.json(cached);

User Request  

    ↓  // 2. Get followed users and joined communities

Check Authentication (if optionalAuth)  const followedUsers = await Connection.find({ 

    ↓    follower: userId, 

Check Cache (with auth state)    status: 'following' 

    ↓ (miss)  }).select('following');

Query Database (filtered by feed type)  

    ↓  const joinedCommunities = await Enrollment.find({ 

Calculate Scores (if algorithmic)    user: userId 

    ↓  }).select('community');

Sort (by score or createdAt)  

    ↓  // 3. Query posts from last 7 days

Enrich with User Data (isLiked, isSaved)  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);

    ↓  

Cache Results (TTL from config)  const posts = await Post.find({

    ↓    $or: [

Return to User      { author: { $in: followedUsers } },

```      { community: { $in: joinedCommunities } }

    ],

### Caching Strategy    createdAt: { $gte: sevenDaysAgo },

    isDeleted: false

**Cache Keys:**  })

- Home (auth): `feed:home:${userId}:page:${page}`  .populate('author', 'username fullName profilePicture')

- Home (public): `feed:home:public:page:${page}`  .populate('community', 'name')

- Following: `feed:following:${userId}:page:${page}`  .lean();

- Trending (auth): `feed:trending:${userId}:page:${page}`  

- Trending (public): `feed:trending:public:page:${page}`  // 4. Calculate scores

- Community (auth): `feed:community:${communityId}:${userId}:page:${page}`  const scoredPosts = posts.map(post => ({

- Community (public): `feed:community:${communityId}:public:page:${page}`    ...post,

    feedScore: calculateFeedScore(post, userId)

**TTL (from FEED_CACHE_TTL constant):**  }));

- Home feed: 5 minutes (300s)  

- Following feed: 1 minute (60s)  // 5. Sort by score

- Trending feed: 5 minutes (300s)  scoredPosts.sort((a, b) => b.feedScore - a.feedScore);

- Community feed: 5 minutes (300s)  

  // 6. Paginate

**Cache Library:** node-cache (in-memory) or Redis (production)  const start = (page - 1) * limit;

  const paginatedPosts = scoredPosts.slice(start, start + limit);

**Invalidation:**  

- User creates post → invalidate:  // 7. Enrich with user data (isLiked, isSaved)

  - Followers' home/following feeds  const enrichedPosts = await enrichPostsWithUserData(paginatedPosts, userId);

  - Trending feed (global)  

- User creates community post → invalidate:  // 8. Cache and return

  - Community feed  const result = {

  - Trending feed (global)    success: true,

- Post deleted → invalidate relevant feeds    data: {

      posts: enrichedPosts,

---      pagination: {

        page, limit,

## Implementation Tasks        total: scoredPosts.length,

        pages: Math.ceil(scoredPosts.length / limit)

### Phase 1: Feed Algorithm Core (3 days)      }

    }

**T043: Create Feed Algorithm Utilities** (2 days)  };

- File: `/server/utils/feedAlgorithm.js`  

- Functions:  await feedCache.set(cacheKey, result, 300); // 5 minutes

  - `calculateEngagementScore(post)` - Weighted engagement with log normalization  return res.json(result);

  - `calculateRecencyScore(post)` - Time-based decay}

  - `calculateSourceScore(post, userId)` - User/community prioritization (Home feed only)```

  - `calculateFeedScore(post, userId, feedType)` - Combined weighted score

    - Accepts `feedType` parameter: 'home' or 'trending'**Tests: 20+ tests**

    - Uses FEED_WEIGHTS constant for weights- Generate feed for user with follows

- Tests: 30+ unit tests covering:- Generate feed for user with communities

  - Engagement scoring with various counts- Generate feed with both

  - Recency scoring across time ranges- Correct algorithmic ranking

  - Source scoring combinations- Only posts from last 7 days

  - Combined scoring accuracy for both feed types- Pagination works

  - Edge cases (zero engagement, very old posts)- Cache hit returns cached data

  - Weight application from constants- Cache miss generates new feed

- isLiked/isSaved flags correct

**T044: Create Feed Cache Manager** (1 day)- Empty feed (no follows/communities)

- File: `/server/utils/feedCache.js`

- Functions:---

  - `getCachedFeed(key)` - Retrieve from cache

  - `setCachedFeed(key, data, ttl)` - Store in cache### Phase 3: Following Feed (1 day)

  - `invalidateFeed(userId, type)` - Clear specific feed

  - `invalidateFollowerFeeds(userId)` - Clear followers' feeds**T046: Implement Following Feed Controller** (1 day)

  - `invalidateCommunityFeed(communityId)` - Clear community feed- File: `/server/controllers/feed/getFollowingFeedController.js`

  - `invalidateTrendingFeed()` - Clear trending feed (all users)- Route: `GET /feed/following`

  - `generateCacheKey(feedType, userId, page, communityId)` - Generate cache key with auth state- Middleware: `checkAuth`

- Cache library setup (node-cache or Redis)

- Support for authenticated/unauthenticated cache separation**Implementation:**

- TTL from FEED_CACHE_TTL constant```javascript

- Tests: 20+ tests covering:async function getFollowingFeed(req, res) {

  - Cache hit/miss behavior  const { page = 1, limit = 20 } = req.query;

  - TTL expiration  const userId = req.user._id;

  - Invalidation logic  

  - Key generation with auth states  // 1. Check cache (1-minute TTL)

  - Separate caching for auth/unauth users  const cacheKey = `feed:following:${userId}:page:${page}`;

  const cached = await feedCache.get(cacheKey);

---  if (cached) return res.json(cached);

  

### Phase 2: Home Feed (2.5 days)  // 2. Get followed users

  const followedUsers = await Connection.find({ 

**T045: Implement Home Feed Controller** (2.5 days)    follower: userId, 

- File: `/server/controllers/feed/getHomeFeedController.js`    status: 'following' 

- Route: `GET /feed/home`  }).select('following');

- Middleware: `optionalAuth`  

  // 3. Query posts (chronological, last 30 days)

**Implementation:**  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);

```javascript  

async function getHomeFeed(req, res) {  const posts = await Post.find({

  const { page = 1, limit = 20 } = req.query;    author: { $in: followedUsers },

  const userId = req.user?._id; // Optional auth    community: null, // Exclude community posts

  const isAuthenticated = !!userId;    createdAt: { $gte: thirtyDaysAgo },

      isDeleted: false

  // 1. Check cache (different cache for auth/unauth)  })

  const cacheKey = feedCache.generateCacheKey(  .sort({ createdAt: -1 }) // Chronological

    'home',   .skip((page - 1) * limit)

    isAuthenticated ? userId : 'public',   .limit(limit)

    page  .populate('author', 'username fullName profilePicture')

  );  .lean();

  const cached = await feedCache.get(cacheKey);  

  if (cached) return res.json(cached);  // 4. Enrich with user data

    const enrichedPosts = await enrichPostsWithUserData(posts, userId);

  let posts;  

    // 5. Get total count

  if (isAuthenticated) {  const total = await Post.countDocuments({

    // 2a. AUTHENTICATED: Get followed users and joined communities    author: { $in: followedUsers },

    const followedUsers = await Connection.find({     community: null,

      follower: userId,     createdAt: { $gte: thirtyDaysAgo },

      status: 'following'     isDeleted: false

    }).select('following');  });

      

    const joinedCommunities = await Enrollment.find({   // 6. Cache and return

      user: userId   const result = {

    }).select('community');    success: true,

        data: {

    // 3a. Query posts from last HOME_FEED_DAYS (7 days)      posts: enrichedPosts,

    const cutoffDate = new Date(Date.now() - HOME_FEED_DAYS * 24 * 60 * 60 * 1000);      pagination: {

            page, limit, total,

    posts = await Post.find({        pages: Math.ceil(total / limit)

      $or: [      }

        { author: { $in: followedUsers.map(f => f.following) } },    }

        { community: { $in: joinedCommunities.map(e => e.community) } }  };

      ],  

      createdAt: { $gte: cutoffDate },  await feedCache.set(cacheKey, result, 60); // 1 minute

      isDeleted: false  return res.json(result);

    })}

    .populate('author', 'username fullName profilePicture')```

    .populate('community', 'name')

    .lean();**Tests: 15+ tests**

    - Chronological order verified

    // 4. Calculate scores- Only followed users' posts

    const scoredPosts = posts.map(post => ({- No community posts

      ...post,- Posts from last 30 days only

      feedScore: calculateFeedScore(post, userId, 'home')- Pagination works

    }));- Cache working (1-minute TTL)

    - isLiked/isSaved flags correct

    // 5. Sort by score

    scoredPosts.sort((a, b) => b.feedScore - a.feedScore);---

    

  } else {### Phase 4: Community Feed (1 day)

    // 2b. UNAUTHENTICATED: Get posts with featured tags

    const cutoffDate = new Date(Date.now() - HOME_FEED_DAYS * 24 * 60 * 60 * 1000);**T047: Implement Community Feed Controller** (1 day)

    - File: `/server/controllers/community/getCommunityFeedController.js`

    posts = await Post.find({- Route: `GET /communities/:id/feed`

      tags: { $in: FEATURED_TAGS },- Middleware: `optionalAuth` (public access)

      createdAt: { $gte: cutoffDate },

      isDeleted: false**Implementation:**

    })```javascript

    .populate('author', 'username fullName profilePicture')async function getCommunityFeed(req, res) {

    .populate('community', 'name')  const { id: communityId } = req.params;

    .lean();  const { page = 1, limit = 20 } = req.query;

      const userId = req.user?._id; // Optional auth

    // 4. Calculate scores (no source score for unauth)  

    const scoredPosts = posts.map(post => ({  // 1. Check cache

      ...post,  const cacheKey = `feed:community:${communityId}:page:${page}`;

      feedScore: calculateFeedScore(post, null, 'home')  const cached = await feedCache.get(cacheKey);

    }));  if (cached) {

        // Re-enrich if user authenticated (for isLiked/isSaved)

    // 5. Sort by score    if (userId) {

    scoredPosts.sort((a, b) => b.feedScore - a.feedScore);      cached.data.posts = await enrichPostsWithUserData(cached.data.posts, userId);

  }    }

      return res.json(cached);

  // 6. Paginate  }

  const start = (page - 1) * limit;  

  const paginatedPosts = scoredPosts.slice(start, start + limit);  // 2. Verify community exists

    const community = await Community.findById(communityId);

  // 7. Enrich with user data (if authenticated)  if (!community) {

  let enrichedPosts = paginatedPosts;    return res.status(404).json({

  if (isAuthenticated) {      success: false,

    enrichedPosts = await enrichPostsWithUserData(paginatedPosts, userId);      message: 'Community not found'

  }    });

    }

  // 8. Cache and return  

  const result = {  // 3. Query posts (chronological, no time limit)

    success: true,  const posts = await Post.find({

    data: {    community: communityId,

      posts: enrichedPosts,    isDeleted: false

      pagination: {  })

        page: parseInt(page),  .sort({ createdAt: -1 })

        limit: parseInt(limit),  .skip((page - 1) * limit)

        total: scoredPosts.length,  .limit(limit)

        pages: Math.ceil(scoredPosts.length / limit)  .populate('author', 'username fullName profilePicture')

      }  .lean();

    }  

  };  // 4. Enrich if authenticated

    let enrichedPosts = posts;

  await feedCache.set(cacheKey, result, FEED_CACHE_TTL.HOME);  if (userId) {

  return res.json(result);    enrichedPosts = await enrichPostsWithUserData(posts, userId);

}  }

```  

  // 5. Get total count

**Tests: 25+ tests**  const total = await Post.countDocuments({

- Generate feed for authenticated user with follows    community: communityId,

- Generate feed for authenticated user with communities    isDeleted: false

- Generate feed with both follows and communities  });

- Generate feed for unauthenticated user (featured tags)  

- Correct algorithmic ranking for authenticated users  // 6. Cache and return

- Correct algorithmic ranking for unauthenticated users  const result = {

- Only posts from last HOME_FEED_DAYS    success: true,

- Pagination works for both auth states    data: {

- Cache hit returns cached data      posts: enrichedPosts,

- Cache miss generates new feed      pagination: {

- Separate caches for auth/unauth        page, limit, total,

- isLiked/isSaved flags correct when authenticated        pages: Math.ceil(total / limit)

- No user flags when unauthenticated      }

- Empty feed (no follows/communities)    }

- Empty feed (no featured tag posts)  };

  

---  await feedCache.set(cacheKey, result, 300); // 5 minutes

  return res.json(result);

### Phase 3: Following Feed (1.5 days)}

```

**T046: Implement Following Feed Controller** (1.5 days)

- File: `/server/controllers/feed/getFollowingFeedController.js`**Tests: 12+ tests**

- Route: `GET /feed/following`- Public access works

- Middleware: `checkAuth` (REQUIRED)- Authenticated access includes flags

- Chronological order

**Implementation:**- All posts (no time limit)

```javascript- Pagination works

async function getFollowingFeed(req, res) {- 404 if community not found

  const { page = 1, limit = 20 } = req.query;- Cache working

  const userId = req.user._id;

  ---

  // 1. Check cache (1-minute TTL)

  const cacheKey = feedCache.generateCacheKey('following', userId, page);### Phase 5: Cache Invalidation (1 day)

  const cached = await feedCache.get(cacheKey);

  if (cached) return res.json(cached);**T048: Implement Cache Invalidation Logic** (1 day)

  - File: `/server/utils/cacheInvalidation.js`

  // 2. Get followed users- Hook into existing controllers

  const followedUsers = await Connection.find({ 

    follower: userId, **Invalidation Rules:**

    status: 'following' 1. User creates post → Invalidate followers' home feeds

  }).select('following');2. User creates community post → Invalidate community feed

  3. User likes/comments → Optional invalidation

  // 3. Get joined communities4. Post deleted → Invalidate relevant feeds

  const joinedCommunities = await Enrollment.find({ 

    user: userId **Implementation:**

  }).select('community');```javascript

  // In createPostController.js

  // 4. Query posts (chronological, last FOLLOWING_FEED_DAYS)await post.save();

  const cutoffDate = new Date(Date.now() - FOLLOWING_FEED_DAYS * 24 * 60 * 60 * 1000);

  // Invalidate caches

  const posts = await Post.find({if (post.community) {

    $or: [  await invalidateCommunityFeed(post.community);

      { author: { $in: followedUsers.map(f => f.following) } },} else {

      { community: { $in: joinedCommunities.map(e => e.community) } }  await invalidateFollowerFeeds(req.user._id);

    ],}

    createdAt: { $gte: cutoffDate },```

    isDeleted: false

  })**Functions:**

  .sort({ createdAt: -1 }) // Chronological (newest first)```javascript

  .skip((page - 1) * limit)async function invalidateFollowerFeeds(userId) {

  .limit(parseInt(limit))  const followers = await Connection.find({ 

  .populate('author', 'username fullName profilePicture')    following: userId 

  .populate('community', 'name')  }).select('follower');

  .lean();  

    for (const follower of followers) {

  // 5. Enrich with user data    await feedCache.del(`feed:home:${follower.follower}:*`);

  const enrichedPosts = await enrichPostsWithUserData(posts, userId);  }

  }

  // 6. Get total count

  const total = await Post.countDocuments({async function invalidateCommunityFeed(communityId) {

    $or: [  await feedCache.del(`feed:community:${communityId}:*`);

      { author: { $in: followedUsers.map(f => f.following) } },}

      { community: { $in: joinedCommunities.map(e => e.community) } }```

    ],

    createdAt: { $gte: cutoffDate },**Tests: 10+ tests**

    isDeleted: false- Creating post invalidates followers' feeds

  });- Community post invalidates community feed

  - Deleting post invalidates feeds

  // 7. Cache and return- Invalidation doesn't affect other users

  const result = {

    success: true,---

    data: {

      posts: enrichedPosts,### Phase 6: Routes & Integration (2 days)

      pagination: {

        page: parseInt(page),**T049: Create Feed Routes** (0.5 days)

        limit: parseInt(limit),- File: `/server/routes/feedRoutes.js`

        total,- Routes:

        pages: Math.ceil(total / limit)  - `GET /feed/home` → getHomeFeed (checkAuth)

      }  - `GET /feed/following` → getFollowingFeed (checkAuth)

    }- Community feed route in communityRoutes:

  };  - `GET /communities/:id/feed` → getCommunityFeed (optionalAuth)

  

  await feedCache.set(cacheKey, result, FEED_CACHE_TTL.FOLLOWING);**T050: Create Feed Integration Tests** (1.5 days)

  return res.json(result);- File: `/server/spec/integration/feed.integration.spec.js`

}- Tests: 30+ end-to-end tests

```

**Test Scenarios:**

**Tests: 20+ tests**- Home feed returns correct posts

- Chronological order verified (newest first)- Home feed ranks posts correctly

- Includes posts from followed users- Following feed is chronological

- Includes posts from joined communities- Community feed accessible publicly

- Both followed users and communities combined- Cache hit returns same data

- Posts from last FOLLOWING_FEED_DAYS only- Cache miss generates new feed

- Pagination works- Pagination works across all feeds

- Cache working (1-minute TTL)- isLiked/isSaved flags accurate

- isLiked/isSaved flags correct- Empty feeds handled correctly

- Authentication required (401 without token)- Performance acceptable (< 2s uncached)

- Empty feed (no follows or communities)

**T051: Update API Documentation** (0.5 days)

---- File: `/server/docs/feed.yaml`

- Document all feed endpoints

### Phase 4: Trending Feed (2 days)- Explain ranking algorithm

- Query parameters (page, limit)

**T047: Implement Trending Feed Controller** (2 days)- Response schemas

- File: `/server/controllers/feed/getTrendingFeedController.js`- Performance expectations

- Route: `GET /feed/trending`

- Middleware: `optionalAuth`---



**Implementation:**## API Endpoints

```javascript

async function getTrendingFeed(req, res) {### Get Home Feed

  const { page = 1, limit = 20 } = req.query;

  const userId = req.user?._id; // Optional auth```http

  const isAuthenticated = !!userId;GET /feed/home?page=1&limit=20

  Authorization: Bearer <token>

  // 1. Check cache (different cache for auth/unauth)

  const cacheKey = feedCache.generateCacheKey(Response 200:

    'trending',{

    isAuthenticated ? userId : 'public',  "success": true,

    page  "data": {

  );    "posts": [

  const cached = await feedCache.get(cacheKey);      {

  if (cached) return res.json(cached);        "_id": "...",

          "content": "...",

  // 2. Query all public posts from last TRENDING_FEED_DAYS (2 days)        "author": { ... },

  const cutoffDate = new Date(Date.now() - TRENDING_FEED_DAYS * 24 * 60 * 60 * 1000);        "feedScore": 68,

          "isLiked": false,

  const posts = await Post.find({        "isSaved": true,

    createdAt: { $gte: cutoffDate },        "createdAt": "..."

    isDeleted: false      }

  })    ],

  .populate('author', 'username fullName profilePicture')    "pagination": {

  .populate('community', 'name')      "page": 1,

  .lean();      "limit": 20,

        "total": 45,

  // 3. Calculate trending scores      "pages": 3

  const scoredPosts = posts.map(post => ({    }

    ...post,  }

    feedScore: calculateFeedScore(post, null, 'trending') // No userId for trending}

  }));```

  

  // 4. Sort by score (highest first)### Get Following Feed

  scoredPosts.sort((a, b) => b.feedScore - a.feedScore);

  ```http

  // 5. PaginateGET /feed/following?page=1&limit=20

  const start = (page - 1) * limit;Authorization: Bearer <token>

  const paginatedPosts = scoredPosts.slice(start, start + parseInt(limit));

  Response 200:

  // 6. Enrich with user data (if authenticated){

  let enrichedPosts = paginatedPosts;  "success": true,

  if (isAuthenticated) {  "data": {

    enrichedPosts = await enrichPostsWithUserData(paginatedPosts, userId);    "posts": [ ... ],

  }    "pagination": { ... }

    }

  // 7. Cache and return}

  const result = {```

    success: true,

    data: {### Get Community Feed

      posts: enrichedPosts,

      pagination: {```http

        page: parseInt(page),GET /communities/:id/feed?page=1&limit=20

        limit: parseInt(limit),Authorization: Bearer <token> (optional)

        total: scoredPosts.length,

        pages: Math.ceil(scoredPosts.length / limit)Response 200:

      }{

    }  "success": true,

  };  "data": {

      "posts": [ ... ],

  await feedCache.set(cacheKey, result, FEED_CACHE_TTL.TRENDING);    "pagination": { ... }

  return res.json(result);  }

}}

``````



**Tests: 20+ tests**---

- Global scope (all posts from all users)

- Algorithmic ranking with trending weights (0.6, 0.4)## Performance Optimization

- Only posts from last TRENDING_FEED_DAYS (2 days)

- Pagination works### Database Indexes

- Cache working (5-minute TTL)

- Separate caches for auth/unauth users**Required Indexes:**

- isLiked/isSaved flags when authenticated```javascript

- No user flags when unauthenticated// Posts collection

- High engagement posts rank higher{ author: 1, createdAt: -1 }

- Recent posts rank higher than old posts with same engagement{ community: 1, createdAt: -1 }

- Public access works (no auth required){ createdAt: -1, isDeleted: 1 }



---// Connections collection

{ follower: 1, status: 1 }

### Phase 5: Community Feed (1 day){ following: 1, status: 1 }



**T048: Implement Community Feed Controller** (1 day)// Enrollments collection

- File: `/server/controllers/community/getCommunityFeedController.js`{ user: 1 }

- Route: `GET /communities/:id/feed`{ community: 1 }

- Middleware: `optionalAuth` (public access)```



**Implementation:**### Query Optimization

```javascript

async function getCommunityFeed(req, res) {- Use `.lean()` for read-only operations (30-40% faster)

  const { id: communityId } = req.params;- Project only needed fields

  const { page = 1, limit = 20 } = req.query;- Limit populated fields to minimum

  const userId = req.user?._id; // Optional auth- Use pagination efficiently (skip + limit)

  const isAuthenticated = !!userId;

  ### Expected Performance

  // 1. Check cache

  const cacheKey = feedCache.generateCacheKey(- **Cached feed**: < 50ms

    'community',- **Uncached feed (< 1000 posts)**: < 2 seconds

    isAuthenticated ? userId : 'public',- **Uncached feed (> 1000 posts)**: < 5 seconds

    page,- **Cache invalidation**: < 100ms

    communityId

  );---

  const cached = await feedCache.get(cacheKey);

  if (cached) return res.json(cached);## Testing Strategy

  

  // 2. Verify community exists### Unit Tests (97+ tests)

  const community = await Community.findById(communityId);

  if (!community) {**Feed Algorithm (25 tests):**

    return res.status(404).json({- Engagement score calculation

      success: false,- Recency score calculation

      message: 'Community not found'- Source score calculation

    });- Combined score accuracy

  }- Edge cases

  

  // 3. Query posts (chronological, no time limit)**Feed Cache (15 tests):**

  const posts = await Post.find({- Cache CRUD operations

    community: communityId,- TTL behavior

    isDeleted: false- Key generation

  })- Invalidation logic

  .sort({ createdAt: -1 })

  .skip((page - 1) * limit)**Feed Controllers (57 tests):**

  .limit(parseInt(limit))- Home feed (20 tests)

  .populate('author', 'username fullName profilePicture')- Following feed (15 tests)

  .lean();- Community feed (12 tests)

  - Cache invalidation (10 tests)

  // 4. Enrich if authenticated

  let enrichedPosts = posts;### Integration Tests (30+ tests)

  if (isAuthenticated) {

    enrichedPosts = await enrichPostsWithUserData(posts, userId);**End-to-End Feed Flows:**

  }- Home feed generation and ranking

  - Following feed chronological order

  // 5. Get total count- Community feed public access

  const total = await Post.countDocuments({- Cache behavior (hit/miss)

    community: communityId,- Pagination accuracy

    isDeleted: false- User data enrichment (isLiked, isSaved)

  });- Performance benchmarks

  

  // 6. Cache and return---

  const result = {

    success: true,## Monitoring & Tuning

    data: {

      posts: enrichedPosts,### Algorithm Tuning

      pagination: {

        page: parseInt(page),**Adjustable Weights:**

        limit: parseInt(limit),```javascript

        total,const WEIGHTS = {

        pages: Math.ceil(total / limit)  engagement: 0.5,  // Can adjust between 0.3-0.7

      }  recency: 0.3,     // Can adjust between 0.2-0.4

    }  source: 0.2       // Can adjust between 0.1-0.3

  };};

  ```

  await feedCache.set(cacheKey, result, FEED_CACHE_TTL.COMMUNITY);

  return res.json(result);**Metrics to Monitor:**

}- Average feed score distribution

```- User engagement with ranked posts

- Cache hit rate (target: > 80%)

**Tests: 15+ tests**- Feed generation time (target: < 2s)

- Public access works (no auth)

- Authenticated access includes flags (isLiked, isSaved)### Cache Monitoring

- Chronological order (newest first)

- All posts (no time limit)- Cache hit/miss ratio

- Pagination works- Memory usage (node-cache) or Redis memory

- 404 if community not found- TTL effectiveness

- Cache working (5 minutes)- Invalidation frequency

- Separate caches for auth/unauth users

---

---

## Success Criteria

### Phase 6: Cache Invalidation (1 day)

- [ ] All 9 tasks completed (T043-T051)

**T049: Implement Cache Invalidation Logic** (1 day)- [ ] All 97+ unit tests passing

- File: `/server/utils/cacheInvalidation.js`- [ ] All 30+ integration tests passing

- Hook into existing controllers- [ ] Home feed ranks posts algorithmically

- [ ] Following feed is strictly chronological

**Invalidation Rules:**- [ ] Community feed accessible to public

1. User creates post → Invalidate:- [ ] Cache hit rate > 80%

   - Followers' home feeds- [ ] Cached feed < 50ms response time

   - Followers' following feeds- [ ] Uncached feed < 2s response time

   - Trending feed (global)- [ ] Cache invalidation working correctly

2. User creates community post → Invalidate:- [ ] Algorithm produces sensible rankings

   - Community feed- [ ] API documentation complete

   - Trending feed (global)- [ ] Manual testing successful

   - Members' home feeds

   - Members' following feeds---

3. Post deleted → Invalidate relevant feeds

## Future Enhancements (Post-MVP)

**Implementation:**

```javascript- [ ] Personalized weight adjustment per user

// In createPostController.js- [ ] Trending topics detection

await post.save();- [ ] Content filtering by tags/interests

- [ ] Collaborative filtering (similar users)

// Invalidate caches- [ ] Real-time feed updates (WebSocket)

if (post.community) {- [ ] Feed quality metrics and A/B testing

  // Community post- [ ] Machine learning recommendations

  await invalidateCommunityFeed(post.community);- [ ] Infinite scroll optimization

  await invalidateTrendingFeed();

  // Optional: invalidate community members' home/following feeds---

} else {

  // Personal post## Dependencies

  await invalidateFollowerFeeds(req.user._id);

  await invalidateTrendingFeed();**Epic 1**: Authentication (checkAuth, optionalAuth)  

}**Epic 2**: Social Features (follows, connections)  

```**Epic 3**: Posts & Comments (post data, engagement counts)  

**Epic 6**: Communities (community posts, enrollments)

**Functions:**

```javascript**NPM Packages:**

async function invalidateFollowerFeeds(userId) {- `node-cache` (^5.1.2) - In-memory caching

  const followers = await Connection.find({ - OR `redis` (^4.6.0) - Production caching (optional)

    following: userId,

    status: 'following'---

  }).select('follower');

  **Epic Owner**: TBD  

  for (const follower of followers) {**Review Date**: December 28, 2025  

    // Invalidate home feed**Status**: Not Started

    await feedCache.deletePattern(`feed:home:${follower.follower}:*`);
    // Invalidate following feed
    await feedCache.deletePattern(`feed:following:${follower.follower}:*`);
  }
}

async function invalidateCommunityFeed(communityId) {
  await feedCache.deletePattern(`feed:community:${communityId}:*`);
}

async function invalidateTrendingFeed() {
  await feedCache.deletePattern(`feed:trending:*`);
}
```

**Tests: 15+ tests**
- Creating post invalidates followers' home feeds
- Creating post invalidates followers' following feeds
- Creating post invalidates trending feed
- Community post invalidates community feed
- Community post invalidates trending feed
- Deleting post invalidates feeds
- Invalidation doesn't affect other users
- Pattern-based cache deletion works

---

### Phase 7: Routes & Integration (3 days)

**T050: Create Feed Routes** (0.5 days)
- File: `/server/routes/feedRoutes.js`
- Routes:
  - `GET /feed/home` → getHomeFeed (optionalAuth)
  - `GET /feed/following` → getFollowingFeed (checkAuth - REQUIRED)
  - `GET /feed/trending` → getTrendingFeed (optionalAuth)
- Community feed route in communityRoutes:
  - `GET /communities/:id/feed` → getCommunityFeed (optionalAuth)

**Implementation:**
```javascript
const express = require('express');
const router = express.Router();
const { checkAuth, optionalAuth } = require('../middlewares/checkAuth');
const getHomeFeed = require('../controllers/feed/getHomeFeedController');
const getFollowingFeed = require('../controllers/feed/getFollowingFeedController');
const getTrendingFeed = require('../controllers/feed/getTrendingFeedController');

// Home feed (optional auth)
router.get('/home', optionalAuth, getHomeFeed);

// Following feed (auth required)
router.get('/following', checkAuth, getFollowingFeed);

// Trending feed (optional auth)
router.get('/trending', optionalAuth, getTrendingFeed);

module.exports = router;
```

**T051: Create Feed Integration Tests** (2 days)
- File: `/server/spec/integration/feed.integration.spec.js`
- Tests: 40+ end-to-end tests

**Test Scenarios:**
- **Home Feed (10 tests)**:
  - Authenticated: returns algorithmic feed from follows + communities
  - Unauthenticated: returns featured tag posts
  - Algorithmic ranking correct for authenticated users
  - Cache hit returns same data
  - Pagination works for both auth states
  - Only posts from last 7 days
  
- **Following Feed (10 tests)**:
  - Authentication required (401 without token)
  - Returns posts from both followed users AND communities
  - Strictly chronological order
  - Only posts from last 30 days
  - Cache hit returns same data
  - Pagination works
  
- **Trending Feed (10 tests)**:
  - Public access works
  - Authenticated access includes user flags
  - Global scope (all posts)
  - Algorithmic ranking with trending weights
  - Only posts from last 2 days
  - High engagement posts rank higher
  - Cache works for both auth states
  
- **Community Feed (10 tests)**:
  - Public access works
  - Authenticated access includes flags
  - Chronological order
  - All posts (no time limit)
  - 404 if community not found
  - Cache works

- **Performance tests**: All feeds < 2s uncached, < 50ms cached

**T052: Update API Documentation** (0.5 days)
- File: `/server/docs/feed.yaml`
- Document all 4 feed endpoints
- Explain ranking algorithms
- Document auth requirements
- Query parameters (page, limit)
- Response schemas

**Sample Documentation:**
```yaml
/feed/home:
  get:
    summary: Get home feed
    description: |
      Returns personalized feed for authenticated users (followed users + joined communities)
      or featured content for unauthenticated users (tag-based).
      
      **Authenticated**: Algorithmic ranking (engagement 0.5, recency 0.3, source 0.2)
      **Unauthenticated**: Featured tags from FEATURED_TAGS constant
      
      Time window: 7 days
      Cache TTL: 5 minutes
    security:
      - bearerAuth: []  # Optional
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
          maximum: 100
    responses:
      200:
        description: Feed retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                data:
                  type: object
                  properties:
                    posts:
                      type: array
                      items:
                        $ref: '#/components/schemas/Post'
                    pagination:
                      $ref: '#/components/schemas/Pagination'
```

---

## API Endpoints

### Get Home Feed

```http
GET /feed/home?page=1&limit=20
Authorization: Bearer <token> (optional)

Response 200:
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "...",
        "content": "...",
        "author": { ... },
        "feedScore": 68.5,
        "isLiked": false,      // Only if authenticated
        "isSaved": true,       // Only if authenticated
        "likesCount": 10,
        "commentsCount": 5,
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
Authorization: Bearer <token> (REQUIRED)

Response 200:
{
  "success": true,
  "data": {
    "posts": [ ... ],
    "pagination": { ... }
  }
}

Response 401 (if not authenticated):
{
  "success": false,
  "message": "Authentication required"
}
```

### Get Trending Feed

```http
GET /feed/trending?page=1&limit=20
Authorization: Bearer <token> (optional)

Response 200:
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "...",
        "content": "...",
        "feedScore": 82.4,
        "likesCount": 150,
        "commentsCount": 45,
        "createdAt": "..."
      }
    ],
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

Response 404:
{
  "success": false,
  "message": "Community not found"
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
{ tags: 1, createdAt: -1 }  // For featured tags
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
- Cache heavily accessed queries

### Expected Performance

- **Cached feed**: < 50ms
- **Uncached home feed (< 1000 posts)**: < 2 seconds
- **Uncached trending feed (< 5000 posts)**: < 3 seconds
- **Uncached following feed**: < 1 second
- **Cache invalidation**: < 100ms

---

## Testing Strategy

### Unit Tests (120+ tests)

**Feed Algorithm (30 tests):**
- Engagement score calculation
- Recency score calculation
- Source score calculation
- Combined score accuracy (home)
- Combined score accuracy (trending)
- Edge cases
- Weight application from constants

**Feed Cache (20 tests):**
- Cache CRUD operations
- TTL behavior from constants
- Key generation with auth states
- Invalidation logic
- Pattern-based deletion

**Feed Controllers (70 tests):**
- Home feed (25 tests): auth/unauth behavior
- Following feed (20 tests): auth required, chronological
- Trending feed (20 tests): global scope, algorithm
- Community feed (15 tests): public access

### Integration Tests (40+ tests)

**End-to-End Feed Flows:**
- Home feed: authenticated vs unauthenticated
- Following feed: auth required, users + communities
- Trending feed: global, algorithmic
- Community feed: public, chronological
- Cache behavior (hit/miss) for all feeds
- Pagination accuracy
- User data enrichment (isLiked, isSaved)
- Performance benchmarks

---

## Monitoring & Tuning

### Algorithm Tuning

**Adjustable in constants.js:**
```javascript
// Adjust feed time windows
TRENDING_FEED_DAYS = 2;  // Can change to 1-7
HOME_FEED_DAYS = 7;       // Can change to 3-30
FOLLOWING_FEED_DAYS = 30; // Can change to 7-90

// Adjust featured tags
FEATURED_TAGS = ['tag1', 'tag2', ...];

// Adjust algorithm weights
FEED_WEIGHTS.HOME.engagement = 0.5;  // 0.3-0.7
FEED_WEIGHTS.HOME.recency = 0.3;     // 0.2-0.4
FEED_WEIGHTS.HOME.source = 0.2;      // 0.1-0.3

FEED_WEIGHTS.TRENDING.engagement = 0.6;  // 0.4-0.8
FEED_WEIGHTS.TRENDING.recency = 0.4;     // 0.2-0.6

// Adjust cache TTL
FEED_CACHE_TTL.HOME = 300;       // 60-600 seconds
FEED_CACHE_TTL.FOLLOWING = 60;   // 30-300 seconds
FEED_CACHE_TTL.TRENDING = 300;   // 60-600 seconds
FEED_CACHE_TTL.COMMUNITY = 300;  // 60-600 seconds
```

**Metrics to Monitor:**
- Average feed score distribution
- User engagement with ranked posts
- Cache hit rate (target: > 80%)
- Feed generation time (target: < 2s)
- Featured tag coverage for unauth users

### Cache Monitoring

- Cache hit/miss ratio per feed type
- Memory usage (node-cache) or Redis memory
- TTL effectiveness
- Invalidation frequency
- Separate cache performance for auth/unauth

---

## Success Criteria

- [ ] All 10 tasks completed (T043-T052)
- [ ] All 120+ unit tests passing
- [ ] All 40+ integration tests passing
- [ ] Home feed works for both auth states
- [ ] Following feed requires auth, includes users + communities
- [ ] Trending feed global scope, 2-day window
- [ ] Community feed public, chronological
- [ ] Cache hit rate > 80% for all feeds
- [ ] Cached feed < 50ms response time
- [ ] Uncached feed < 2s response time
- [ ] Cache invalidation working correctly
- [ ] Algorithm produces sensible rankings
- [ ] Constants configurable and documented
- [ ] API documentation complete
- [ ] Manual testing successful

---

## Future Enhancements (Post-MVP)

- [ ] Personalized weight adjustment per user
- [ ] Trending topics detection
- [ ] Content filtering by multiple tags/interests
- [ ] Collaborative filtering (similar users)
- [ ] Real-time feed updates (WebSocket)
- [ ] Feed quality metrics and A/B testing
- [ ] Machine learning recommendations
- [ ] Infinite scroll optimization
- [ ] User-specific featured tags
- [ ] Trending velocity calculation (growth rate)

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
