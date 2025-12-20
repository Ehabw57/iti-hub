# Task Implementation Checklist

**Project### Phase 3: User Story 1 - Registration
- [x] 🔗 **T004** - Implement Registration Controller (1.5 days) ✅
  - File: `/server/controllers/auth/registerController.js`
  - Function: `register(req, res)`
  - Tests: 13 tests passing
  - Depends on: T002

### Phase 4: User Story 2 - Login
- [x] 🔗 **T005** - Implement Login Controller (1 day) ✅
  - File: `/server/controllers/auth/loginController.js`
  - Function: `login(req, res)`
  - Tests: 8 tests passing
  - Depends on: T002, T003ocial Media Platform  
**Last Updated**: December 12, 2025

Use this checklist to track your progress through all tasks. Mark each task as you complete it.

---

## Epic 10: Admin Management (P0)

**Status**: ⬜ Not Started  
**Effort**: 8-12 days  
**File**: [epic-10-admin-management.md](./epic-10-admin-management.md)  
**Depends on**: Epic 1 complete

### Phase 1: Data & Permissions
- [ ] ⚡⚠️ **T201** - Update User Model for Verification (0.5 days)
  - File: `/server/models/User.js`
  - Add fields: `branchId` (optional), `trackId` (optional), `verificationStatus` (boolean|null)
  - `verificationStatus`: true=verified, false=not verified, null=pending

- [ ] ⚡⚠️ **T202** - Create Branch Model (0.5 days)
  - File: `/server/models/Branch.js`
  - Fields: `name` (unique, required), `description` (optional), `isDisabled` (boolean)

- [ ] ⚡⚠️ **T203** - Create Track Model (0.5 days)
  - File: `/server/models/Track.js`
  - Fields: `name` (required), `branchId` (required, immutable), `description` (optional), `isDisabled` (boolean)

- [ ] ⚡⚠️ **T204** - Create Tag Model (0.5 days)
  - File: `/server/models/Tag.js`
  - Fields: `name` (unique, required), `description` (optional), `isDisabled` (boolean)

### Phase 2: Admin Endpoints (Branches/Tracks/Tags)
- [ ] 🔗 **T205** - Admin Branches Controllers (1 day)
  - Files: `/server/controllers/admin/branches/createBranchController.js`, `updateBranchController.js`, `disableBranchController.js`
  - Endpoints: `POST /admin/branches`, `PATCH /admin/branches/:branchId`, `POST /admin/branches/:branchId/disable`

- [ ] 🔗 **T206** - Admin Tracks Controllers (1 day)
  - Files: `/server/controllers/admin/tracks/createTrackController.js`, `updateTrackController.js`, `disableTrackController.js`
  - Endpoints: `POST /admin/tracks`, `PATCH /admin/tracks/:trackId`, `POST /admin/tracks/:trackId/disable`
  - Enforce: `branchId` immutable after creation; track must belong to a valid branch
- [ ] 🔗 **T207** - Admin Tags Controllers (1 day)
  - Files: `/server/controllers/admin/tags/createTagController.js`, `updateTagController.js`, `disableTagController.js`
  - Endpoints: `POST /admin/tags`, `PATCH /admin/tags/:tagId`, `POST /admin/tags/:tagId/disable`

### Phase 3: Admin Endpoints (Editors & Users)
- [ ] 🔗 **T208** - Assign/Remove Editor Controllers (0.5 day)
   [ ] ⚡⚠️ **T202** - Create Branch Model (0.5 days)
  - Files: `/server/controllers/admin/editors/assignEditorController.js`, `removeEditorController.js`
  - Endpoints: `POST /admin/editors`, `DELETE /admin/editors/:userId`

   [ ] ⚡⚠️ **T203** - Create Round Model (0.5 days)
    - File: `/server/models/Round.js`
    - Fields: `branchId` (required), `number` (int, unique per branch), `name` (optional), `startDate`, `endDate`, `status` (enum: draft|upcoming|active|ended|disabled), `isDisabled` (derived from status)
    - Constraints: single `active` per branch; at most one `upcoming` per branch
- [ ] 🔗 **T209** - Update Admin Users List for Verification Filter (0.5 day)
   [ ] ⚡⚠️ **T204** - Create Per-Round Track Model (0.5 days)
    - File: `/server/models/Track.js`
    - Fields: `roundId` (required), `branchId` (denormalized, required), `name` (required, unique within round), `description` (optional), `isDisabled` (boolean)
  - File: `/server/controllers/admin/getUsersController.js`

### Phase 4: User Profile Flow (Branch/Track)
- [ ] 🔗 **T210** - Update Update-Profile Controller (0.75 day)
  - File: `/server/controllers/user/updateProfileController.js`

- [ ] 🔗 **T211** - Add Get Tracks by Branch (0.5 day)
  - File: `/server/controllers/track/getTracksByBranchController.js`
  - Return only non-disabled tracks for given branch

### Phase 5: Routes, Middleware, Tests, Docs
- [ ] 🔗 **T212** - Create/Update Admin Routes (0.5 day)
   [ ] 🔗 **T206** - Admin Rounds Controllers (1 day)
    - Files: `/server/controllers/admin/rounds/createRoundController.js`, `updateRoundController.js`, `startRoundController.js`, `endRoundController.js`, `disableRoundController.js`, `listBranchRoundsController.js`
    - Endpoints: `POST /admin/branches/:branchId/rounds`, `PATCH /admin/rounds/:roundId`, `POST /admin/rounds/:roundId/start`, `POST /admin/rounds/:roundId/end`, `POST /admin/rounds/:roundId/disable`, `GET /admin/branches/:branchId/rounds`
    - Enforce: single active per branch; at most one upcoming per branch
  - File: `/server/routes/adminRoutes.js`

- [ ] 🔗 **T213** - Validation & Policies (0.75 day)
  - Files: `/server/middlewares/checkAuth.js`, `/server/middlewares/validation/*.js`
  - Ensure only Admin can manage branches/tracks/tags/editors

  - Files: `/server/spec/controllers/admin/*.spec.js`, `/server/spec/controllers/user/updateProfileController.spec.js`
  - Cases: disable behavior respected; track-branch validation; verificationStatus transitions

  - File: `/docs/specs/API-Specification.md`
  - Confirm admin endpoints and verification semantics

**Epic 10 Completion Criteria:**
- [ ] Tracks: create/update/disable working; branchId immutable
    - Accept `branchId`, `roundId`, `trackId`; set `verificationStatus` to null; validate `roundId` belongs to `branchId` and `trackId` belongs to `roundId`
- [ ] Editors: assign/remove working
   [ ] 🔗 **T214** - Add Get Rounds by Branch (0.5 day)
    - File: `/server/controllers/round/getRoundsByBranchController.js`
    - Return public rounds for given branch (`active`, `ended`; exclude `disabled`)
- [ ] Admin Users list supports filtering by verificationStatus
   [ ] 🔗 **T215** - Add Get Tracks by Round (0.5 day)
    - File: `/server/controllers/track/getTracksByRoundController.js`
    - Return only non-disabled tracks for given round
- [ ] Routes protected by admin-only checks
- [ ] API documentation updated
## Legend

- ⬜ Not Started
- ✅ Complete
- ⚠️ Blocking (must complete before others can start)
- 🔗 Has Dependencies

---


**Status**: ✅ Complete  
**Effort**: 7-10 days  
**File**: [epic-01-authentication.md](./epic-01-authentication.md)  
  - Tests: 10 unit tests passing in `/server/spec/models/userModel.spec.js`

- [x] ⚡⚠️ **T003** - Create Authentication Middleware (1 day) ✅
  - File: `/server/middlewares/checkAuth.js`
  - Functions: `checkAuth()`, `optionalAuth()`, `authorize(...roles)`
  - Tests: 15 tests passing in `/server/spec/middlewares/checkAuth.spec.js`
  - Role-based access control with flexible multi-role support

### Phase 3: User Story 1 - Registration
- [x] 🔗 **T004** - Implement Registration Controller (1.5 days) ✅
  - File: `/server/controllers/auth/registerController.js`
  - Function: `register(req, res)`
  - Tests: 13 tests passing
  - Depends on: T002

