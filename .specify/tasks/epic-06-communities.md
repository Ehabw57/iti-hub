# Epic 6: Communities

**Status**: ⬜ Not Started  
**Priority**: P1 (Post-MVP)  
**Effort**: 10-12 days  
**Depends on**: Epic 1 (Authentication), Epic 2 (User Profiles), Epic 3 (Posts), Epic 5 (Feed)  
**Start Date**: TBD  
**Target Completion**: January 10, 2026

---

## Overview

Implement a comprehensive community system where users can create, join, and participate in topic-based or interest-based groups. Includes community creation, membership management, moderation, and community-specific posts/feeds.

### Goals

- ✅ Create and manage communities
- ✅ Join/leave communities
- ✅ Post to communities
- ✅ Community-specific feeds (handled by Epic 5)
- ✅ Moderation system (add/remove moderators)
- ✅ Community discovery (list all communities)
- ✅ Membership management

### Non-Goals (Post-MVP)

- ❌ Private/invitation-only communities
- ❌ Paid community memberships
- ❌ Community analytics dashboard
- ❌ Advanced moderation (content filters, auto-mod)
- ❌ Community events calendar
- ❌ Pinned posts

---

## User Stories

### 1. Create a Community
**As a** registered user  
**I want to** create a new community  
**So that** I can build a space for people with shared interests

**Acceptance Criteria:**
- Provide name, description, coverImage (optional)
- Name must be unique (case-insensitive)
- Creator automatically becomes owner and moderator
- Creator automatically enrolled as member
- Community visible in discovery immediately
- Returns created community with `_id`

---

### 2. Join a Community
**As a** registered user  
**I want to** join a community  
**So that** I can see community posts in my feed and participate

**Acceptance Criteria:**
- Any user can join any public community
- User enrolled with role "member"
- Community posts appear in user's home feed
- Can post to the community after joining
- Cannot join same community twice (idempotent)
- Enrollment recorded in Enrollment model

---

### 3. Leave a Community
**As a** community member  
**I want to** leave a community  
**So that** I no longer see its content

**Acceptance Criteria:**
- User can leave any community they're enrolled in
- Cannot leave if you're the only owner
- Enrollment deleted from database
- Community posts no longer in user's feed
- User loses posting privileges to community
- 200 response even if not enrolled (idempotent)

---

### 4. Post to a Community
**As a** community member  
**I want to** post content to the community  
**So that** other members can see it

**Acceptance Criteria:**
- Only enrolled members can post
- Post includes `community` field referencing Community._id
- Post visible in community feed
- Post visible in followers' home feeds (dual visibility)
- Cannot post if not a member (403 error)
- Post author can still edit/delete their post

---

### 5. Manage Moderators
**As a** community owner or moderator  
**I want to** add or remove moderators  
**So that** I can distribute moderation responsibilities

**Acceptance Criteria:**
- Only owners/moderators can add new moderators
- Promoting user requires they're already a member
- Moderators can remove other moderators (not owners)
- Owners cannot be removed as moderators
- Removed moderators remain as members
- Community must have at least one owner

---

### 6. Discover Communities
**As a** user (authenticated or guest)  
**I want to** browse all available communities  
**So that** I can find interesting groups to join

**Acceptance Criteria:**
- Public endpoint (no authentication required)
- List all communities with basic info (name, description, memberCount)
- Pagination supported (20 per page)
- Optional search by name (case-insensitive substring)
- Returns `isJoined` flag for authenticated users
- Sorted by memberCount descending (most popular first)

---

## Data Models

### Community Model

**File:** `/server/models/Community.js`

```javascript
const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  coverImage: {
    type: String, // URL to image
    default: null
  },
  memberCount: {
    type: Number,
    default: 1 // Creator is first member
  },
  postCount: {
    type: Number,
    default: 0
  },
  owners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Indexes
communitySchema.index({ name: 1 }, { unique: true });
communitySchema.index({ memberCount: -1 }); // For sorting by popularity
communitySchema.index({ createdAt: -1 }); // For sorting by newest
```

