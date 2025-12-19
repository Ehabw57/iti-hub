# Feed Algorithm Integration Audit

Scope
- Source: `docs/Feed-Algorithm-Specification.md` (canonical) — create a concrete integration plan for the backend.
- Assumption: repository currently has no feed implementation (per your note). This audit proposes the smallest safe implementation that matches the spec and is easy to iterate on.

Goals
- Implement Home / Following / Community feeds per spec.
- Keep design simple and maintainable (no ML). Use server-side scoring for Home feed and chronological queries for Following/Community feeds.
- Optimize for read performance using indexes, lean queries, batching, and caching (Redis recommended).

Contract (short)
- Inputs: authenticated userId, optional page/limit (default: page=1, limit=20)
- Outputs: paginated list of posts with minimal fields (content, images, author summary, community summary, isLiked, isSaved) and pagination metadata
- Error modes: invalid pagination (400), DB/cache errors (500)

Edge cases considered
- No followers / no communities -> Home feed falls back to follow-sources only
- Posts with zero engagement -> still scored via recency
- Heavy follower fan-out (user with many followers) — prefer TTL cache invalidation over immediate invalidation for MVP

Data & Index requirements
1) Post counters (ensure fields exist on `Post`):
   - `likesCount: { type: Number, default: 0 }`
   - `commentsCount: { type: Number, default: 0 }`
   - `repostsCount: { type: Number, default: 0 }`
   These must be incremented/decremented atomically when likes/comments/reposts change (use $inc).

2) Required indexes (add to `server/models/Post.js`):
   - PostSchema.index({ author: 1, isDeleted: 1, createdAt: -1 });
   - PostSchema.index({ community: 1, isDeleted: 1, createdAt: -1 });
   - PostSchema.index({ createdAt: -1, isDeleted: 1 });

3) Connection / follower lookups
   - ConnectionSchema.index({ following: 1 });
   - ConnectionSchema.index({ follower: 1 });

Design choices (MVP)
- Home feed: fetch candidate posts (from followed users + joined communities) created within 7 days, compute feedScore in application memory using spec formula (engagement/recency/source), sort by score, paginate. Cache full result per user+page for 5 minutes.
- Following feed: simple DB query sorted by createdAt desc with a 30-day filter.
- Community feed: DB query by community sorted by createdAt desc.

Implementation sketch

1) New files to add (small PRs)
   - `server/services/feedService.js` — core feed generation logic
   - `server/controllers/feedController.js` — HTTP handlers (GET /api/v1/feed/home, /feed/following, /communities/:id/posts)
   - `server/routes/feedRoutes.js` — mount feed routes and protect with `authenticate`

2) feedService.getHomeFeed(userId, page, limit)

Pseudo-code (simplified):

```javascript
// 1. Fetch followed user ids and joined community ids
const followedUserIds = await Connection.find({ follower: userId }).distinct('following');
const joinedCommunityIds = await CommunityMember.find({ user: userId }).distinct('community');

// 2. Query candidate posts (last 7 days)
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const posts = await Post.find({
  $or: [ { author: { $in: followedUserIds } }, { community: { $in: joinedCommunityIds } } ],
  isDeleted: false,
  createdAt: { $gte: sevenDaysAgo }
})
.select('content images author community likesCount commentsCount repostsCount createdAt')
.populate('author', 'username fullName profile_pic')
.lean();

// 3. Compute scores in-process using spec functions (engagement/recency/source)
const scored = posts.map(p => ({ ...p, feedScore: calculateFeedScore(p, userId) }));

// 4. Sort, paginate, enrich (isLiked/isSaved) via batch queries
scored.sort((a,b) => b.feedScore - a.feedScore);
const pageSlice = scored.slice((page-1)*limit, page*limit);
const enriched = await enrichPostsWithUserData(pageSlice, userId);

// 5. Cache the result (Redis) for 300s
return { posts: enriched, pagination: { page, limit, total: scored.length } };
```

Performance considerations
- Candidate selection: fetching all posts for users with large followings can be expensive. Options:
  - Limit candidate set by querying most recent N posts per followed author (e.g., top 5 recent posts each) then score — reduces cardinality.
  - Precompute `engagementScore` as a materialized field and update asynchronously on interaction events (likes/comments) to allow sorting in DB; then sort by a combined DB-side score if desired.

Caching & invalidation (MVP)
- Use Redis with keys:
  - `feed:home:${userId}:page:${page}` (TTL 300s)
  - `feed:following:${userId}:page:${page}` (TTL 60s)
  - `feed:community:${communityId}:page:${page}` (TTL 300s)
- Invalidation strategy (MVP): rely on TTLs; only invalidate on critical events if necessary (e.g., post deleted).

Batch enrichment
- Use batch queries for likes and saves (PostLike, SavedPost) as in spec to annotate isLiked/isSaved.

Indexes & schema checklist (PR task)
1) Ensure Post schema has counters and indexes described above.
2) Ensure Connection schema has follower/following indexes.
3) Add a compound index if you later implement DB-side scoring (e.g., { engagementScore: -1, createdAt: -1 }).

Testing
- Unit tests (Jasmine):
  - `feedService.calculateEngagementScore()` behavior (edge cases: zero interactions, high interactions)
  - `feedService.calculateRecencyScore()` tiers (boundary hours)
  - `feedService.calculateSourceScore()` for different source combinations
- Integration tests (Supertest + Jasmine):
  - GET `/api/v1/feed/home` returns paginated results for user with follows and communities
  - GET `/api/v1/feed/following` returns chronological results and respects 30-day window
  - GET `/api/v1/communities/:id/posts` returns community posts

Acceptance criteria
- Home feed returns relevant posts (from followed users or joined communities), sorted by score, within 7 days.
- Following feed is strictly chronological and limited to 30 days.
- Community feed is chronological and public.
- Caching reduces repeated DB load (observe cache hits)

Small incremental PR plan
- PR 1 (Schema): Add counters and indexes to `Post` and `Connection` models; include migration script to populate counts from existing data (use aggregation to compute likes/comments/reposts per post).
- PR 2 (Service skeleton): Add `server/services/feedService.js` with scoring functions and a simple in-memory (NodeCache) cache implementation for local testing.
- PR 3 (Controller & routes): Add `server/controllers/feedController.js` and `server/routes/feedRoutes.js`, wire routes in `server/app.js`, protect with `authenticate`.
- PR 4 (Caching/Redis): Replace NodeCache with Redis-backed caching and add simple metrics/logging.
- PR 5 (Optimization): Replace naive candidate fetch with limited-per-author recent posts approach or add background job to maintain materialized `engagementScore`.

Notes and tradeoffs
- Simpler approach (score in app memory) is easy to implement and debug but can be slow for users following many accounts. For most MVP users this will be fine.
- Precomputing scores and materializing engagement will be needed at scale. I recommend implementing that once you hit performance limits.