### Phase 4: User Story 2 - Login
- [x] 🔗 **T005** - Implement Login Controller (1 day) ✅
  - File: `/server/controllers/auth/loginController.js`
  - Function: `login(req, res)`
  - Tests: 8 tests passing
  - Depends on: T002, T003

### Phase 5: User Story 3 - Password Reset
- [x] 🔗 **T006** - Implement Password Reset Request Controller (1 day) ✅
  - File: `/server/controllers/auth/passwordResetController.js`
  - Function: `requestPasswordReset(req, res)`
  - Tests: 6 tests passing
  - Depends on: T002

- [x] 🔗 **T007** - Implement Password Reset Confirm Controller (1 day) ✅
  - File: `/server/controllers/auth/passwordResetController.js`
  - Function: `confirmPasswordReset(req, res)`
  - Tests: 8 tests passing
  - Depends on: T002, T006

### Phase 6: Routes & Rate Limiting
- [x] 🔗 **T008** - Create/Update Authentication Routes (0.5 days) ✅
  - File: `/server/routes/authRoutes.js`
  - Routes: POST /register, /login, /password-reset/request, /password-reset/confirm
  - Tests: 8 tests passing in `/server/spec/routes/authRoutes.spec.js`
  - Rate limiting: 5/hr registration, 10/15min login, 3/hr password reset
  - Depends on: T004, T005, T006, T007

### Phase 7: Integration
- [x] 🔗 **T009** - Create Authentication Integration Tests (1 day) ✅
  - File: `/server/spec/integration/auth.integration.spec.js`
  - Tests: 11 integration tests passing (78 total specs)
  - Depends on: T004-T008
  - **Note**: Registration now returns token for auto-login feature

- [x] ⚡🔗 **T010** - Update API Documentation for Authentication (0.5 days) ✅
  - File: `/server/docs/auth.yaml`
  - Complete OpenAPI 3.0 documentation for all auth endpoints
  - Integrated into `/server/docs/index.js`
  - Depends on: T008

**Epic 1 Completion Criteria:**
- [x] All 10 tasks completed ✅
- [x] All unit tests passing (78 specs total) ✅
- [x] All integration tests passing ✅
- [x] API documentation complete ✅
- [x] Rate limiting verified ✅
- [x] Manual testing successful ✅

---

## Epic 2: User Profiles & Social Features (P0)

**Status**: ✅ Complete  
**Completion Date**: December 13, 2025
**Effort**: 10-12 days  
**File**: [epic-02-user-profiles.md](./epic-02-user-profiles.md)  
**Depends on**: Epic 1 complete

### Phase 1: Setup
- [x] ⚡⚠️ **T011** - Create/Update Connection Model (0.5 days) ✅
  - File: `/server/models/Connection.js`
  - Functions: `createFollow()`, `removeFollow()`, `createBlock()`, `isFollowing()`, `isBlocking()`
  - Tests: 40+ tests in `/server/spec/models/connectionModel.spec.js`

### Phase 2: User Story 1 - View Profile
- [x] 🔗 **T012** - Implement Get User Profile Controller (1.5 days) ✅
  - File: `/server/controllers/userController.js`
  - Function: `getUserProfile(req, res)`
  - Tests: 10+ tests
  - Depends on: Epic 1, T011

### Phase 3: User Story 2 - Update Profile
- [x] 🔗 **T013** - Implement Update Profile Controller (1 day) ✅
  - File: `/server/controllers/userController.js`
  - Function: `updateProfile(req, res)`
  - Tests: 15+ tests
  - Depends on: Epic 1

### Phase 4: User Story 3 - Follow/Unfollow
- [x] 🔗 **T014** - Implement Follow User Controller (1.5 days) ✅
  - File: `/server/controllers/connectionController.js`
  - Function: `followUser(req, res)`
  - Tests: 10+ tests
  - Depends on: T011, Epic 1

- [x] 🔗 **T015** - Implement Unfollow User Controller (covered in T014) ✅
  - Function: `unfollowUser(req, res)`

### Phase 5: User Story 4 - View Lists
- [x] 🔗 **T016** - Implement Get Followers Controller (1 day) ✅
  - File: `/server/controllers/userController.js`
  - Function: `getFollowers(req, res)`
  - Tests: 8+ tests
  - Depends on: T011, Epic 1

- [x] 🔗 **T017** - Implement Get Following Controller (1 day) ✅
  - File: `/server/controllers/userController.js`
  - Function: `getFollowing(req, res)`
  - Tests: 8+ tests
  - Depends on: T011, Epic 1

### Phase 6: User Story 5 - Block/Unblock
- [x] 🔗 **T018** - Implement Block/Unblock Controllers (1.5 days) ✅
  - File: `/server/controllers/connectionController.js`
  - Functions: `blockUser(req, res)`, `unblockUser(req, res)`
  - Tests: 12+ tests
  - Depends on: T011, Epic 1

### Phase 7: Routes & Integration
- [x] 🔗 **T019** - Create/Update User and Connection Routes (0.5 days) ✅
  - Files: `/server/routes/userRoutes.js`, `/server/routes/connectionRoutes.js`
  - Depends on: T012-T018

- [x] 🔗 **T020** - Create User Profile Integration Tests (1 day) ✅
  - File: `/server/spec/integration/userProfile.integration.spec.js`
  - Depends on: T012-T019

**Epic 2 Completion Criteria:**
- [x] All 10 tasks completed ✅
- [x] All unit tests passing (100+ tests) ✅
- [x] All integration tests passing ✅
- [x] Connection counts stay consistent ✅
- [x] Privacy and blocking logic works ✅
- [x] Manual testing successful ✅

---

## Epic 3: Posts & Comments System (P0)

**Status**: ✅ Complete  
**Completion Date**: December 14, 2025  
**Effort**: 12-15 days  
**File**: [epic-03-posts-comments.md](./epic-03-posts-comments.md)  
**Depends on**: Epic 1, Epic 2 complete

### Phase 1: Models
- [x] ⚡⚠️ **T021** - Create Post Model (1 day) ✅
  - File: `/server/models/Post.js`
  - Functions: `canEdit()`, `softDelete()`, `findVisiblePosts()`
  - Tests: 32+ tests passing in `/server/spec/models/postModel.spec.js`

- [x] ⚡⚠️ **T022** - Create PostLike Model (0.5 days) ✅
  - File: `/server/models/PostLike.js`
  - Tests: 10+ tests passing

- [x] ⚡⚠️ **T023** - Create Comment Model (1 day) ✅
  - File: `/server/models/Comment.js`
  - Tests: 17+ tests passing in `/server/spec/models/commentModel.spec.js`

### Phase 2: User Story 1 - Create/View Posts
- [x] 🔗 **T024** - Implement Create Post Controller (2 days) ✅
  - File: `/server/controllers/post/createPostController.js`
  - Function: `createPost(req, res)`
  - Tests: 9 tests passing in `/server/spec/controllers/post/createPostController.spec.js`
  - Depends on: T021, Epic 1

- [x] 🔗 **T025** - Implement Get Post Controllers (1.5 days) ✅
  - Files: `/server/controllers/post/getPostController.js`, `getUserPostsController.js`, `getSavedPostsController.js`
  - Functions: `getPost(req, res)`, `getUserPosts(req, res)`, `getSavedPosts(req, res)`
  - Tests: 15+ tests passing
  - Depends on: T021, T022, Epic 1

### Phase 3: User Story 2 - Update/Delete
- [x] 🔗 **T026** - Implement Update Post Controller (1 day) ✅
  - File: `/server/controllers/post/updatePostController.js`
  - Function: `updatePost(req, res)`
  - Tests: 10 tests passing
  - Depends on: T021, Epic 1

- [x] 🔗 **T027** - Implement Delete Post Controller (1 day) ✅
  - File: `/server/controllers/post/deletePostController.js`
  - Function: `deletePost(req, res)`
  - Tests: 7 tests passing
  - Depends on: T021, Epic 1