**Key Fields:**
- `name`: Unique community identifier (displayed)
- `description`: Purpose/topic description
- `coverImage`: Optional banner image URL
- `memberCount`: Cached count (updated on join/leave)
- `postCount`: Cached count (updated on post create/delete)
- `owners`: Array of user IDs (cannot be removed, full control)
- `moderators`: Array of user IDs (can moderate, can be removed)

---

### Enrollment Model

**File:** `/server/models/Enrollment.js`

```javascript
const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'owner'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Compound unique index
enrollmentSchema.index({ user: 1, community: 1 }, { unique: true });
enrollmentSchema.index({ community: 1 }); // For getting community members
enrollmentSchema.index({ user: 1 }); // For getting user's communities
```

**Key Fields:**
- `user`: Reference to User model
- `community`: Reference to Community model
- `role`: Membership role (member, moderator, owner)
- `joinedAt`: Enrollment timestamp

**Unique Constraint:** One enrollment per user-community pair

---

### Post Model Changes

**Update:** Add optional `community` field to Post model

```javascript
community: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Community',
  default: null // null = personal post, not community post
}
```

---

## Implementation Tasks

### Phase 1: Data Models (2 days)

**T052: Create Community Model** (1 day)
- File: `/server/models/Community.js`
- Schema definition (name, description, coverImage, counts, owners, moderators)
- Indexes for performance
- Virtual for `isModerator(userId)`, `isOwner(userId)`
- Pre-save hooks to ensure at least one owner
- Tests: 15+ unit tests covering:
  - Model creation with required fields
  - Name uniqueness validation
  - Owner/moderator arrays
  - Default values (memberCount: 1, postCount: 0)
  - Indexes created correctly

**T053: Create Enrollment Model** (1 day)
- File: `/server/models/Enrollment.js`
- Schema definition (user, community, role, joinedAt)
- Compound unique index (user + community)
- Static methods: `isEnrolled(userId, communityId)`, `getRole(userId, communityId)`
- Tests: 12+ unit tests covering:
  - Model creation
  - Unique constraint enforcement
  - Role enum validation
  - Index verification
  - Static method functionality

---

### Phase 2: Helper Utilities (1 day)

**T054: Create Community Helpers** (1 day)
- File: `/server/utils/communityHelpers.js`
- Functions:
  - `isMember(userId, communityId)` - Check if user is enrolled
  - `canModerate(userId, communityId)` - Check if user can moderate
  - `incrementMemberCount(communityId)` - Atomic increment
  - `decrementMemberCount(communityId)` - Atomic decrement
  - `incrementPostCount(communityId)` - Atomic increment
  - `decrementPostCount(communityId)` - Atomic decrement
  - `updateModeratorList(communityId, userId, action)` - Add/remove moderator
- Tests: 20+ unit tests covering:
  - Permission checking logic
  - Atomic updates
  - Error handling
  - Edge cases

---

### Phase 3: CRUD Operations (3 days)

**T055: Create Community Controller** (1 day)
- File: `/server/controllers/community/createCommunityController.js`
- Route: `POST /communities`
- Middleware: `checkAuth`, `upload.single('coverImage')` (optional)

**Implementation:**
```javascript
async function createCommunity(req, res) {
  const { name, description } = req.body;
  const userId = req.user._id;
  
  // 1. Validate input
  if (!name || !description) {
    return res.status(400).json({
      success: false,
      message: 'Name and description are required'
    });
  }
  
  // 2. Check name uniqueness (case-insensitive)
  const exists = await Community.findOne({ 
    name: new RegExp(`^${name}$`, 'i') 
  });
  
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Community name already taken'
    });
  }
  
  // 3. Upload coverImage if provided
  let coverImageUrl = null;
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'communities',
      transformation: [
        { width: 1500, height: 300, crop: 'fill' }
      ]
    });
    coverImageUrl = result.secure_url;
  }
  
  // 4. Create community
  const community = new Community({
    name,
    description,
    coverImage: coverImageUrl,
    owners: [userId],
    moderators: [userId],
    memberCount: 1
  });
  
  await community.save();
  
  // 5. Create enrollment for creator
  const enrollment = new Enrollment({
    user: userId,
    community: community._id,
    role: 'owner'
  });
  
  await enrollment.save();
  
  // 6. Return created community
  return res.status(201).json({
    success: true,
    data: { community }
  });
}
```

