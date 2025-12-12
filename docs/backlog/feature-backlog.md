# Feature Backlog (epics → stories)

This backlog converts the specs into prioritized epics and stories with rough effort estimates (S/M/L). Use this as a starter for ticket creation.

Legend
- Priority: P0 (must have for MVP), P1 (important), P2 (nice-to-have)
- Estimate: S (1-2 days), M (3-7 days), L (>1 week)

## Epic: Authentication & Authorization (P0)
- Story: Implement registration endpoint (`POST /auth/register`) — Validate inputs, hash passwords with bcrypt, return created user (S)
- Story: Implement login endpoint (`POST /auth/login`) — Verify password, generate JWT (7d expiry) (S)
- Story: Implement password-reset flow (request + confirm) with hashed tokens (M)
- Story: Add auth middleware (`checkAuth`, `optionalAuth`, `checkAdmin`) and tests (S)
- Story: Rate-limit auth endpoints (login attempts) (S)

## Epic: User Profiles & Social (P0)
- Story: Get user profile (`GET /users/:userId`) with optionalAuth (S)
- Story: Update own profile (`PATCH /users/me`) and validation (S)
- Story: Follow/unfollow endpoints (`POST /users/:id/follow`, `DELETE /users/:id/follow`) and connection model updates (S)
- Story: Block/unblock user endpoints and cascade rules (M)
- Story: Followers/following lists with pagination (S)

## Epic: Posts & Comments (P0)
- Story: Create post (`POST /posts`) with content/images/tags/community (M)
- Story: Get post (`GET /posts/:postId`) with optionalAuth and denormalized counts (S)
- Story: Update post (`PATCH /posts/:postId`) — content/tags only, permission checks (S)
- Story: Delete post (`DELETE /posts/:postId`) soft-delete and cascade handling (M)
- Story: Like/unlike posts (postLikes collection) (S)
- Story: Save/unsave posts (savedPosts) (S)
- Story: Repost endpoint (S)
- Story: Comments CRUD and replies (single-level) (M)

## Epic: File Upload & Media (P0)
- Story: Upload endpoint (`POST /upload/image`) using `multer` or Cloudinary storage (M)
- Story: Enforce file-type and size limits (profile 2MB, others 5MB) and return URLs (S)
- Story: Image processing pipeline (thumbnail generation) (M)
- Story: Integration tests for uploads (S)

## Epic: Feed & Discovery (P0)
- Story: Following feed (chronological) `GET /feed/following` (S)
- Story: Home feed (algorithmic) `GET /feed/home` with scoring (engagement, recency, source) and pagination (M)
- Story: Implement caching for feeds (basic in-memory, pluggable Redis) (M)
- Story: Enrich posts with user-specific flags (isLiked, isSaved) efficiently (M)

## Epic: Communities (P1)
- Story: Community CRUD (Admin create, public GET) and membership (`POST /communities/:id/join`) (M)
- Story: Community posts listing and moderators (M)
- Story: Community members list and pagination (S)

## Epic: Messaging & Real-time (P1)
- Story: Conversations list and create conversation endpoints (S)
- Story: Send message endpoint and message model (S)
- Story: Socket.io integration: `message:new`, `notification:new`, `user:status` (M)
- Story: Message pagination and seen handling (M)

## Epic: Notifications (P1)
- Story: Create notifications on actions (like, comment, follow, repost) (M)
- Story: Get notifications, unread count, mark read endpoints (S)

## Epic: Search (P1)
- Story: Search users, posts, communities with simple filters and pagination (M)

## Epic: Admin & Moderation (P1)
- Story: Reports endpoints and admin review (`GET /admin/reports`, `PATCH /admin/reports/:id`) (M)
- Story: Admin user management (block/unblock/delete) (M)
- Story: Platform statistics endpoint `GET /admin/statistics` (S)

## Epic: Tests & CI (P0)
- Story: Add Jasmine + Supertest integration tests for auth, posts, comments, upload (M)
- Story: Add unit tests for feed scoring functions (S)
- Story: Add a CI workflow (GitHub Actions) to run tests on PRs (S)

## Epic: API Docs & OpenAPI (P0)
- Story: Add Swagger UI hosted at `/api-docs` and generate from `server/docs/*.yaml` (S)
- Story: Keep OpenAPI fragments in `server/docs/` updated; add simple script to regenerate if needed (S)

## Epic: Docs, Sprint Plan & QA (P2)
- Story: Create sprint-plan with milestones and estimates (S)
- Story: Create PR checklist and manual QA playbook (S)

---

If you want I can convert each story into individual issue-format CSV rows (title, body, priority, estimate, labels) and add `docs/feature-backlog.csv` for importing into an issue tracker. I'll generate that CSV next.