### Phase 4: User Story 3 - Like/Save/Repost
- [x] 🔗 **T028** - Implement Like/Unlike Post Controllers (1 day) ✅
  - File: `/server/controllers/post/likePostController.js`
  - Functions: `likePost(req, res)`, `unlikePost(req, res)`
  - Tests: 11 tests passing
  - Depends on: T022, Epic 1

- [x] 🔗 **T028b** - Implement Save/Unsave Post Controllers (1 day) ✅
  - File: `/server/controllers/post/savePostController.js`
  - Functions: `savePost(req, res)`, `unsavePost(req, res)`
  - Tests: 11 tests passing
  - Depends on: T021, Epic 1

- [x] 🔗 **T028c** - Implement Repost Controller (1 day) ✅
  - File: `/server/controllers/post/repostController.js`
  - Function: `repost(req, res)`
  - Tests: 10 tests passing
  - Depends on: T021, Epic 1

### Phase 5: User Story 4 - Comments
- [x] 🔗 **T029** - Implement Create Comment Controller (1.5 days) ✅
  - File: `/server/controllers/comment/createCommentController.js`
  - Function: `createComment(req, res)`
  - Tests: 8 tests passing
  - Depends on: T023, Epic 1

- [x] 🔗 **T030** - Implement Get Comments Controller (1.5 days) ✅
  - File: `/server/controllers/comment/getCommentsController.js`
  - Function: `getComments(req, res)`
  - Tests: 8 tests passing
  - Depends on: T023, Epic 1

- [x] 🔗 **T030b** - Implement Update Comment Controller (1 day) ✅
  - File: `/server/controllers/comment/updateCommentController.js`
  - Function: `updateComment(req, res)`
  - Tests: 7 tests passing
  - Depends on: T023, Epic 1

- [x] 🔗 **T030c** - Implement Delete Comment Controller (1 day) ✅
  - File: `/server/controllers/comment/deleteCommentController.js`
  - Function: `deleteComment(req, res)`
  - Tests: 6 tests passing (cascading deletes)
  - Depends on: T023, Epic 1

- [x] 🔗 **T030d** - Implement Like/Unlike Comment Controllers (1 day) ✅
  - File: `/server/controllers/comment/likeCommentController.js`
  - Functions: `likeComment(req, res)`, `unlikeComment(req, res)`
  - Tests: 10 tests passing
  - Depends on: T023, Epic 1

### Phase 6: Routes & Integration
- [x] 🔗 **T031** - Create Post and Comment Routes (0.5 days) ✅
  - Files: `/server/routes/postRoutes.js`, `/server/routes/commentRoutes.js`
  - Routes: All CRUD operations, like/unlike, save/unsave, repost, comments
  - Depends on: T024-T030d

- [x] 🔗 **T032** - Create Post and Comment Integration Tests (2 days) ✅
  - Files: `/server/spec/integration/comment.integration.spec.js`
  - Tests: 31 integration tests passing
  - Depends on: All controllers

- [x] ⚡🔗 **T033** - Update API Documentation for Posts and Comments (0.5 days) ✅
  - Files: `/server/docs/post.yaml`, `/server/docs/comment.yaml`
  - Complete OpenAPI 3.0 documentation for all endpoints
  - Integrated into `/server/docs/index.js`
  - Depends on: T031

**Epic 3 Completion Criteria:**
- [x] All 16 tasks completed ✅
- [x] All unit tests passing (96 post tests + 37 comment tests = 133 tests) ✅
- [x] All integration tests passing (31 comment integration tests) ✅
- [x] One-level comment replies working ✅
- [x] Denormalized counts accurate (likesCount, commentsCount, repliesCount) ✅
- [x] Cascading deletes working correctly ✅
- [x] API documentation complete ✅
- [x] Manual testing successful ✅

---

## Epic 4: File Upload & Media (P0)

**Status**: ✅ Complete  
**Completion Date**: December 15, 2025  
**Effort**: 5-7 days  
**File**: [epic-04-file-upload.md](./epic-04-file-upload.md)  
**Depends on**: Epic 1

### Phase 1: Setup & Configuration
- [x] ⚡⚠️ **T034** - Setup Cloudinary Integration (0.5 days) ✅
  - Install dependencies: `cloudinary`, `multer`, `file-type`
  - Configure Cloudinary credentials in `.env`
  - Create Cloudinary utility wrapper
  - File: `/server/utils/cloudinary.js`

- [x] ⚡⚠️ **T035** - Create File Validation Utilities (1 day) ✅
  - File: `/server/utils/fileValidation.js`
  - Functions: `validateFileType()`, `validateFileSize()`, `validateUploadContext()`
  - Validation rules for profile, cover, post, message images
  - Tests: 15+ tests in `/server/spec/utils/fileValidation.spec.js`

### Phase 2: Upload Middleware
- [x] 🔗 **T036** - Create Upload Middleware (1.5 days) ✅
  - File: `/server/middlewares/upload.js`
  - Setup Multer with memory storage
  - Context-aware file validation (profile, cover, post, message)
  - Error handling for invalid files
  - Tests: 12+ tests in `/server/spec/middlewares/upload.spec.js`
  - Depends on: T034, T035

### Phase 3: User Story 1 - Profile Picture Upload
- [x] 🔗 **T037** - Implement Profile Picture Upload Controller (1 day) ✅
  - File: `/server/controllers/user/uploadProfilePictureController.js`
  - Function: `uploadProfilePicture(req, res)`
  - Cloudinary upload with transformations (500x500, crop, optimize)
  - Update user model with new URL
  - Delete old image from Cloudinary
  - Tests: 10+ tests
  - Depends on: T034, T036, Epic 1

### Phase 4: User Story 2 - Cover Image Upload
- [x] 🔗 **T038** - Implement Cover Image Upload Controller (0.5 days) ✅
  - File: `/server/controllers/user/uploadCoverImageController.js`
  - Function: `uploadCoverImage(req, res)`
  - Cloudinary upload with transformations (1500x500, crop, optimize)
  - Update user model with new URL
  - Tests: 8+ tests
  - Depends on: T034, T036, Epic 1

### Phase 5: User Story 3 - Post Images Upload
- [x] 🔗 **T039** - Update Create Post Controller for Media (1 day) ✅
  - Update: `/server/controllers/post/createPostController.js`
  - Support multiple image uploads (max 10)
  - Cloudinary batch upload with transformations (2000x2000 max)
  - Store URLs in post media array
  - Tests: 15+ tests (including existing tests)
  - Depends on: T034, T036, Epic 3

### Phase 6: Routes & Integration
- [x] 🔗 **T040** - Create Upload Routes (0.5 days) ✅
  - Update: `/server/routes/userRoutes.js`
  - Routes: POST /users/profile/picture, POST /users/profile/cover
  - Apply upload middleware with context
  - Depends on: T037, T038

- [x] 🔗 **T041** - Create File Upload Integration Tests (1 day) ✅
  - File: `/server/spec/integration/fileUpload.integration.spec.js`
  - Tests: 20+ integration tests
  - Test all upload contexts with actual Cloudinary (or mocked)
  - Test file validation errors
  - Test image transformations
  - Depends on: T037-T040

- [x] ⚡🔗 **T042** - Update API Documentation for File Upload (0.5 days) ✅
  - File: `/server/docs/upload.yaml`
  - Document all upload endpoints with multipart/form-data
  - Example requests with file uploads
  - Error responses for validation failures
  - Integrated into `/server/docs/index.js`
  - Depends on: T040

**Epic 4 Completion Criteria:**
- [x] All 9 tasks completed ✅
- [x] All unit tests passing (60+ tests) ✅
- [x] All integration tests passing (20+ tests) ✅
- [x] Cloudinary integration working ✅
- [x] File validation preventing invalid uploads ✅
- [x] Image transformations applied correctly ✅
- [x] Old images deleted when replaced ✅
- [x] API documentation complete ✅
- [x] Manual testing with real images successful ✅

---

## Epic 5: Feed & Discovery (P0)