**Tests: 15+ tests**
- Creates community with valid data
- Uploads and stores coverImage
- Name uniqueness enforced
- Creator enrolled as owner
- Validation errors returned
- Creator is owner and moderator

---

**T056: Get Community Details Controller** (0.5 days)
- File: `/server/controllers/community/getCommunityController.js`
- Route: `GET /communities/:id`
- Middleware: `optionalAuth`

**Implementation:**
```javascript
async function getCommunity(req, res) {
  const { id } = req.params;
  const userId = req.user?._id;
  
  const community = await Community.findById(id)
    .populate('owners', 'username fullName profilePicture')
    .populate('moderators', 'username fullName profilePicture')
    .lean();
  
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  // Add isJoined flag if authenticated
  if (userId) {
    const enrollment = await Enrollment.findOne({ 
      user: userId, 
      community: id 
    });
    community.isJoined = !!enrollment;
    community.role = enrollment?.role || null;
  }
  
  return res.json({
    success: true,
    data: { community }
  });
}
```

**Tests: 8+ tests**
- Returns community by ID
- 404 if not found
- Includes isJoined for authenticated users
- Includes role if enrolled
- Public access works

---

### Phase 4: Join/Leave (1 day)

**T057: Join/Leave Community Controllers** (1 day)
- Files:
  - `/server/controllers/community/joinCommunityController.js`
  - `/server/controllers/community/leaveCommunityController.js`
- Routes:
  - `POST /communities/:id/join`
  - `POST /communities/:id/leave`
- Middleware: `checkAuth`

**Join Implementation:**
```javascript
async function joinCommunity(req, res) {
  const { id: communityId } = req.params;
  const userId = req.user._id;
  
  // 1. Verify community exists
  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  // 2. Check if already enrolled
  const existing = await Enrollment.findOne({ 
    user: userId, 
    community: communityId 
  });
  
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Already a member',
      data: { enrollment: existing }
    });
  }
  
  // 3. Create enrollment
  const enrollment = new Enrollment({
    user: userId,
    community: communityId,
    role: 'member'
  });
  
  await enrollment.save();
  
  // 4. Increment member count
  await Community.findByIdAndUpdate(communityId, {
    $inc: { memberCount: 1 }
  });
  
  // 5. Invalidate user's home feed cache
  await invalidateUserFeed(userId);
  
  return res.status(201).json({
    success: true,
    message: 'Joined community successfully',
    data: { enrollment }
  });
}
```

**Leave Implementation:**
```javascript
async function leaveCommunity(req, res) {
  const { id: communityId } = req.params;
  const userId = req.user._id;
  
  // 1. Find enrollment
  const enrollment = await Enrollment.findOne({ 
    user: userId, 
    community: communityId 
  });
  
  if (!enrollment) {
    return res.status(200).json({
      success: true,
      message: 'Not a member'
    });
  }
  
  // 2. Check if user is the only owner
  if (enrollment.role === 'owner') {
    const ownerCount = await Enrollment.countDocuments({ 
      community: communityId, 
      role: 'owner' 
    });
    
    if (ownerCount === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave: you are the only owner'
      });
    }
  }
  
  // 3. Delete enrollment
  await enrollment.deleteOne();
  
  // 4. Decrement member count
  await Community.findByIdAndUpdate(communityId, {
    $inc: { memberCount: -1 }
  });
  
  // 5. Remove from moderators/owners arrays
  await Community.findByIdAndUpdate(communityId, {
    $pull: { 
      moderators: userId,
      owners: userId
    }
  });
  
  // 6. Invalidate user's feed cache
  await invalidateUserFeed(userId);
  
  return res.json({
    success: true,
    message: 'Left community successfully'
  });
}
```

**Tests: 20+ tests**
- Join community creates enrollment
- Join increments memberCount
- Already joined returns 200 (idempotent)
- Leave deletes enrollment
- Leave decrements memberCount
- Cannot leave as only owner
- Moderator leaving removes from moderators array
- Not enrolled leave returns 200

