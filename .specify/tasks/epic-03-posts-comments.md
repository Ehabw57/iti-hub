# Epic 3: Posts & Comments System (P0)

**Priority**: P0 (MVP Critical)  
**Estimated Effort**: 12-15 days  
**Dependencies**: Epic 1 (Authentication), Epic 2 (User Profiles)  
**Specifications**: `/docs/specs/API-Specification.md`, `/docs/specs/Database-Schema.md`

---

## User Stories

### US1: Create and View Posts
**As a** user  
**I want to** create posts with text, images, and tags  
**So that** I can share content with the community  

**Acceptance Criteria:**
- Post with text content (max 5000 chars)
- Include up to 10 images
- Add up to 5 tags from controlled list
- Associate with community (optional)
- Type: text, question, or project
- Return created post with author info

---

### US2: Update and Delete Posts
**As a** user  
**I want to** edit or delete my posts  
**So that** I can correct mistakes or remove content  

**Acceptance Criteria:**
- Edit content and tags only (not images)
- Only owner, moderator, or admin can edit
- Soft delete posts (isDeleted flag)
- Update editedAt timestamp
- Cascade considerations for likes/comments

---

### US3: Like and Save Posts
**As a** user  
**I want to** like and save posts  
**So that** I can show appreciation and bookmark content  

**Acceptance Criteria:**
- Like/unlike posts (toggle)
- Save/unsave posts (toggle)
- Update denormalized counts
- View my saved posts
- Idempotent operations

---

### US4: Comment on Posts
**As a** user  
**I want to** comment on posts  
**So that** I can engage in discussions  

**Acceptance Criteria:**
- Create comments (1-1000 chars)
- Reply to comments (single level only)
- View comments paginated and sorted
- Like comments
- Delete own comments

---

## Phase 1: Models & Schema

### T021: [P] Create Post Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/models/Post.js`

**Schema Definition:**
```javascript
{
  _id: ObjectId,
  author: ObjectId,              // Ref: users
  content: String,               // Max 5000 chars
  images: [String],              // Array of URLs, max 10
  type: String,                  // Enum: "text", "question", "project"
  tags: [String],                // Max 5 tags
  community: ObjectId,           // Ref: communities (optional)
  
  // Denormalized counts
  likesCount: Number,            // Default: 0
  commentsCount: Number,         // Default: 0
  repostsCount: Number,          // Default: 0
  
  // Metadata
  isDeleted: Boolean,            // Default: false (soft delete)
  editedAt: Date,                // When post was last edited
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ author: 1, createdAt: -1 }
{ community: 1, createdAt: -1 }
{ tags: 1, createdAt: -1 }
{ isDeleted: 1, createdAt: -1 }
{ createdAt: -1 }
```

**Functions to Implement:**

1. **`Post.prototype.canEdit(userId, userRole)`**
   - Input: `userId` (ObjectId), `userRole` (string)
   - Output: boolean
   - Description: Check if user can edit this post

2. **`Post.prototype.softDelete()`**
   - Input: None
   - Output: Promise<Post>
   - Description: Soft delete post (set isDeleted = true)

3. **Static Method: `Post.findVisiblePosts(filter, options)`**
   - Input: `filter` (object), `options` (object with pagination)
   - Output: Promise<Post[]>
   - Description: Find posts where isDeleted = false

**Tests to Pass:**
File: `/server/spec/models/postModel.spec.js`