**Status**: ✅ Complete  
**Completion Date**: December 15, 2025  
**Effort**: 10-12 days  
**File**: [epic-05-feed-algorithm.md](./epic-05-feed-algorithm.md)  
**Depends on**: Epic 1, Epic 2, Epic 3

### Phase 1: Feed Algorithm Core
- [x] ⚡⚠️ **T043** - Create Feed Algorithm Utilities (2 days) ✅
  - File: `/server/utils/feedAlgorithm.js`
  - Functions: 
    * `calculateEngagementScore(post)`
    * `calculateRecencyScore(post)`
    * `calculateSourceScore(post, userId)`
    * `calculateFeedScore(post, userId)`
  - Shared algorithm for Home and Trending feeds
  - Weighted scoring system configurable via FEED_WEIGHTS constant
  - Tests: 30+ tests in `/server/spec/utils/feedAlgorithm.spec.js`

- [x] ⚡⚠️ **T044** - Create Feed Cache Manager (1 day) ✅
  - File: `/server/utils/feedCache.js`
  - Setup node-cache or Redis integration
  - Cache key generation with auth state: `feed:{type}:{userId|'public'}:page:{page}`
  - TTL configuration via FEED_CACHE_TTL constant
  - Support for authenticated/unauthenticated cache separation
  - Cache invalidation helpers
  - Tests: 20+ tests in `/server/spec/utils/feedCache.spec.js`

### Phase 2: User Story 1 - Home Feed (Optional Auth)
- [x] 🔗 **T045** - Implement Home Feed Controller (2.5 days) ✅
  - File: `/server/controllers/feed/getHomeFeedController.js`
  - Function: `getHomeFeed(req, res)`
  - Route: `GET /feed/home` (optionalAuth)
  - **Unauthenticated**: Show posts filtered by FEATURED_TAGS constant
  - **Authenticated**: Algorithmic ranking from followed users + joined communities
  - Time window: HOME_FEED_DAYS constant (7 days)
  - Weights: FEED_WEIGHTS.HOME (engagement 0.5, recency 0.3, source 0.2)
  - Cache TTL: FEED_CACHE_TTL.HOME (5 minutes)
  - Enrich with user interaction data (isLiked, isSaved) when authenticated
  - Tests: 25+ tests covering both auth states
  - Depends on: T043, T044, Epic 1, Epic 2, Epic 3

### Phase 3: User Story 2 - Following Feed (Auth Required)
- [x] 🔗 **T046** - Implement Following Feed Controller (1.5 days) ✅
  - File: `/server/controllers/feed/getFollowingFeedController.js`
  - Function: `getFollowingFeed(req, res)`
  - Route: `GET /feed/following` (checkAuth - REQUIRED)
  - Query: Posts from **both followed users AND joined communities**
  - Pure chronological (newest first, no algorithmic ranking)
  - Time window: FOLLOWING_FEED_DAYS constant (30 days)
  - Cache TTL: FEED_CACHE_TTL.FOLLOWING (1 minute)
  - Enrich with user interaction data
  - Tests: 20+ tests
  - Depends on: T044, Epic 1, Epic 2, Epic 3

### Phase 4: User Story 3 - Trending Feed (Optional Auth)
- [x] 🔗 **T047** - Implement Trending Feed Controller (2 days) ✅
  - File: `/server/controllers/feed/getTrendingFeedController.js`
  - Function: `getTrendingFeed(req, res)`
  - Route: `GET /feed/trending` (optionalAuth)
  - **Global scope**: All public posts from everyone
  - Algorithmic ranking using same calculation as Home feed
  - Weights: FEED_WEIGHTS.TRENDING (engagement 0.6, recency 0.4)
  - Time window: TRENDING_FEED_DAYS constant (2 days)
  - Cache TTL: FEED_CACHE_TTL.TRENDING (5 minutes)
  - Enrich with user interaction data when authenticated
  - Tests: 20+ tests covering both auth states
  - Depends on: T043, T044, Epic 3

### Phase 5: User Story 4 - Community Feed (Optional Auth)
- [x] 🔗 **T048** - Implement Community Feed Controller (1 day) ✅
  - File: `/server/controllers/community/getCommunityFeedController.js`
  - Function: `getCommunityFeed(req, res)`
  - Route: `GET /communities/:id/feed` (optionalAuth)
  - Query: All posts in specific community (chronological, no time limit)
  - Public access (no auth required)
  - Enrich with user interaction data if authenticated
  - Cache TTL: FEED_CACHE_TTL.COMMUNITY (5 minutes)
  - Tests: 15+ tests
  - Depends on: T044, Epic 3, Epic 6

### Phase 6: Cache Invalidation
- [x] 🔗 **T049** - Implement Cache Invalidation Logic (1 day) ✅
  - File: `/server/utils/cacheInvalidation.js`
  - Update post controllers to invalidate caches
  - Invalidation rules:
    * User creates post → invalidate followers' home/following feeds + trending feed
    * User creates community post → invalidate community feed + trending feed
    * Post deleted → invalidate relevant feeds
  - Selective invalidation for performance
  - Tests: 15+ tests
  - Depends on: T044, T045-T048

### Phase 7: Routes & Integration
- [x] 🔗 **T050** - Create Feed Routes (0.5 days) ✅
  - File: `/server/routes/feedRoutes.js`
  - Routes:
    * `GET /feed/home` (optionalAuth)
    * `GET /feed/following` (checkAuth - REQUIRED)
    * `GET /feed/trending` (optionalAuth)
  - Community feed route in `/server/routes/communityRoutes.js`:
    * `GET /communities/:id/feed` (optionalAuth)
  - Query params: page, limit
  - Depends on: T045-T048

- [x] 🔗 **T051** - Create Feed Integration Tests (2 days) ✅
  - File: `/server/spec/integration/feed.integration.spec.js`
  - Tests: 40+ end-to-end tests
  - Test scenarios:
    * Home feed: unauthenticated (featured tags) vs authenticated (algorithm)
    * Following feed: auth required, includes users + communities
    * Trending feed: global scope, 2-day window
    * Community feed: public access, chronological
    * Cache hit/miss behavior for all feeds
    * Pagination accuracy across all feeds
    * Performance benchmarks
  - Depends on: T045-T050

- [x] ⚡🔗 **T052** - Update API Documentation for Feeds (0.5 days) ✅
  - File: `/server/docs/feed.yaml`
  - Document all 4 feed endpoints with auth requirements
  - Explain ranking algorithms (Home vs Trending)
  - Document FEATURED_TAGS behavior for unauthenticated users
  - Query parameters and pagination
  - Response schemas for all feed types
  - Integrated into `/server/docs/index.js`
  - Depends on: T050

**Epic 5 Completion Criteria:**
- [x] All 10 tasks completed (T043-T052) ✅
- [x] All unit tests passing (120+ tests) ✅
- [x] All integration tests passing (40+ tests) ✅
- [x] 4 feed types working: Home, Following, Trending, Community ✅
- [x] Home feed: featured tags for unauth, algorithm for auth ✅
- [x] Following feed: auth required, includes users + communities, chronological ✅
- [x] Trending feed: global scope, 2-day window, algorithmic ✅
- [x] Community feed: chronological, auth optional ✅
- [x] Cache working (verified hit/miss for all feed types) ✅
- [x] Cache invalidation working correctly ✅
- [x] Performance acceptable (<50ms cached, <2s uncached) ✅
- [x] API documentation complete with all 4 feeds ✅
- [x] Manual testing successful ✅

---

## Epic 6: Communities (P1)

**Status**: ✅ Complete  
**Completion Date**: December 15, 2025  
**Effort**: 7-9 days  
**File**: [epic-06-communities.md](./epic-06-communities.md)  
**Depends on**: Epic 1, Epic 2, Epic 3

### Phase 1: Models & Setup
- [x] ⚡⚠️ **T053** - Create Community Model (1 day) ✅
  - File: `/server/models/Community.js`
  - Fields: name, description, coverImage, rules, tags, membersCount, postsCount, moderators, createdBy
  - Indexes: name (unique), tags, membersCount, text search
  - Validation: name (2-100 chars, unique), description (max 1000), rules (max 5000)
  - Tests: 20+ tests in `/server/spec/models/communityModel.spec.js`

