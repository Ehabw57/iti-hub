# Epic 3: Posts & Comments (P0)

**Priority**: P0 (MVP Critical)  
**Estimated Effort**: 12-15 days  
**Dependencies**: Epic 1 (Authentication) must be complete  
**Specifications**: `/docs/specs/API-Specification.md`, `/docs/specs/Database-Schema.md`

---

## User Stories

### US1: Create Post
**As a** user  
**I want to** create a post with content, images, tags, and optionally in a community  
**So that** I can share content with others
- Enforce rate limit (10 posts/hour)

---

### US2: Edit Post
**As a** user  
**I want to** edit my post's content and tags  
**So that** I can update my posts
- Only owner, moderator, or admin can edit

---

### US3: Delete Post
**As a** user  
**I want to** delete my post  
**So that** I can remove content I no longer want to share
- Deletes post and related likes/saves

---

### US4: Like/Unlike Post
**As a** user  
**I want to** like or unlike posts  
**So that** I can show appreciation for content
- Updates likesCount

---

### US5: Save/Unsave Post
**As a** user  
**I want to** save or unsave posts  
**So that** I can bookmark content
- Updates savesCount

---

### US6: Repost
**As a** user  
**I want to** repost content with an optional comment  
**So that** I can share posts with my followers
- Optionally includes a comment

---

### US7: Comment on Post
**As a** user  
**I want to** comment on posts  
**So that** I can discuss content
- Validate content

---

### US8: Reply to Comment
**As a** user  
**I want to** reply to comments  
**So that** I can participate in discussions
- Only one level of replies allowed

---

### US9: Like/Unlike Comment
**As a** user  
**I want to** like or unlike comments  
**So that** I can show appreciation for comments
- Updates likesCount

---

### US10: Delete Comment
**As a** user  
**I want to** delete my comment  
**So that** I can remove my comments
- Only owner, moderator, or admin can delete

### US11: Edit Comment
**As a** user  
**I want to** edit my comment's content  
**So that** I can correct or update my comments

**Acceptance Criteria:**
- Only content can be updated
- Only owner, moderator, or admin can edit
- Validate content (1-1000 chars)
- Return updated comment object

---

---

## Phase 1: Setup (Shared Infrastructure)

### T031: Create/Update Post Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**

**Schema Definition:**
See `/docs/specs/Database-Schema.md` (Post Schema)

#### Post Schema (from Database-Schema.md)

**Collection**: `posts`

```javascript
{
	_id: ObjectId,
	author: ObjectId,           // Ref: users, required
	content: String,            // Max 5000 chars, required if images is empty
	images: [String],           // Array of image URLs, max 10
	tags: [ObjectId],           // Ref: tags, max 5
	community: ObjectId,        // Ref: communities, optional
	repostComment: String,      // Max 500 chars, optional
	originalPost: ObjectId,     // Ref: posts, for reposts
	likesCount: Number,         // Denormalized
	commentsCount: Number,      // Denormalized
	repostsCount: Number,       // Denormalized
	savesCount: Number,         // Denormalized
	createdAt: Date,
	updatedAt: Date,
}
```

**Validation Rules:**
- `author`: Required, valid ObjectId
- `content`: Max 5000 chars, required if `images` is empty
- `images`: Array, of image URL
- `tags`: Array, max 5 ObjectIds
- `repostComment`: Max 500 chars

**Post Edit Rules:**
- Only `content` and `tags` can be updated
- `images` cannot be updated (delete and recreate post to change images)
- `editedAt` timestamp updated on every edit
- Owner, moderators (in community), and admins can edit

**Indexes:**
```javascript
// Primary
{ _id: 1 }
// Query indexes
{ author: 1, createdAt: -1 }
{ community: 1, createdAt: -1 }
{ type: 1, createdAt: -1 }
{ tags: 1, createdAt: -1 }
{ createdAt: -1 }
{ originalPost: 1 }
// Compound indexes for feed
{ author: 1, createdAt: -1 }
{ community: 1, createdAt: -1 }
// Text search
{ content: "text" }
```
### T03X: Create/Update PostLike Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/models/PostLike.js`

#### PostLike Schema (from Database-Schema.md)

**Collection**: `postLikes`

```javascript
{
	_id: ObjectId,
	user: ObjectId,             // Ref: users, required
	post: ObjectId,             // Ref: posts, required
	createdAt: Date
}
```

**Indexes:**
```javascript
// Primary
{ _id: 1 }
// Unique compound
{ user: 1, post: 1 }  // Unique
// Query indexes
{ user: 1, createdAt: -1 }
{ post: 1, createdAt: -1 }
```