```javascript
const Post = require('../../models/Post');
const User = require('../../models/User');
const { connectDB, closeDB, clearDB } = require('../helpers/DBUtils');

describe('Post Model', () => {
  let user;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
    user = await User.create({
      email: 'postauthor@example.com',
      password: 'Password123',
      username: 'postauthor',
      fullName: 'Post Author'
    });
  });

  describe('Schema Validation', () => {
    it('should create post with required fields', async () => {
      const post = await Post.create({
        author: user._id,
        content: 'Test post content',
        type: 'text'
      });

      expect(post.author.toString()).toBe(user._id.toString());
      expect(post.content).toBe('Test post content');
      expect(post.type).toBe('text');
      expect(post.likesCount).toBe(0);
      expect(post.commentsCount).toBe(0);
      expect(post.isDeleted).toBe(false);
    });

    it('should require author', async () => {
      try {
        await Post.create({
          content: 'Test content',
          type: 'text'
        });
        fail('Should require author');
      } catch (error) {
        expect(error.errors.author).toBeDefined();
      }
    });

    it('should validate type enum', async () => {
      try {
        await Post.create({
          author: user._id,
          content: 'Test content',
          type: 'invalid-type'
        });
        fail('Should validate type enum');
      } catch (error) {
        expect(error.errors.type).toBeDefined();
      }
    });

    it('should limit images array to 10', async () => {
      try {
        await Post.create({
          author: user._id,
          content: 'Test',
          type: 'text',
          images: Array(11).fill('https://example.com/image.jpg')
        });
        fail('Should limit images to 10');
      } catch (error) {
        expect(error.message).toMatch(/max.*10/i);
      }
    });

    it('should limit tags array to 5', async () => {
      try {
        await Post.create({
          author: user._id,
          content: 'Test',
          type: 'text',
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6']
        });
        fail('Should limit tags to 5');
      } catch (error) {
        expect(error.message).toMatch(/max.*5/i);
      }
    });
  });

  describe('canEdit', () => {
    it('should allow owner to edit', async () => {
      const post = await Post.create({
        author: user._id,
        content: 'Test content',
        type: 'text'
      });

      expect(post.canEdit(user._id, 'user')).toBe(true);
    });

    it('should allow admin to edit any post', async () => {
      const post = await Post.create({
        author: user._id,
        content: 'Test content',
        type: 'text'
      });

      const adminId = 'adminUserId';
      expect(post.canEdit(adminId, 'admin')).toBe(true);
    });

    it('should not allow non-owner user to edit', async () => {
      const post = await Post.create({
        author: user._id,
        content: 'Test content',
        type: 'text'
      });

      const otherUserId = 'otherUserId';
      expect(post.canEdit(otherUserId, 'user')).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should set isDeleted to true', async () => {
      const post = await Post.create({
        author: user._id,
        content: 'Test content',
        type: 'text'
      });

      await post.softDelete();

      expect(post.isDeleted).toBe(true);
      const foundPost = await Post.findById(post._id);
      expect(foundPost.isDeleted).toBe(true);
    });
  });

  describe('findVisiblePosts', () => {
    beforeEach(async () => {
      await Post.create({
        author: user._id,
        content: 'Visible post 1',
        type: 'text'
      });
      await Post.create({
        author: user._id,
        content: 'Deleted post',
        type: 'text',
        isDeleted: true
      });
      await Post.create({
        author: user._id,
        content: 'Visible post 2',
        type: 'text'
      });
    });

    it('should return only non-deleted posts', async () => {
      const posts = await Post.findVisiblePosts({}, { limit: 10 });
      expect(posts.length).toBe(2);
      expect(posts.every(p => !p.isDeleted)).toBe(true);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] Post schema with all fields
- [ ] Validation for arrays and enums
- [ ] canEdit method works correctly
- [ ] softDelete sets isDeleted flag
- [ ] findVisiblePosts excludes deleted
- [ ] All tests pass

---

### T022: [P] Create PostLike Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes

**Target File:**
- `/server/models/PostLike.js`

**Schema Definition:**
```javascript
{
  _id: ObjectId,
  user: ObjectId,                // Ref: users
  post: ObjectId,                // Ref: posts
  createdAt: Date
}
```

**Indexes:**
```javascript
{ user: 1, post: 1 } // Unique compound index
{ post: 1, createdAt: -1 }
```

**Static Methods:**

1. **`PostLike.toggle(userId, postId)`**
   - Input: `userId` (ObjectId), `postId` (ObjectId)
   - Output: Promise<{ liked: boolean, count: number }>
   - Description: Toggle like, update post likesCount

**Tests:**
```javascript
describe('PostLike Model', () => {
  it('should create like and increment count', async () => {
    const result = await PostLike.toggle(user._id, post._id);
    expect(result.liked).toBe(true);
    expect(result.count).toBe(1);
  });

  it('should remove like and decrement count', async () => {
    await PostLike.toggle(user._id, post._id); // Create
    const result = await PostLike.toggle(user._id, post._id); // Remove
    expect(result.liked).toBe(false);
    expect(result.count).toBe(0);
  });

  it('should prevent duplicate likes', async () => {
    await PostLike.create({ user: user._id, post: post._id });
    try {
      await PostLike.create({ user: user._id, post: post._id });
      fail('Should prevent duplicate');
    } catch (error) {
      expect(error.code).toBe(11000);
    }
  });
});
```

---

### T023: [P] Create Comment Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes

**Target File:**
- `/server/models/Comment.js`

**Schema Definition:**
```javascript
{
  _id: ObjectId,
  author: ObjectId,              // Ref: users
  post: ObjectId,                // Ref: posts
  parentComment: ObjectId,       // Ref: comments (for replies)
  content: String,               // 1-1000 chars, required
  
  // Denormalized counts
  likesCount: Number,            // Default: 0
  repliesCount: Number,          // Default: 0 (only for parent comments)
  
  // Metadata
  isDeleted: Boolean,            // Default: false
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ post: 1, parentComment: 1, createdAt: -1 }
{ author: 1, createdAt: -1 }
{ parentComment: 1, createdAt: -1 }
```

**Validation:**
- If parentComment exists, must validate it's a top-level comment (no nested replies)

**Tests:**
```javascript
describe('Comment Model', () => {
  it('should create comment on post', async () => {
    const comment = await Comment.create({
      author: user._id,
      post: post._id,
      content: 'Great post!'
    });
    expect(comment.content).toBe('Great post!');
  });

  it('should create reply to comment', async () => {
    const parentComment = await Comment.create({
      author: user._id,
      post: post._id,
      content: 'Parent comment'
    });
    
    const reply = await Comment.create({
      author: user._id,
      post: post._id,
      parentComment: parentComment._id,
      content: 'Reply to parent'
    });
    
    expect(reply.parentComment.toString()).toBe(parentComment._id.toString());
  });

  it('should not allow nested replies', async () => {
    const parent = await Comment.create({
      author: user._id,
      post: post._id,
      content: 'Parent'
    });
    const reply = await Comment.create({
      author: user._id,
      post: post._id,
      parentComment: parent._id,
      content: 'Reply'
    });
    
    try {
      await Comment.create({
        author: user._id,
        post: post._id,
        parentComment: reply._id,
        content: 'Nested reply'
      });
      fail('Should not allow nested replies');
    } catch (error) {
      expect(error.message).toMatch(/nested replies not allowed/i);
    }
  });
});
```

---

## Phase 2: User Story 1 - Create and View Posts

### T024: [US1] Implement Create Post Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 2 days  
**Depends On**: T021, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/postController.js`