- [x] ⚡⚠️ **T054** - Create Enrollment Model (0.5 days) ✅
  - File: `/server/models/Enrollment.js`
  - Fields: user, community, role (member/moderator), joinedAt
  - Compound unique index: { user, community }
  - Query indexes for user enrollments and community members
  - Tests: 10+ tests in `/server/spec/models/enrollmentModel.spec.js`

- [x] ⚡⚠️ **T055** - Create Community Helpers (0.5 days) ✅
  - File: `/server/utils/communityHelpers.js`
  - Functions: `isMember()`, `isModerator()`, `canModerate()`, `validateCommunityData()`
  - Tests: 12+ tests in `/server/spec/utils/communityHelpers.spec.js`

### Phase 2: User Story 1 - Create/View Communities
- [x] 🔗 **T056** - Implement Create Community Controller (1.5 days) ✅
  - File: `/server/controllers/community/createCommunityController.js`
  - Function: `createCommunity(req, res)`
  - Validation: name uniqueness, description required
  - Auto-enroll creator as moderator
  - Initialize counts to 0
  - Tests: 15+ tests
  - Depends on: T053, T054, Epic 1

- [x] 🔗 **T057** - Implement Get Community Controllers (1 day) ✅
  - Files: `/server/controllers/community/getCommunityController.js`, `getCommunitiesController.js`
  - Functions: `getCommunity(req, res)`, `getCommunities(req, res)`, `getUserCommunities(req, res)`
  - Include membership status (isMember, isModerator) for authenticated users
  - Pagination for list endpoints
  - Tests: 18+ tests
  - Depends on: T053, T054, Epic 1

### Phase 3: User Story 2 - Join/Leave Communities
- [x] 🔗 **T058** - Implement Join/Leave Community Controllers (1 day) ✅
  - File: `/server/controllers/community/enrollmentController.js`
  - Functions: `joinCommunity(req, res)`, `leaveCommunity(req, res)`
  - Create/delete enrollment record
  - Update community membersCount (with Math.max(0))
  - Prevent duplicate joins
  - Tests: 15+ tests
  - Depends on: T053, T054, Epic 1

### Phase 4: User Story 3 - Community Posts
- [x] 🔗 **T059** - Update Post Model for Communities (0.5 days) ✅
  - Update: `/server/models/Post.js`
  - Add `community` field (ObjectId ref, optional)
  - Add index: { community: 1, createdAt: -1 }
  - Validation: post must have author XOR community
  - Tests: Update existing tests + 5+ new tests
  - Depends on: T053, Epic 3

- [x] 🔗 **T060** - Implement Create Community Post Controller (1 day) ✅
  - Update or extend: `/server/controllers/post/createPostController.js`
  - Support communityId in request body
  - Verify user is member before allowing post
  - Increment community postsCount
  - Tests: 12+ tests
  - Depends on: T053, T054, T059, Epic 3

### Phase 5: User Story 4 - Moderation
- [x] 🔗 **T061** - Implement Update Community Controller (1 day) ✅
  - File: `/server/controllers/community/updateCommunityController.js`
  - Function: `updateCommunity(req, res)`
  - Fields: description, coverImage, rules, tags
  - Only moderators/creator can update
  - Tests: 12+ tests
  - Depends on: T053, T055, Epic 1

- [x] 🔗 **T062** - Implement Delete Community Post Controller (0.5 days) ✅
  - File: `/server/controllers/community/deletePostController.js`
  - Function: `deleteCommunityPost(req, res)`
  - Moderators can delete any post in their community
  - Decrement community postsCount
  - Tests: 10+ tests
  - Depends on: T053, T055, Epic 3

### Phase 6: Routes & Integration
- [x] 🔗 **T063** - Create Community Routes (0.5 days) ✅
  - File: `/server/routes/communityRoutes.js`
  - Routes:
    * POST /communities (checkAuth)
    * GET /communities (public)
    * GET /communities/:id (public)
    * PUT /communities/:id (checkAuth, moderator only)
    * POST /communities/:id/join (checkAuth)
    * DELETE /communities/:id/leave (checkAuth)
    * GET /communities/:id/members (public)
    * POST /communities/:id/posts (checkAuth, member only)
    * DELETE /communities/:id/posts/:postId (checkAuth, moderator only)
  - Depends on: T056-T062

- [x] 🔗 **T064** - Create Community Integration Tests (1.5 days) ✅
  - File: `/server/spec/integration/community.integration.spec.js`
  - Tests: 35+ integration tests
  - Test scenarios:
    * Community CRUD operations
    * Join/leave flow
    * Membership verification
    * Moderator permissions
    * Community posts
    * Moderation actions
  - Depends on: T056-T063

- [x] ⚡🔗 **T065** - Update API Documentation for Communities (0.5 days) ✅
  - File: `/server/docs/community.yaml`
  - Document all community endpoints
  - Member vs moderator permissions
  - Community post creation
  - Moderation endpoints
  - Integrated into `/server/docs/index.js`
  - Depends on: T063

**Epic 6 Completion Criteria:**
- [x] All 13 tasks completed (T053-T065) ✅
- [x] All unit tests passing (119+ tests) ✅
- [x] All integration tests passing (35+ tests) ✅
- [x] Communities can be created and managed ✅
- [x] Join/leave functionality working ✅
- [x] Community posts integrated with feed ✅
- [x] Moderation permissions enforced ✅
- [x] Member counts accurate ✅
- [x] API documentation complete ✅
- [x] Manual testing successful ✅

---

## Epic 7: Messaging & Real-time (P0)

**Status**: ⬜ Not Started  
**Effort**: 12-15 days  
**File**: [epic-07-messaging.md](./epic-07-messaging.md)  
**Depends on**: Epic 1, Epic 2, Epic 4

### Phase 1: Models & Setup
- [ ] ⚡⚠️ **T066** - Create Conversation Model (1 day)
  - File: `/server/models/Conversation.js`
  - Fields: type (individual/group), participants, name, image, admin, lastMessage, unreadCount
  - Indexes: participants, type, updatedAt (for sorting)
  - Compound index: { participants: 1, type: 1 } for finding conversations
  - Validation: individual (2 participants), group (3-100 participants, name required)
  - Test cases: 25+ scenarios in `/server/spec/models/conversationModel.spec.js`

- [ ] ⚡⚠️ **T067** - Create Message Model (1 day)
  - File: `/server/models/Message.js`
  - Fields: conversation, sender, content, image, status (sent/delivered/seen), seenBy
  - Indexes: { conversation: 1, createdAt: -1 }, sender
  - Validation: content (max 2000 chars, required if no image), status enum
  - Test cases: 20+ scenarios in `/server/spec/models/messageModel.spec.js`

- [ ] ⚡⚠️ **T068** - Create Message Helpers (0.5 days)
  - File: `/server/utils/messageHelpers.js`
  - Functions: `isParticipant()`, `canSendMessage()`, `formatConversation()`, `formatMessage()`
  - Test cases: 12+ scenarios in `/server/spec/utils/messageHelpers.spec.js`

### Phase 2: User Story 1 - View Conversations
- [ ] 🔗 **T069** - Implement Get Conversations Controller (1.5 days)
  - File: `/server/controllers/conversation/getConversationsController.js`
  - Function: `getConversations(req, res)`
  - Route: `GET /conversations` (checkAuth)
  - Query: All conversations where user is participant
  - Sort by updatedAt (most recent first)
  - Include: last message, unread count, participant status (online/lastSeen)
  - Pagination support
  - Test cases: 18+ scenarios
  - Depends on: T066, T067, Epic 1, Epic 2

- [ ] 🔗 **T070** - Implement Get Conversation by ID Controller (1 day)
  - File: `/server/controllers/conversation/getConversationController.js`
  - Function: `getConversation(req, res)`
  - Route: `GET /conversations/:conversationId` (checkAuth)
  - Verify user is participant
  - Include full conversation details with all participants
  - Test cases: 12+ scenarios
  - Depends on: T066, T068, Epic 1