**Business Logic:**
- When created: increment `likesCount` in post, create notification
- When deleted: decrement `likesCount`

**Indexes:**
See `/docs/specs/Database-Schema.md` (Post Indexes)

**Tests to Pass:**
File: `/server/spec/models/postModel.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should create a post with valid content, images, tags, and community

**Acceptance Criteria:**
- [ ] Updates only allowed fields
- [ ] Validates all inputs
- [ ] Enforces permissions
- [ ] Returns updated post
- [ ] All tests pass

**Test Cases:**
- Should update content and tags for own post
- Should not allow images to be updated
- Should return 400 if trying to update images
- Should return 400 if content or tags are invalid
- Should return 403 if not owner, moderator, or admin
- Should return 404 if post not found
- Should return 200 and updated post object on success
**Priority**: Blocking

**Target File:**
- `/server/models/Comment.js`

**Schema Definition:**
See `/docs/specs/Database-Schema.md` (Comment Schema)

**Indexes:**
See `/docs/specs/Database-Schema.md` (Comment Indexes)

**Tests to Pass:**
File: `/server/spec/models/commentModel.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should create a comment with valid content and post reference
- Should require content (1-1000 chars)
- Should not allow nested replies beyond one level
- Should set createdAt and updatedAt timestamps
- Should enforce that only top-level comments can have replies
- Should validate author and post references
- Should apply all defined indexes

---

### T033: Create Post/Comment Helper Utilities
**Type**: Utility  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/utils/postHelpers.js`
- `/server/utils/commentHelpers.js`

**Functions to Implement:**
- Validation helpers for post/comment creation and update
- Response builders for post/comment objects

**Acceptance Criteria:**
- [ ] Validation helpers enforce all rules
- [ ] Response builders return consistent objects
- [ ] Reusable across controllers

---

### T034: Update Constants File for Posts/Comments
**Type**: Utility  
**User Story**: Foundation  
**Estimated Effort**: 0.25 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/utils/constants.js`

**New Constants to Add:**
- Post/comment validation limits (max content length, max images, etc.)
- Field lists for public/sensitive fields

**Acceptance Criteria:**
- [ ] All magic numbers centralized
- [ ] Field lists defined
- [ ] Easy to reference in tests

---

## Phase 2: Post Endpoints

### T035: [US1] Implement Create Post Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 1.5 days  
**Depends On**: T031, T033, T034  
**Priority**: P0

**Target File:**
- `/server/controllers/post/createPostController.js`

**Utility Dependencies:**
- `/server/utils/constants.js` (for validation limits)

**`createPost(req, res)`**
- **Input**: req.body (content, images, tags, communityId), req.user
- **Output**: JSON response with created post (201) or error (400/404/429)
- **Description**: Creates a new post with validation and rate limiting

**Acceptance Criteria:**
- [ ] Creates post with valid data
- [ ] Enforces all validation rules
- [ ] Enforces rate limit

**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1 day  
**Depends On**: T031, T033, T034  
**Priority**: P0

**Target File:**
- `/server/controllers/post/updatePostController.js`

- `/server/utils/postHelpers.js` (for validation, response building)
- `/server/utils/constants.js` (for validation limits)

**Function to Implement:**
- **Output**: JSON response with updated post (200) or error (400/403/404)
- **Description**: Updates post content/tags with validation and permissions

**Tests to Pass:**
File: `/server/spec/controllers/post/updatePostController.spec.js`
- [ ] Enforces permissions

- [ ] Creates post with valid data
- [ ] Enforces all validation rules
- [ ] Enforces rate limit
- [ ] Returns correct response
- [ ] All tests pass

**Test Cases:**
- Should create a post with valid content, images, tags, and community
- Should return 400 if content is missing and no images
- Should return 400 if more than 10 images are provided
- Should return 400 if more than 5 tags are provided
- Should return 400 if any tag is not from the controlled list
- Should return 400 if content exceeds 5000 chars
- Should return 404 if communityId is invalid
- Should return 429 if rate limit exceeded
- Should return 201 and post object on success
**Priority**: P0

**Target File:**
- `/server/controllers/comment/editCommentController.js`

**Utility Dependencies:**
- `/server/utils/commentHelpers.js` (for validation, response building)
- `/server/utils/constants.js` (for validation limits)

**Function to Implement:**

**`editComment(req, res)`**
- **Input**: req.params.commentId, req.body.content, req.user
- **Output**: JSON response with updated comment (200) or error (400/403/404)
- **Description**: Updates comment content with validation and permissions