---

### Phase 5: Community Posts (2 days)

**T058: Update Create Post Controller** (1 day)
- File: `/server/controllers/post/createPostController.js` (MODIFY)
- Add support for `communityId` in request body

**Changes:**
```javascript
async function createPost(req, res) {
  const { content, communityId } = req.body;
  const userId = req.user._id;
  
  // If posting to community, verify membership
  if (communityId) {
    const enrollment = await Enrollment.findOne({ 
      user: userId, 
      community: communityId 
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member to post to this community'
      });
    }
    
    // Create post with community reference
    const post = new Post({
      content,
      author: userId,
      community: communityId,
      media: [] // Handle media uploads
    });
    
    await post.save();
    
    // Increment community post count
    await Community.findByIdAndUpdate(communityId, {
      $inc: { postCount: 1 }
    });
    
    // Invalidate community feed cache
    await invalidateCommunityFeed(communityId);
    
    return res.status(201).json({
      success: true,
      data: { post }
    });
  }
  
  // Regular post (no community)
  // ... existing logic
}
```

**Tests: 15+ tests**
- Create post to community if member
- 403 if not a member
- postCount increments
- Post has community reference
- Cache invalidation works
- Personal posts still work (communityId = null)

---

**T059: Update Delete Post Controller** (0.5 days)
- File: `/server/controllers/post/deletePostController.js` (MODIFY)
- Decrement community postCount if community post

**Changes:**
```javascript
// After deleting post
if (post.community) {
  await Community.findByIdAndUpdate(post.community, {
    $inc: { postCount: -1 }
  });
  await invalidateCommunityFeed(post.community);
}
```

**Tests: 5+ tests**
- Deleting community post decrements postCount
- Cache invalidation

---

### Phase 6: Moderation (1.5 days)

**T060: Add Moderator Controller** (0.75 days)
- File: `/server/controllers/community/addModeratorController.js`
- Route: `POST /communities/:id/moderators`
- Middleware: `checkAuth`

**Implementation:**
```javascript
async function addModerator(req, res) {
  const { id: communityId } = req.params;
  const { userId: targetUserId } = req.body;
  const currentUserId = req.user._id;
  
  // 1. Verify requester can moderate
  const canModerate = await checkModeratorPermission(currentUserId, communityId);
  if (!canModerate) {
    return res.status(403).json({
      success: false,
      message: 'Only owners/moderators can add moderators'
    });
  }
  
  // 2. Verify target user is a member
  const enrollment = await Enrollment.findOne({ 
    user: targetUserId, 
    community: communityId 
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'User is not a member of this community'
    });
  }
  
  // 3. Update enrollment role
  enrollment.role = 'moderator';
  await enrollment.save();
  
  // 4. Add to moderators array in Community
  await Community.findByIdAndUpdate(communityId, {
    $addToSet: { moderators: targetUserId }
  });
  
  return res.json({
    success: true,
    message: 'Moderator added successfully'
  });
}
```

**Tests: 10+ tests**
- Owner can add moderators
- Moderator can add moderators
- Member cannot add moderators
- Must be enrolled first
- Already moderator is idempotent

---

**T061: Remove Moderator Controller** (0.75 days)
- File: `/server/controllers/community/removeModeratorController.js`
- Route: `DELETE /communities/:id/moderators/:userId`
- Middleware: `checkAuth`

**Implementation:**
```javascript
async function removeModerator(req, res) {
  const { id: communityId, userId: targetUserId } = req.params;
  const currentUserId = req.user._id;
  
  // 1. Verify requester can moderate
  const canModerate = await checkModeratorPermission(currentUserId, communityId);
  if (!canModerate) {
    return res.status(403).json({
      success: false,
      message: 'Only owners/moderators can remove moderators'
    });
  }
  
  // 2. Cannot remove owners
  const targetEnrollment = await Enrollment.findOne({ 
    user: targetUserId, 
    community: communityId 
  });
  
  if (targetEnrollment?.role === 'owner') {
    return res.status(400).json({
      success: false,
      message: 'Cannot remove owners as moderators'
    });
  }
  
  // 3. Update enrollment role to member
  if (targetEnrollment) {
    targetEnrollment.role = 'member';
    await targetEnrollment.save();
  }
  
  // 4. Remove from moderators array
  await Community.findByIdAndUpdate(communityId, {
    $pull: { moderators: targetUserId }
  });
  
  return res.json({
    success: true,
    message: 'Moderator removed successfully'
  });
}
```