### Phase 3: User Story 2 - Create Conversations
- [ ] 🔗 **T071** - Implement Create Individual Conversation Controller (1 day)
  - File: `/server/controllers/conversation/createConversationController.js`
  - Function: `createConversation(req, res)`
  - Route: `POST /conversations` (checkAuth)
  - Check if conversation already exists (same 2 participants)
  - Return existing or create new conversation
  - Prevent blocked users from creating conversations
  - Test cases: 15+ scenarios
  - Depends on: T066, T068, Epic 1, Epic 2

- [ ] 🔗 **T072** - Implement Create Group Conversation Controller (1.5 days)
  - File: `/server/controllers/conversation/createGroupConversationController.js`
  - Function: `createGroupConversation(req, res)`
  - Route: `POST /conversations/group` (checkAuth)
  - Validate: name required, 3-100 total participants (including creator)
  - Set creator as admin
  - Sort participants array for consistent querying
  - Test cases: 18+ scenarios
  - Depends on: T066, T068, Epic 1

### Phase 4: User Story 3 - Send/View Messages
- [ ] 🔗 **T073** - Implement Get Messages Controller (1.5 days)
  - File: `/server/controllers/message/getMessagesController.js`
  - Function: `getMessages(req, res)`
  - Route: `GET /conversations/:conversationId/messages` (checkAuth)
  - Query param: `before` (timestamp) for loading older messages
  - Verify user is participant
  - Load messages in reverse chronological order (newest first)
  - Pagination support (20 messages per page)
  - Include sender details and seen status
  - Test cases: 20+ scenarios
  - Depends on: T066, T067, T068, Epic 1

- [ ] 🔗 **T074** - Implement Send Message Controller (2 days)
  - File: `/server/controllers/message/sendMessageController.js`
  - Function: `sendMessage(req, res)`
  - Route: `POST /conversations/:conversationId/messages` (checkAuth)
  - Verify user is participant
  - Validate: content or image required (not both empty)
  - Create message with status: "sent"
  - Update conversation lastMessage and updatedAt
  - Increment unreadCount for other participants
  - Emit real-time event to participants (Socket.io)
  - Test cases: 22+ scenarios
  - Depends on: T066, T067, T068, Epic 1, T082 (WebSocket setup)

### Phase 5: User Story 4 - Group Management
- [ ] 🔗 **T075** - Implement Add/Remove Group Members Controllers (1.5 days)
  - File: `/server/controllers/conversation/groupMembersController.js`
  - Functions: `addGroupMember(req, res)`, `removeGroupMember(req, res)`
  - Routes: 
    * `POST /conversations/:conversationId/members` (checkAuth, admin only)
    * `DELETE /conversations/:conversationId/members/:userId` (checkAuth, admin only)
  - Validate: group type, max 100 members, admin permissions
  - Test cases: 20+ scenarios
  - Depends on: T066, T068, Epic 1

- [ ] 🔗 **T076** - Implement Leave Group Controller (0.5 days)
  - File: `/server/controllers/conversation/leaveGroupController.js`
  - Function: `leaveGroup(req, res)`
  - Route: `POST /conversations/:conversationId/leave` (checkAuth)
  - Remove user from participants array
  - If admin leaves and group has members, assign new admin (oldest member)
  - If last member leaves, optionally delete conversation
  - Test cases: 12+ scenarios
  - Depends on: T066, T068, Epic 1

- [ ] 🔗 **T077** - Implement Update Group Info Controller (0.5 days)
  - File: `/server/controllers/conversation/updateGroupController.js`
  - Function: `updateGroupInfo(req, res)`
  - Route: `PATCH /conversations/:conversationId` (checkAuth, admin only)
  - Fields: name, image
  - Validate: group type, admin permissions
  - Test cases: 10+ scenarios
  - Depends on: T066, T068, Epic 1

### Phase 6: User Story 5 - Message Status & Real-time
- [ ] 🔗 **T078** - Implement Mark as Seen Controller (1 day)
  - File: `/server/controllers/message/markAsSeenController.js`
  - Function: `markAsSeen(req, res)`
  - Route: `POST /conversations/:conversationId/seen` (checkAuth)
  - Update all unread messages in conversation to "seen"
  - Add userId and timestamp to seenBy array
  - Reset unreadCount for user in conversation
  - Emit real-time "seen" event to other participants
  - Test cases: 15+ scenarios
  - Depends on: T066, T067, Epic 1, T082 (WebSocket setup)

- [ ] 🔗 **T079** - Update User Last Seen (0.5 days)
  - Update: `/server/middlewares/checkAuth.js`
  - Add middleware to update user.lastSeen on authenticated requests
  - Only update every 60 seconds to avoid excessive DB writes
  - No dedicated endpoint (passive update)
  - Test cases: 8+ scenarios
  - Depends on: Epic 1

### Phase 7: WebSocket & Real-time (MVP Essential)
- [ ] ⚡⚠️ **T080** - Setup Socket.io Server (1 day)
  - File: `/server/utils/socketServer.js`
  - Setup Socket.io with authentication middleware
  - Connect to Express app
  - Handle user connections/disconnections
  - Store user socket mappings (userId -> socketId)
  - Test cases: 15+ scenarios for connection/auth
  - Depends on: Epic 1

- [ ] 🔗 **T081** - Implement Real-time Message Events (1.5 days)
  - File: `/server/utils/socketEvents.js`
  - Events to handle:
    * `message:send` - Real-time message delivery
    * `message:seen` - Seen status updates
    * `typing:start` - User starts typing
    * `typing:stop` - User stops typing
  - Emit events to specific conversation participants
  - Update online status on socket connect/disconnect
  - Test cases: 20+ scenarios for all events
  - Depends on: T080, T066, T067

### Phase 8: Routes & Integration
- [ ] 🔗 **T082** - Create Message and Conversation Routes (0.5 days)
  - Files: `/server/routes/conversationRoutes.js`, `/server/routes/messageRoutes.js`
  - Conversation routes:
    * `GET /conversations` (checkAuth)
    * `GET /conversations/:conversationId` (checkAuth)
    * `POST /conversations` (checkAuth)
    * `POST /conversations/group` (checkAuth)
    * `POST /conversations/:conversationId/members` (checkAuth)
    * `DELETE /conversations/:conversationId/members/:userId` (checkAuth)
    * `POST /conversations/:conversationId/leave` (checkAuth)
    * `PATCH /conversations/:conversationId` (checkAuth)
  - Message routes:
    * `GET /conversations/:conversationId/messages` (checkAuth)
    * `POST /conversations/:conversationId/messages` (checkAuth)
    * `POST /conversations/:conversationId/seen` (checkAuth)
  - Depends on: T069-T079

- [ ] 🔗 **T083** - Create Controller Index Files (0.25 days)
  - Files: `/server/controllers/conversation/index.js`, `/server/controllers/message/index.js`
  - Export all controller functions for clean imports
  - Depends on: T069-T079

- [ ] 🔗 **T084** - Create Messaging Integration Tests (2 days)
  - File: `/server/spec/integration/messaging.integration.spec.js`
  - Test cases: 50+ end-to-end scenarios
  - Test scenarios:
    * Individual conversations: create, find existing, send messages
    * Group conversations: create, add/remove members, admin permissions
    * Message sending and retrieval with pagination
    * Mark as seen functionality
    * Unread counts accuracy
    * Blocking prevents messaging
    * Last seen updates
    * Real-time message delivery
    * Real-time typing indicators
  - Depends on: T069-T083

- [ ] ⚡🔗 **T085** - Update API Documentation for Messaging (0.5 days)
  - Files: `/server/docs/conversation.yaml`, `/server/docs/message.yaml`
  - Document all messaging endpoints
  - Conversation types (individual vs group)
  - Message status lifecycle (sent → delivered → seen)
  - Group admin permissions
  - WebSocket events documentation
  - Integrated into `/server/docs/index.js`
  - Depends on: T082