**Tests to Pass:**
File: `/server/spec/controllers/comment/editCommentController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should update content for own comment
- Should not allow editing other fields
- Should return 400 if content is missing or invalid
- Should return 403 if not owner, moderator, or admin
- Should return 404 if comment not found
- Should return 200 and updated comment object on success


---

### T037: [US3] Implement Delete Post Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 1 day  
**Depends On**: T031  
**Priority**: P0

**Target File:**
- `/server/controllers/post/deletePostController.js`

**Function to Implement:**

**`deletePost(req, res)`**
- **Input**: req.params.postId, req.user
- **Output**: 204 on success, error (403/404)
- **Description**: Deletes post with permission checks

**Tests to Pass:**
File: `/server/spec/controllers/post/deletePostController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should delete own post and return 204
- Should allow moderator/admin to delete post
- Should return 403 if not authorized
- Should return 404 if post not found

---

### T038: [US4] Implement Like/Unlike Post Controller
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 1 day  
**Depends On**: T031  
**Priority**: P0

**Target File:**
- `/server/controllers/post/likePostController.js`

**Function to Implement:**

**`likePost(req, res)`**
- **Input**: req.params.postId, req.user
- **Output**: JSON response with isLiked and likesCount
- **Description**: Likes a post

**`unlikePost(req, res)`**
- **Input**: req.params.postId, req.user
- **Output**: JSON response with isLiked and likesCount
- **Description**: Unlikes a post

**Tests to Pass:**
File: `/server/spec/controllers/post/likePostController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should like a post and return isLiked true, likesCount incremented
- Should unlike a post and return isLiked false, likesCount decremented
- Should not allow liking a post twice
- Should not allow unliking a post that is not liked
- Should return 404 if post not found

---

### T039: [US5] Implement Save/Unsave Post Controller
**Type**: Controller  
**User Story**: US5  
**Estimated Effort**: 1 day  
**Depends On**: T031  
**Priority**: P0

**Target File:**
- `/server/controllers/post/savePostController.js`

**Function to Implement:**

**`savePost(req, res)`**
- **Input**: req.params.postId, req.user
- **Output**: JSON response with isSaved
- **Description**: Saves a post

**`unsavePost(req, res)`**
- **Input**: req.params.postId, req.user
- **Output**: JSON response with isSaved
- **Description**: Unsaves a post

**Tests to Pass:**
File: `/server/spec/controllers/post/savePostController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should save a post and return isSaved true
- Should unsave a post and return isSaved false
- Should not allow saving a post twice
- Should not allow unsaving a post that is not saved
- Should return 404 if post not found

---

### T040: [US6] Implement Repost Controller
**Type**: Controller  
**User Story**: US6  
**Estimated Effort**: 1 day  
**Depends On**: T031, T033  
**Priority**: P0

**Target File:**
- `/server/controllers/post/repostController.js`

**Function to Implement:**

**`repost(req, res)`**
- **Input**: req.params.postId, req.body.comment, req.user
- **Output**: JSON response with repost object
- **Description**: Creates a repost referencing the original post

**Tests to Pass:**
File: `/server/spec/controllers/post/repostController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should create a repost with optional comment
- Should not allow reposting own post
- Should return 404 if original post not found
- Should return 201 and repost object on success

---

## Phase 3: Comment Endpoints

### T041: [US7] Implement Create Comment Controller
**Type**: Controller  
**User Story**: US7  
**Estimated Effort**: 1 day  
**Depends On**: T032, T033, T034  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/createCommentController.js`

**Utility Dependencies:**
- `/server/utils/commentHelpers.js` (for validation, response building)
- `/server/utils/constants.js` (for validation limits)

**Function to Implement:**

**`createComment(req, res)`**
- **Input**: req.params.postId, req.body.content, req.user
- **Output**: JSON response with created comment (201) or error (400/404)
- **Description**: Creates a new comment on a post

**Tests to Pass:**
File: `/server/spec/controllers/comment/createCommentController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should create a comment with valid content
- Should return 400 if content is missing or invalid
- Should return 404 if post not found
- Should return 201 and comment object on success

---

### T042: [US8] Implement Reply to Comment Controller
**Type**: Controller  
**User Story**: US8  
**Estimated Effort**: 1 day  
**Depends On**: T032, T033, T034  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/replyCommentController.js`

**Function to Implement:**

**`replyToComment(req, res)`**
- **Input**: req.params.commentId, req.body.content, req.user
- **Output**: JSON response with created reply (201) or error (400/404)
- **Description**: Creates a reply to a comment (one level only)