**Function to Implement:**

**`createPost(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
  - `req.body.content` (string, optional if images present)
  - `req.body.images` (array of strings, optional)
  - `req.body.tags` (array of strings, optional)
  - `req.body.type` (string, default: 'text')
  - `req.body.communityId` (string, optional)
- **Output**: JSON response (201) or error (400/404/429/500)

**Implementation Steps:**
1. Validate request body
2. Check content or images present (at least one required)
3. Validate tags from allowed list
4. If communityId, verify community exists and user is member
5. Create post
6. Increment user's postsCount
7. Return post with populated author info

**Tests to Pass:**
File: `/server/spec/controllers/postController.spec.js`

```javascript
const { createPost, getPost, updatePost, deletePost } = require('../../controllers/postController');
const Post = require('../../models/Post');
const User = require('../../models/User');
const mockResponse = require('../helpers/responseMock');

describe('Post Controller', () => {
  describe('createPost', () => {
    let currentUser;

    beforeEach(() => {
      currentUser = {
        _id: 'userId123',
        username: 'testuser',
        fullName: 'Test User',
        postsCount: 5,
        save: jasmine.createSpy().and.callFake(function() {
          return Promise.resolve(this);
        })
      };
    });

    it('should return 400 if both content and images are missing', async () => {
      const req = {
        user: currentUser,
        body: { type: 'text' }
      };
      const res = mockResponse();

      await createPost(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toMatch(/content or images required/i);
    });

    it('should return 400 if content too long', async () => {
      const req = {
        user: currentUser,
        body: {
          content: 'A'.repeat(5001),
          type: 'text'
        }
      };
      const res = mockResponse();

      await createPost(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.details.fields.content).toMatch(/max.*5000/i);
    });

    it('should return 400 if too many images', async () => {
      const req = {
        user: currentUser,
        body: {
          content: 'Test',
          images: Array(11).fill('https://example.com/image.jpg'),
          type: 'text'
        }
      };
      const res = mockResponse();

      await createPost(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.details.fields.images).toMatch(/max.*10/i);
    });

    it('should return 400 if invalid image URL', async () => {
      const req = {
        user: currentUser,
        body: {
          content: 'Test',
          images: ['not-a-url'],
          type: 'text'
        }
      };
      const res = mockResponse();

      await createPost(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.details.fields.images).toMatch(/invalid url/i);
    });

    it('should return 400 if too many tags', async () => {
      const req = {
        user: currentUser,
        body: {
          content: 'Test',
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
          type: 'text'
        }
      };
      const res = mockResponse();

      await createPost(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.details.fields.tags).toMatch(/max.*5/i);
    });

    it('should return 400 if invalid tags', async () => {
      const req = {
        user: currentUser,
        body: {
          content: 'Test',
          tags: ['invalid-tag'],
          type: 'text'
        }
      };
      const res = mockResponse();
      // Assume we have a predefined list of valid tags
      
      await createPost(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toMatch(/invalid tag/i);
    });

    it('should create post successfully with content', async () => {
      const req = {
        user: currentUser,
        body: {
          content: 'This is my test post',
          type: 'text',
          tags: ['javascript', 'webdev']
        }
      };
      const res = mockResponse();
      const mockPost = {
        _id: 'postId123',
        author: currentUser._id,
        content: 'This is my test post',
        type: 'text',
        tags: ['javascript', 'webdev'],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        populate: jasmine.createSpy().and.returnValue(Promise.resolve({
          author: currentUser
        }))
      };
      spyOn(Post.prototype, 'save').and.returnValue(Promise.resolve(mockPost));

      await createPost(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.post.content).toBe('This is my test post');
      expect(currentUser.postsCount).toBe(6);
      expect(currentUser.save).toHaveBeenCalled();
    });

    it('should create post with images and no content', async () => {
      const req = {
        user: currentUser,
        body: {
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          type: 'text'
        }
      };
      const res = mockResponse();
      const mockPost = {
        _id: 'postId123',
        author: currentUser._id,
        images: req.body.images,
        type: 'text',
        populate: jasmine.createSpy().and.returnValue(Promise.resolve({
          author: currentUser
        }))
      };
      spyOn(Post.prototype, 'save').and.returnValue(Promise.resolve(mockPost));

      await createPost(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.post.images.length).toBe(2);
    });

    it('should default type to text', async () => {
      const req = {
        user: currentUser,
        body: {
          content: 'Test post'
        }
      };
      const res = mockResponse();
      spyOn(Post.prototype, 'save').and.callFake(function() {
        return Promise.resolve(this);
      });

      await createPost(req, res);

      expect(res.statusCode).toBe(201);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] Creates post with validation
- [ ] Requires content or images
- [ ] Validates tags from allowed list
- [ ] Increments user postsCount
- [ ] Returns populated author info
- [ ] All tests pass

---

### T025: [US1] Implement Get Post Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 1.5 days  
**Depends On**: T021, T022, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/postController.js`

**Function to Implement:**

**`getPost(req, res)`**
- **Input**:
  - `req.params.postId` (string)
  - `req.user` (object, optional - from optionalAuth)
- **Output**: JSON response (200) or error (404/500)

**Implementation Steps:**
1. Find post by ID (exclude deleted)
2. Populate author with profile fields
3. If user authenticated:
   - Check if user liked post
   - Check if user saved post
4. Return post with flags

**Tests:**
```javascript
describe('getPost', () => {
  it('should return 404 if post not found', async () => {
    const req = { params: { postId: 'nonexistent' } };
    const res = mockResponse();
    spyOn(Post, 'findById').and.returnValue({ populate: () => Promise.resolve(null) });

    await getPost(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('should return 404 if post is deleted', async () => {
    const req = { params: { postId: 'postId123' } };
    const res = mockResponse();
    const deletedPost = { _id: 'postId123', isDeleted: true };
    spyOn(Post, 'findById').and.returnValue({
      populate: () => Promise.resolve(deletedPost)
    });

    await getPost(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('should return post without auth', async () => {
    const req = { params: { postId: 'postId123' } };
    const res = mockResponse();
    const mockPost = {
      _id: 'postId123',
      content: 'Test post',
      author: { username: 'testuser' },
      isDeleted: false
    };
    spyOn(Post, 'findById').and.returnValue({
      populate: () => Promise.resolve(mockPost)
    });

    await getPost(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.post.content).toBe('Test post');
  });

  it('should include isLiked and isSaved when authenticated', async () => {
    const req = {
      params: { postId: 'postId123' },
      user: { _id: 'userId123' }
    };
    const res = mockResponse();
    const mockPost = {
      _id: 'postId123',
      content: 'Test post',
      isDeleted: false
    };
    spyOn(Post, 'findById').and.returnValue({
      populate: () => Promise.resolve(mockPost)
    });
    spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'likeId' }));
    // Assume SavedPost model similar to PostLike

    await getPost(req, res);

    expect(res.body.data.post.isLiked).toBe(true);
  });
});
```

**Acceptance Criteria:**
- [ ] Returns post with author info
- [ ] Excludes deleted posts
- [ ] Includes isLiked/isSaved for authenticated users
- [ ] Works without authentication
- [ ] All tests pass

---

## Phase 3: User Story 2 - Update and Delete

### T026: [US2] Implement Update Post Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1 day  
**Depends On**: T021, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/postController.js`

**Function to Implement:**

**`updatePost(req, res)`**
- **Input**:
  - `req.params.postId` (string)
  - `req.user` (object - from checkAuth)
  - `req.body.content` (string, optional)
  - `req.body.tags` (array, optional)
- **Output**: JSON response (200) or error (400/403/404/500)

**Implementation:**
- Only allow updating content and tags
- Check canEdit permission
- Set editedAt timestamp
- Return updated post

**Tests:** (Similar validation and permission patterns)

---

### T027: [US2] Implement Delete Post Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1 day  
**Depends On**: T021, Epic 1  
**Priority**: P0

**Function:** `deletePost(req, res)`

**Implementation:**
- Check canEdit permission
- Soft delete (set isDeleted = true)
- Decrement user's postsCount
- Return 204 No Content

---

## Phase 4: User Story 3 - Like and Save

### T028: [US3] Implement Like/Unlike Post Controllers
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 1 day  
**Depends On**: T022, Epic 1  
**Priority**: P0

**Functions:**
1. `likePost(req, res)` - Toggle like using PostLike.toggle()
2. Similar for save/unsave

---

## Phase 5: User Story 4 - Comments

### T029: [US4] Implement Create Comment Controller
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 1.5 days  
**Depends On**: T023, Epic 1  
**Priority**: P0

**Function:** `createComment(req, res)`

**Implementation:**
- Validate content (1-1000 chars)
- Create comment
- Increment post commentsCount
- If reply, increment parent repliesCount
- Return comment with author info

---

### T030: [US4] Implement Get Comments Controller
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 1.5 days  
**Depends On**: T023, Epic 1  
**Priority**: P0

**Function:** `getComments(req, res)`

**Implementation:**
- Get top-level comments for post
- Populate replies (one level)
- Include isLiked flag if authenticated
- Paginate and sort (createdAt or likesCount)

---

## Phase 6: Routes & Integration

### T031: Create Post Routes
**Type**: Routes  
**Estimated Effort**: 0.5 days  
**Depends On**: T024-T030  
**Priority**: P0

**Target File:** `/server/routes/postRoutes.js`

**Routes:**
```javascript
POST /posts (checkAuth)
GET /posts/:postId (optionalAuth)
PATCH /posts/:postId (checkAuth)
DELETE /posts/:postId (checkAuth)
POST /posts/:postId/like (checkAuth)
DELETE /posts/:postId/like (checkAuth)
POST /posts/:postId/comments (checkAuth)
GET /posts/:postId/comments (optionalAuth)
```

---

### T032: Create Post Integration Tests
**Type**: Testing  
**Estimated Effort**: 2 days  
**Depends On**: All controllers  
**Priority**: P0

**Target File:** `/server/spec/integration/posts.integration.spec.js`

**Test Scenarios:**
- Complete post lifecycle (create, view, update, delete)
- Like/unlike flow
- Comment creation and viewing
- Permission checks
- Concurrent like/comment operations

---

## Summary

**Total Tasks**: 12 (T021-T032)  
**Estimated Total Effort**: 12-15 days  
**Critical Path**: T021 → T024 → T025 → T031 → T032

**Parallel Opportunities:**
- T021, T022, T023 (all models)
- T024, T025 after T021 complete
- T026, T027, T028 after base controllers

**Definition of Done:**
- [ ] All models with validation
- [ ] All CRUD operations work
- [ ] Soft delete implemented
- [ ] Denormalized counts accurate
- [ ] Like/save are idempotent
- [ ] Comments support one-level replies
- [ ] All tests pass (unit + integration)
- [ ] API documentation updated