**Epic 7 Completion Criteria:**
- [ ] All 20 tasks completed (T066-T085)
- [ ] All unit test cases passing (180+ scenarios)
- [ ] All integration test cases passing (50+ scenarios)
- [ ] Individual conversations working
- [ ] Group conversations with admin management working
- [ ] Message sending and retrieval working
- [ ] Message status (sent/delivered/seen) working
- [ ] Real-time message delivery working (Socket.io)
- [ ] Real-time typing indicators working
- [ ] Unread counts accurate
- [ ] Online/last seen status working
- [ ] Blocking prevents messaging
- [ ] API documentation complete
- [ ] Manual testing successful

---

## Epic 8: Notifications & Real-time (P0)

**Status**: ✅ Complete  
**Completion Date**: December 16, 2025  
**Effort**: 7-9 days  
**File**: [epic-08-notifications.md](./epic-08-notifications.md)  
**Depends on**: Epic 1, Epic 3, Epic 7

### Phase 1: Models & Setup
- [x] ⚡⚠️ **T086** - Create Notification Model (1 day) ✅
  - File: `/server/models/Notification.js`
  - Schema: recipient, actor, actorCount,for type, target, isRead
  - Types: "like" | "comment" | "reply" | "comment_like" | "repost" | "follow"
  - Grouping: Smart grouping for like/comment/reply/comment_like by target
  - Static Methods: `createOrUpdateNotification()`, `getUnreadCount()`, `markAsRead()`, `markAllAsRead()`, `isGroupableType()`
  - Test cases: 30+ scenarios in `/server/spec/models/notificationModel.spec.js`

### Phase 2: User Story 1 - Trigger Notifications
- [x] 🔗 **T087** - Implement Post Like Notification (0.5 days) ✅
  - File: `/server/controllers/post/likePostController.js`
  - Feature: Group likes for same post ("John and 5 others liked your post")
  - Test cases: 14+ scenarios including grouping logic
  - Depends on: T086, Epic 3

- [x] 🔗 **T088** - Implement Comment Notification (0.5 days) ✅
  - File: `/server/controllers/comment/createCommentController.js`
  - Feature: Group comments for same post ("John and 3 others commented")
  - Test cases: 14+ scenarios including grouping logic
  - Depends on: T086, Epic 3

- [x] 🔗 **T089** - Implement Reply Notification (0.5 days) ✅
  - File: `/server/controllers/comment/createCommentController.js` (when parentComment exists)
  - Feature: Group replies for same comment ("John and 2 others replied")
  - Test cases: 14+ scenarios including grouping logic
  - Depends on: T086, Epic 3

- [x] 🔗 **T089b** - Implement Comment Like Notification (0.5 days) ✅
  - File: `/server/controllers/comment/likeCommentController.js`
  - Feature: Group comment likes ("John and 4 others liked your comment")
  - Test cases: 14+ scenarios including grouping logic
  - Depends on: T086, Epic 3

- [x] 🔗 **T090** - Implement Repost Notification (0.5 days) ✅
  - File: `/server/controllers/post/repostController.js`
  - Feature: Individual notifications (NOT grouped)
  - Test cases: 9+ scenarios
  - Depends on: T086, Epic 3

- [x] 🔗 **T091** - Implement Follow Notification (0.5 days) ✅
  - File: `/server/controllers/connection/followController.js`
  - Feature: Individual notifications (NOT grouped)
  - Test cases: 9+ scenarios
  - Depends on: T086, Epic 2

### Phase 3: User Story 2 - View Notifications
- [x] 🔗 **T092** - Implement Get Notifications Controller (1.5 days) ✅
  - File: `/server/controllers/notification/getNotificationsController.js`
  - Function: `getNotifications(req, res)`
  - Features: Pagination, formatting ("John and X others"), sort by updatedAt
  - Test cases: 24+ scenarios
  - Depends on: T086, Epic 1

- [x] 🔗 **T093** - Implement Get Unread Count Controller (0.5 days) ✅
  - File: `/server/controllers/notification/getUnreadCountController.js`
  - Function: `getUnreadCount(req, res)`
  - Test cases: 5+ scenarios
  - Depends on: T086, Epic 1

### Phase 4: User Story 3 - Manage Notifications
- [x] 🔗 **T094** - Implement Mark Notification as Read Controller (0.5 days) ✅
  - File: `/server/controllers/notification/markAsReadController.js`
  - Function: `markAsRead(req, res)`
  - Test cases: 8+ scenarios
  - Depends on: T086, Epic 1, Epic 7 (T080)

- [x] 🔗 **T095** - Implement Mark All as Read Controller (0.5 days) ✅
  - File: `/server/controllers/notification/markAllAsReadController.js`
  - Function: `markAllAsRead(req, res)`
  - Test cases: 7+ scenarios
  - Depends on: T086, Epic 1, Epic 7 (T080)

### Phase 5: WebSocket & Real-time (MVP Essential)
- [x] ⚡⚠️ **T096** - Implement Real-time Notification Events (1 day) ✅
  - File: `/server/utils/notificationEvents.js`
  - Events: `notification:new`, `notification:update`, `notification:read`, `notification:count`
  - Features: Multi-device sync, grouped notification updates
  - Test cases: 27+ scenarios
  - Depends on: T086, Epic 7 (T080 - Socket.io setup)

### Phase 6: Routes & Integration
- [x] 🔗 **T097** - Create Notification Routes (0.5 days) ✅
  - File: `/server/routes/notificationRoutes.js`
  - Routes: GET /notifications, GET /notifications/unread, POST /notifications/:id/read, POST /notifications/read-all
  - Depends on: T092-T095

- [x] 🔗 **T098** - Create Notification Integration Tests (1.5 days) ✅
  - File: `/server/spec/integration/notifications.integration.spec.js`
  - Test cases: 50+ integration scenarios including grouping
  - Depends on: T086-T097

- [x] ⚡🔗 **T099** - Update API Documentation for Notifications (0.5 days) ✅
  - File: `/server/docs/notification.yaml`
  - Content: All endpoints, WebSocket events, grouping behavior, examples
  - Depends on: T097

- [x] 🔗 **T100** - Create Controller Index File (0.25 days) ✅
  - File: `/server/controllers/notification/index.js`
  - Depends on: T092-T095

**Epic 8 Completion Criteria:**
- [x] All 14 tasks completed (T086-T100, including T089b) ✅
- [x] All unit test cases passing (140+ scenarios including grouping tests) ✅
- [x] All integration test cases passing (50+ scenarios) ✅
- [x] 6 notification types working (like, comment, reply, comment_like, repost, follow) ✅
- [x] Smart grouping working for groupable types ✅
- [x] Individual notifications for repost and follow ✅
- [x] Display format correct ("John liked" vs "John and 5 others liked") ✅
- [x] Grouped notifications update existing notification ✅
- [x] Unread count accurate ✅
- [x] Mark as read working (single and all) ✅
- [x] Notification list with pagination working ✅
- [x] Real-time notification delivery working (Socket.io) ✅
- [x] Real-time updates for grouped notifications working ✅
- [x] Real-time unread count updates working ✅
- [x] Multi-device sync working ✅
- [x] API documentation complete with grouping examples ✅
- [x] Manual testing successful ✅

---

## Epic 9: Search (P1)

**Status**: ⬜ Not Started  
**Effort**: 6-8 days  
**File**: [epic-09-search.md](./epic-09-search.md)  
**Depends on**: Epic 1 ✅, Epic 2 ✅, Epic 3 ✅, Epic 6 ✅

### Phase 1: Setup (Foundation)
- [ ] ⚡⚠️ **T101** - Update Constants for Search Configuration (0.25 days)
  - File: `/server/utils/constants.js`
  - Constants: MAX_SEARCH_RESULTS, DEFAULT_SEARCH_LIMIT, MIN_SEARCH_QUERY_LENGTH
  - Test cases: 5+ scenarios
  - Dependencies: None

- [ ] ⚡⚠️ **T102** - Create Text Indexes on Models (0.5 days)
  - Files: `/server/models/User.js`, `/server/models/Post.js`, `/server/models/Community.js`
  - Add MongoDB text indexes with weights
  - User: username, fullName, bio
  - Post: content, tags
  - Community: name, description, tags
  - Test cases: 6+ scenarios in `/server/spec/models/searchIndexes.spec.js`
  - Depends on: T101