**Tests to Pass:**
File: `/server/spec/controllers/comment/replyCommentController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should create a reply to a top-level comment
- Should not allow replies to replies (one level only)
- Should return 400 if content is missing or invalid
- Should return 404 if comment not found
- Should return 201 and reply object on success

---

### T043: [US9] Implement Like/Unlike Comment Controller
**Type**: Controller  
**User Story**: US9  
**Estimated Effort**: 1 day  
**Depends On**: T032  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/likeCommentController.js`

**Function to Implement:**

**`likeComment(req, res)`**
- **Input**: req.params.commentId, req.user
- **Output**: JSON response with isLiked and likesCount
- **Description**: Likes a comment

**`unlikeComment(req, res)`**
- **Input**: req.params.commentId, req.user
- **Output**: JSON response with isLiked and likesCount
- **Description**: Unlikes a comment

**Tests to Pass:**
File: `/server/spec/controllers/comment/likeCommentController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should like a comment and return isLiked true, likesCount incremented
- Should unlike a comment and return isLiked false, likesCount decremented
- Should not allow liking a comment twice
- Should not allow unliking a comment that is not liked
- Should return 404 if comment not found

---

### T044: [US10] Implement Delete Comment Controller
**Type**: Controller  
**User Story**: US10  
**Estimated Effort**: 1 day  
**Depends On**: T032  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/deleteCommentController.js`

**Function to Implement:**

**`deleteComment(req, res)`**
- **Input**: req.params.commentId, req.user
- **Output**: 204 on success, error (403/404)
- **Description**: Deletes comment with permission checks

**Tests to Pass:**
File: `/server/spec/controllers/comment/deleteCommentController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should delete own comment and return 204
- Should allow moderator/admin to delete comment
- Should return 403 if not authorized
- Should return 404 if comment not found

---

## Phase 4: List & Query Endpoints

### T045: [P] Get Post by ID
**Type**: Controller  
**User Story**: Query  
**Estimated Effort**: 0.5 days  
**Depends On**: T031  
**Priority**: P0

**Target File:**
- `/server/controllers/post/getPostController.js`

**Function to Implement:**

**`getPostById(req, res)`**
- **Input**: req.params.postId, req.user (optional)
- **Output**: JSON response with post object (200) or error (404)
- **Description**: Gets post by ID with privacy and relationship fields

**Tests to Pass:**
File: `/server/spec/controllers/post/getPostController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should return post with all public fields for any user
- Should return post with isLiked and isSaved for authenticated user
- Should return 404 if post not found

---

### T046: [P] Get Post Comments
**Type**: Controller  
**User Story**: Query  
**Estimated Effort**: 0.5 days  
**Depends On**: T032  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/getPostCommentsController.js`

**Function to Implement:**

**`getPostComments(req, res)`**
- **Input**: req.params.postId, req.query (pagination, sort), req.user (optional)
- **Output**: JSON response with comments array and pagination
- **Description**: Gets comments for a post with replies and relationship fields

**Tests to Pass:**
File: `/server/spec/controllers/comment/getPostCommentsController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should return paginated comments for a post
- Should include replies for each top-level comment
- Should return isLiked for authenticated user
- Should support sorting by createdAt and likesCount
- Should return 404 if post not found

---

### T047: [P] Get User's Posts
**Type**: Controller  
**User Story**: Query  
**Estimated Effort**: 0.5 days  
**Depends On**: T031  
**Priority**: P0

**Target File:**
- `/server/controllers/post/getUserPostsController.js`

**Function to Implement:**

**`getUserPosts(req, res)`**
- **Input**: req.params.userId, req.query (pagination, type), req.user (optional)
- **Output**: JSON response with posts array and pagination
- **Description**: Gets posts for a user

**Tests to Pass:**
File: `/server/spec/controllers/post/getUserPostsController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should return paginated posts for a user
- Should support filtering by type
- Should return 404 if user not found

---

### T048: [P] Get Saved Posts
**Type**: Controller  
**User Story**: Query  
**Estimated Effort**: 0.5 days  
**Depends On**: T031  
**Priority**: P0

**Target File:**
- `/server/controllers/post/getSavedPostsController.js`

**Function to Implement:**

**`getSavedPosts(req, res)`**
- **Input**: req.user, req.query (pagination)
- **Output**: JSON response with saved posts array and pagination
- **Description**: Gets saved posts for the current user

**Tests to Pass:**
File: `/server/spec/controllers/post/getSavedPostsController.spec.js`

**Acceptance Criteria:**

**Test Cases:**
- Should return paginated saved posts for the current user
- Should return empty array if no saved posts

---

## Notes
- All endpoints must be fully tested (test-first, then implement code)
- Use constants and helpers for validation and response building
- Reference Database-Schema.md for all schema/index/validation details
- All acceptance criteria must be met for each task