**Tests: 12+ tests**
- Moderators can be removed
- Cannot remove owners
- Moderator can remove other moderators
- Member cannot remove moderators
- Removed moderator becomes member

---

### Phase 7: Routes & Integration (2.5 days)

**T062: Create Community Routes** (0.5 days)
- File: `/server/routes/communityRoutes.js`
- Routes:
  - `POST /communities` → createCommunity (checkAuth, upload)
  - `GET /communities` → listCommunities (optionalAuth)
  - `GET /communities/:id` → getCommunity (optionalAuth)
  - `POST /communities/:id/join` → joinCommunity (checkAuth)
  - `POST /communities/:id/leave` → leaveCommunity (checkAuth)
  - `GET /communities/:id/feed` → getCommunityFeed (optionalAuth) [Epic 5]
  - `POST /communities/:id/moderators` → addModerator (checkAuth)
  - `DELETE /communities/:id/moderators/:userId` → removeModerator (checkAuth)

**T063: Create Community Integration Tests** (1.5 days)
- File: `/server/spec/integration/community.integration.spec.js`
- Tests: 40+ end-to-end tests

**Test Scenarios:**
- Create community flow
- Join/leave community flow
- Post to community flow
- Community feed generation
- Moderation workflows
- Permission checks
- Edge cases (only owner leaving, etc.)
- Cache invalidation
- Error handling

**T064: Update API Documentation** (0.5 days)
- File: `/server/docs/community.yaml`
- Document all 8 community endpoints
- Schemas for Community and Enrollment
- Request/response examples
- Permission requirements
- Error codes

---

## Community Discovery

### List All Communities

**Endpoint:** `GET /communities?page=1&limit=20&search=tech`

**Controller:** `listCommunitiesController.js`

**Implementation:**
```javascript
async function listCommunities(req, res) {
  const { page = 1, limit = 20, search } = req.query;
  const userId = req.user?._id;
  
  // Build query
  const query = {};
  if (search) {
    query.name = new RegExp(search, 'i'); // Case-insensitive substring
  }
  
  // Get communities
  const communities = await Community.find(query)
    .sort({ memberCount: -1 }) // Most popular first
    .skip((page - 1) * limit)
    .limit(limit)
    .select('name description coverImage memberCount postCount createdAt')
    .lean();
  
  // Add isJoined flag if authenticated
  if (userId) {
    const enrollments = await Enrollment.find({
      user: userId,
      community: { $in: communities.map(c => c._id) }
    }).select('community');
    
    const joinedIds = new Set(enrollments.map(e => e.community.toString()));
    
    communities.forEach(community => {
      community.isJoined = joinedIds.has(community._id.toString());
    });
  }
  
  // Get total count
  const total = await Community.countDocuments(query);
  
  return res.json({
    success: true,
    data: {
      communities,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}
```

---

## Permissions Matrix

| Action | Guest | Member | Moderator | Owner |
|--------|-------|--------|-----------|-------|
| View community | ✅ | ✅ | ✅ | ✅ |
| View community feed | ✅ | ✅ | ✅ | ✅ |
| Join community | ✅ | N/A | N/A | N/A |
| Leave community | N/A | ✅ | ✅ | ✅* |
| Post to community | ❌ | ✅ | ✅ | ✅ |
| Edit own post | ❌ | ✅ | ✅ | ✅ |
| Delete own post | ❌ | ✅ | ✅ | ✅ |
| Delete others' posts | ❌ | ❌ | ✅ | ✅ |
| Add moderators | ❌ | ❌ | ✅ | ✅ |
| Remove moderators | ❌ | ❌ | ✅ | ✅ |
| Remove owners | ❌ | ❌ | ❌ | ❌ |

*Owner can leave only if not the last owner

---