- [ ] ⚡ **T103** - Create Search Helper Utilities (0.5 days)
  - File: `/server/utils/searchHelpers.js`
  - Functions: validateSearchQuery, buildSearchFilter, sanitizeSearchQuery, parseSearchPagination
  - Test cases: 14+ scenarios in `/server/spec/utils/searchHelpers.spec.js`
  - Depends on: T101

### Phase 2: User Story 1 - Search for Users
- [ ] 🔗 **T104** - Implement Search Users Controller (1.5 days)
  - File: `/server/controllers/user/searchUsersController.js`
  - Function: `searchUsers(req, res)`
  - Query params: q (required), specialization, page, limit
  - Features: Text search, alphabetical sort, optional auth, blocked users filter
  - Test cases: 16+ scenarios
  - Depends on: Epic 1, Epic 2, T101, T102, T103

### Phase 3: User Story 2 - Search for Posts
- [ ] 🔗 **T105** - Implement Search Posts Controller (1.5 days)
  - File: `/server/controllers/post/searchPostsController.js`
  - Function: `searchPosts(req, res)`
  - Query params: q (required), tags, type, communityId, page, limit
  - Features: Text search, tags filter, alphabetical sort, optional auth
  - Test cases: 23+ scenarios
  - Depends on: Epic 1, Epic 3, T101, T102, T103

### Phase 4: User Story 3 - Search for Communities
- [ ] 🔗 **T106** - Implement Search Communities Controller (1 day)
  - File: `/server/controllers/community/searchCommunitiesController.js`
  - Function: `searchCommunities(req, res)`
  - Query params: q (required), tags, page, limit
  - Features: Text search, tags filter, member count sort, optional auth
  - Test cases: 15+ scenarios
  - Depends on: Epic 1, Epic 6, T101, T102, T103

### Phase 5: Routes & Integration
- [ ] 🔗 **T107** - Create Search Routes (0.5 days)
  - File: `/server/routes/searchRoutes.js`
  - Routes: GET /search/users, GET /search/posts, GET /search/communities
  - All routes use optionalAuth middleware
  - Update `/server/app.js` to include search routes
  - Test cases: 6+ scenarios
  - Depends on: T104, T105, T106

- [ ] 🔗 **T108** - Create Search Integration Tests (1.5 days)
  - File: `/server/spec/integration/search.integration.spec.js`
  - Test suites: Users (14 tests), Posts (21 tests), Communities (13 tests)
  - Test cases: 50+ integration scenarios
  - Depends on: T104, T105, T106, T107

- [ ] ⚡🔗 **T109** - Update API Documentation for Search (0.5 days)
  - File: `/server/docs/search.yaml`
  - Document all search endpoints with examples
  - Update `/server/docs/index.js`
  - Depends on: T107

**Epic 9 Completion Criteria:**
- [ ] All 9 tasks completed (T101-T109)
- [ ] All unit test cases passing (70+ scenarios)
- [ ] All integration test cases passing (50+ scenarios)
- [ ] Text indexes created and functional
- [ ] Search query validation working (min 2 chars)
- [ ] User search working (username, name, bio, alphabetical sort)
- [ ] Post search working (content, tags, filters, alphabetical sort)
- [ ] Community search working (name, description, tags, member count sort)
- [ ] Blocked users excluded from user search (authenticated)
- [ ] Pagination working correctly with max limit enforcement
- [ ] Optional authentication working (additional fields for authenticated users)
- [ ] API documentation complete
- [ ] Manual testing successful
- [ ] Performance targets met (< 300ms for typical queries)

---

## Epic 10: Admin & Moderation (P1)

**Status**: ⬜ Not Started  
**Effort**: 7-9 days  
**Depends on**: Epic 1, Epic 2, Epic 3

### Tasks (To be documented)
- [ ] **T110-T119** - Admin tasks (10 tasks)

---

## Overall Progress

### Epics Completed
- [x] Epic 1: Authentication & Authorization (P0) ✅ - December 12, 2025
- [x] Epic 2: User Profiles & Social Features (P0) ✅ - December 13, 2025
- [x] Epic 3: Posts & Comments System (P0) ✅ - December 14, 2025
- [x] Epic 4: File Upload & Media (P0) ✅ - December 15, 2025
- [x] Epic 5: Feed & Discovery (P0) ✅ - December 15, 2025
- [x] Epic 6: Communities (P1) ✅ - December 15, 2025
- [x] Epic 7: Messaging & Real-time (P0) ✅ - December 16, 2025
- [x] Epic 8: Notifications & Real-time (P0) ✅ - December 16, 2025
- [ ] Epic 9: Search (P1) - Target: December 23, 2025
- [ ] Epic 10: Admin & Moderation (P1) - Target: December 30, 2025

### MVP Milestones (P0 Epics)
- [x] **Milestone 1**: Authentication Ready (Epic 1) ✅ - December 12, 2025
- [x] **Milestone 2**: Social Features Ready (Epic 2) ✅ - December 13, 2025
- [x] **Milestone 3**: Content System Ready (Epic 3) ✅ - December 14, 2025
- [x] **Milestone 4**: Media Upload Ready (Epic 4) ✅ - December 15, 2025
- [x] **Milestone 5**: Feed Algorithm Ready (Epic 5) ✅ - December 15, 2025
- [x] **Milestone 6**: Messaging & Real-time Ready (Epic 7) ✅ - December 16, 2025
- [x] **Milestone 7**: Notifications & Real-time Ready (Epic 8) ✅ - December 16, 2025
- [x] **MVP COMPLETE** ✅ - December 16, 2025

### Post-MVP Enhancement Milestones (P1 Epics)
- [ ] **Milestone 8**: Search Ready (Epic 9) - Target: December 23, 2025
- [ ] **Milestone 9**: Admin & Moderation Ready (Epic 10) - Target: December 30, 2025
- [ ] **FULL PLATFORM COMPLETE** - Target: December 30, 2025

### Statistics
- **Total Tasks**: 140+ (estimated)
- **Documented Tasks**: 109 (T001-T109)
- **Completed Tasks**: 100 (Epics 1-8: T001-T100)
- **Remaining Tasks**: 40 (Epics 9-10: T101-T140)
- **Progress**: 78% documented, 91.7% of documented tasks completed
- **Tests Written**: 1200+ test cases passing
- **Code Coverage**: ~87% (estimated)

### Recent Accomplishments (December 16, 2025)
- ✅ **MVP COMPLETED!** 🎉
- ✅ Completed Epic 7: Messaging & Real-time
  - 20 tasks completed (T066-T085)
  - 230+ unit and integration tests passing
  - Individual and group conversations working
  - Real-time messaging with Socket.io
  - Typing indicators and seen status
  - Online/last seen tracking
  
- ✅ Completed Epic 8: Notifications & Real-time
  - 15 tasks completed (T086-T100)
  - 190+ unit and integration tests passing
  - 6 notification types with smart grouping
  - Real-time notification delivery
  - Multi-device sync working
  - Unread count tracking

---

## Daily Standup Template

### Today's Focus
- **Current Task**: TXXX - Task Name
- **Status**: In Progress / Blocked / Testing
- **Expected Completion**: Today / Tomorrow / This Week

### Yesterday's Accomplishments
- Completed TXXX
- Tests passing: X/Y
- Issues resolved: List

### Blockers
- None / List blockers

### Tomorrow's Plan
- Start/Continue TXXX
- Expected tasks: List

---

## Weekly Review Template

### Week X Summary
- **Completed Tasks**: List with TXXXs
- **Completed Epics**: List
- **Tests Added**: Total count
- **Code Coverage**: X%
- **Issues Found**: Count and severity
- **Documentation Updated**: Yes/No

### Next Week Goals
- Target Tasks: TXXX-TXXX
- Target Epic: Epic X
- Key Milestones: List

---

**Note**: Update this checklist as you complete each task. Use it in conjunction with your project management tool for tracking.