## Testing Strategy

### Unit Tests (134+ tests)

**Community Model (15 tests):**
- Schema validation
- Uniqueness constraints
- Default values
- Indexes

**Enrollment Model (12 tests):**
- Schema validation
- Compound unique index
- Role enum
- Static methods

**Community Helpers (20 tests):**
- Permission checking
- Atomic count updates
- Error handling

**Controllers (87 tests):**
- Create community (15 tests)
- Get community (8 tests)
- Join/leave (20 tests)
- Community posts (20 tests)
- Moderation (22 tests)
- List communities (2 tests)

### Integration Tests (40+ tests)

**End-to-End Flows:**
- Create community → join → post → feed
- Join → leave → cannot post
- Add moderator → moderate content
- Remove moderator → loses permissions
- Community discovery with search
- Permission enforcement
- Cache behavior

---

## API Endpoints Summary

### Community CRUD

```http
POST /communities
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
{
  "name": "Tech Enthusiasts",
  "description": "A community for tech lovers",
  "coverImage": <file> (optional)
}

Response 201:
{
  "success": true,
  "data": {
    "community": {
      "_id": "...",
      "name": "Tech Enthusiasts",
      "description": "...",
      "coverImage": "https://...",
      "memberCount": 1,
      "postCount": 0,
      "owners": ["..."],
      "moderators": ["..."]
    }
  }
}
```

```http
GET /communities/:id
Authorization: Bearer <token> (optional)

Response 200:
{
  "success": true,
  "data": {
    "community": {
      "_id": "...",
      "name": "...",
      "isJoined": true,
      "role": "member"
    }
  }
}
```

### Membership

```http
POST /communities/:id/join
Authorization: Bearer <token>

Response 201:
{
  "success": true,
  "message": "Joined community successfully"
}
```

```http
POST /communities/:id/leave
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Left community successfully"
}
```

### Moderation

```http
POST /communities/:id/moderators
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "userId": "..."
}

Response 200:
{
  "success": true,
  "message": "Moderator added successfully"
}
```

```http
DELETE /communities/:id/moderators/:userId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Moderator removed successfully"
}
```

### Discovery

```http
GET /communities?page=1&limit=20&search=tech
Authorization: Bearer <token> (optional)

Response 200:
{
  "success": true,
  "data": {
    "communities": [
      {
        "_id": "...",
        "name": "Tech Enthusiasts",
        "description": "...",
        "memberCount": 523,
        "postCount": 1245,
        "isJoined": true
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

---

## Success Criteria

- [ ] All 13 tasks completed (T052-T064)
- [ ] All 134+ unit tests passing
- [ ] All 40+ integration tests passing
- [ ] Users can create communities
- [ ] Users can join/leave communities
- [ ] Members can post to communities
- [ ] Moderation system works (add/remove moderators)
- [ ] Community feed shows correct posts
- [ ] Permission checks enforced
- [ ] Community discovery functional
- [ ] Cache invalidation working
- [ ] API documentation complete
- [ ] Manual testing successful

---

## Future Enhancements (Post-MVP)

- [ ] Private/invitation-only communities
- [ ] Paid memberships / subscriptions
- [ ] Community analytics (engagement, growth)
- [ ] Advanced moderation tools (auto-mod, content filters)
- [ ] Pinned posts
- [ ] Community rules/guidelines section
- [ ] Member roles beyond owner/moderator/member
- [ ] Community events/calendar
- [ ] Community categories/tags
- [ ] Trending communities
- [ ] Recommended communities (based on interests)

---

## Dependencies

**Epic 1**: Authentication (checkAuth, optionalAuth middleware)  
**Epic 2**: User Profiles (User model, profile data)  
**Epic 3**: Posts (Post model, post controllers)  
**Epic 4**: File Upload (coverImage upload to Cloudinary)  
**Epic 5**: Feed Algorithm (community feed generation, cache invalidation)

**NPM Packages:**
- `cloudinary` (^1.41.0) - Cover image uploads
- `multer` (^1.4.5) - Multipart form data handling

---

**Epic Owner**: TBD  
**Review Date**: January 10, 2026  
**Status**: Not Started
