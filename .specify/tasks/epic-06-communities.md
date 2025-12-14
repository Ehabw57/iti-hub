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
- Provide name, description, tags (1-3 predefined tags), profilePicture (optional), coverImage (optional)
- Name must be unique (case-insensitive)
- Tags must be from predefined list (see constants)
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
- List all communities with basic info (name, description, memberCount, tags)
- Pagination supported (20 per page)
- Optional search by name (case-insensitive substring)
- Optional filter by tags
- Returns `isJoined` flag for authenticated users
- Sorted by memberCount descending (most popular first)

---

### 7. Edit Community Details
**As a** community owner  
**I want to** edit community information  
**So that** I can keep community details up to date

**Acceptance Criteria:**
- Only owners can edit community details
- Editable fields: description only
- Name cannot be changed after creation
- Returns updated community
- 403 error if not an owner

---

### 8. Update Community Images
**As a** community owner  
**I want to** update the community profile picture and cover image  
**So that** I can customize the community appearance

**Acceptance Criteria:**
- Only owners can update profile picture or cover image
- Separate endpoints for profile picture and cover image
- Profile picture: 500x500px, max 5MB
- Cover image: 1500x500px, max 10MB
- Old images automatically deleted from Cloudinary
- 403 error if not an owner
- Images processed (resized, compressed, WebP format)

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
  profilePicture: {
    type: String, // URL to image
    default: null
  },
  coverImage: {
    type: String, // URL to image
    default: null
  },
  tags: [{
    type: String,
    enum: [] // Will be populated from constants.COMMUNITY_TAGS
  }],
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
}, { 
  timestamps: true 
});

// Indexes
communitySchema.index({ name: 1 }, { unique: true });
communitySchema.index({ memberCount: -1 }); // For sorting by popularity
communitySchema.index({ createdAt: -1 }); // For sorting by newest
communitySchema.index({ tags: 1 }); // For filtering by tags

// Validation
communitySchema.path('tags').validate(function(tags) {
  return tags.length >= 1 && tags.length <= 3;
}, 'Community must have between 1 and 3 tags');
```

**Key Fields:**
- `name`: Unique community identifier (displayed, immutable after creation)
- `description`: Purpose/topic description (editable by owners)
- `profilePicture`: Community avatar/logo (500x500px, editable by owners)
- `coverImage`: Community banner image (1500x500px, editable by owners)
- `tags`: 1-3 predefined category tags from COMMUNITY_TAGS constant
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

### Phase 0: Constants & Refactoring (1 day)

**T051: Add Community Constants** (0.5 days)
- File: `/server/utils/constants.js` (MODIFY)
- Add constants:
  ```javascript
  // Community Tags (predefined categories)
  COMMUNITY_TAGS: [
    'Technology',
    'Gaming',
    'Education',
    'Science',
    'Arts & Design',
    'Music',
    'Sports',
    'Health & Fitness',
    'Business',
    'Entertainment',
    'Food & Cooking',
    'Travel',
    'Books & Literature',
    'Photography',
    'Movies & TV',
    'Fashion',
    'DIY & Crafts',
    'News & Politics',
    'Environment',
    'Other'
  ],
  
  // Community Image Specs
  COMMUNITY_PROFILE_PICTURE_SIZE: { width: 500, height: 500 },
  COMMUNITY_COVER_IMAGE_SIZE: { width: 1500, height: 500 },
  COMMUNITY_PROFILE_PICTURE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  COMMUNITY_COVER_IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Community Validation
  MIN_COMMUNITY_TAGS: 1,
  MAX_COMMUNITY_TAGS: 3,
  ```
- Tests: 5+ tests for constant validation

**T051B: Refactor Feed Controllers for Community/Enrollment** (0.5 days)
- Files: 
  - `/server/controllers/feed/getHomeFeedController.js` (MODIFY)
  - `/server/controllers/feed/getFollowingFeedController.js` (MODIFY)
  - `/server/controllers/community/getCommunityFeedController.js` (MODIFY)
- Changes:
  - Remove mocked Community/Enrollment usage
  - Use actual Community and Enrollment models
  - Update queries to use real database relationships
  - Update tests to use real models instead of mocks
- Tests: Update existing tests (~30 tests affected)

---

### Phase 1: Data Models (2 days)

**T052: Create Community Model** (1 day)
- File: `/server/models/Community.js`
- Schema definition (name, description, profilePicture, coverImage, tags, counts, owners, moderators)
- Indexes for performance (name, memberCount, createdAt, tags)
- Tag validation (1-3 tags from COMMUNITY_TAGS)
- Virtual for `isModerator(userId)`, `isOwner(userId)`
- Pre-save hooks to ensure at least one owner
- Tests: 20+ unit tests covering:
  - Model creation with required fields
  - Name uniqueness validation
  - Owner/moderator arrays
  - Default values (memberCount: 1, postCount: 0)
  - Tag validation (min 1, max 3, from enum)
  - Indexes created correctly

**T053: Create Enrollment Model** (1 day)
- File: `/server/models/Enrollment.js`
- Schema definition (user, community, role)
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
  - `isOwner(userId, communityId)` - Check if user is owner
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

### Phase 3: CRUD Operations (4 days)

**T055: Create Community Controller** (1 day)
- File: `/server/controllers/community/createCommunityController.js`
- Route: `POST /communities`
- Middleware: `checkAuth`, `upload.fields([{ name: 'profilePicture' }, { name: 'coverImage' }])`

**Implementation:**
```javascript
async function createCommunity(req, res) {
  const { name, description, tags } = req.body;
  const userId = req.user._id;
  
  // 1. Validate input
  if (!name || !description) {
    return res.status(400).json({
      success: false,
      message: 'Name and description are required'
    });
  }
  
  // 2. Validate tags
  const parsedTags = JSON.parse(tags || '[]');
  if (parsedTags.length < 1 || parsedTags.length > 3) {
    return res.status(400).json({
      success: false,
      message: 'Community must have between 1 and 3 tags'
    });
  }
  
  const invalidTags = parsedTags.filter(tag => !COMMUNITY_TAGS.includes(tag));
  if (invalidTags.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Invalid tags: ${invalidTags.join(', ')}`
    });
  }
  
  // 3. Check name uniqueness (case-insensitive)
  const exists = await Community.findOne({ 
    name: new RegExp(`^${name}$`, 'i') 
  });
  
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Community name already taken'
    });
  }
  
  // 4. Upload images if provided
  let profilePictureUrl = null;
  let coverImageUrl = null;
  
  if (req.files?.profilePicture) {
    const result = await processAndUploadImage(
      req.files.profilePicture[0],
      'community-profiles',
      { width: 500, height: 500 }
    );
    profilePictureUrl = result.secure_url;
  }
  
  if (req.files?.coverImage) {
    const result = await processAndUploadImage(
      req.files.coverImage[0],
      'community-covers',
      { width: 1500, height: 500 }
    );
    coverImageUrl = result.secure_url;
  }
  
  // 5. Create community
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
    name,
    description,
    profilePicture: profilePictureUrl,
    coverImage: coverImageUrl,
    tags: parsedTags,
    owners: [userId],
    moderators: [userId],
    memberCount: 1
  });
  
  await community.save();
  
  // 6. Create enrollment for creator
  const enrollment = new Enrollment({
    user: userId,
    community: community._id,
    role: 'owner'
  });
  
  await enrollment.save();
  
  // 7. Return created community
  return res.status(201).json({
    success: true,
    data: { community }
  });
}
```

**Tests: 20+ tests**
- Creates community with valid data
- Uploads and stores profilePicture and coverImage
- Validates tags (1-3, from predefined list)
- Name uniqueness enforced
- Creator enrolled as owner
- Validation errors returned
- Creator is owner and moderator

---

**T055B: Update Community Details Controller** (0.5 days)
- File: `/server/controllers/community/updateCommunityController.js`
- Route: `PATCH /communities/:id`
- Middleware: `checkAuth`

**Implementation:**
```javascript
async function updateCommunity(req, res) {
  const { id: communityId } = req.params;
  const { description } = req.body;
  const userId = req.user._id;
  
  // 1. Verify user is owner
  const isOwner = await isOwnerHelper(userId, communityId);
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Only owners can edit community details'
    });
  }
  
  // 2. Validate description
  if (!description || description.length < 10 || description.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Description must be between 10 and 500 characters'
    });
  }
  
  // 3. Update community
  const community = await Community.findByIdAndUpdate(
    communityId,
    { description },
    { new: true, runValidators: true }
  );
  
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  return res.json({
    success: true,
    data: { community }
  });
}
```

**Tests: 10+ tests**
- Owners can update description
- Non-owners get 403
- Validates description length
- Returns updated community

---

**T055C: Update Community Profile Picture Controller** (0.5 days)
- File: `/server/controllers/community/updateCommunityProfilePictureController.js`
- Route: `POST /communities/:id/profile-picture`
- Middleware: `checkAuth`, `upload.single('image')`

**Implementation:**
```javascript
async function updateCommunityProfilePicture(req, res) {
  const { id: communityId } = req.params;
  const userId = req.user._id;
  
  // 1. Verify user is owner
  const isOwner = await isOwnerHelper(userId, communityId);
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Only owners can update community images'
    });
  }
  
  // 2. Verify file uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }
  
  // 3. Get community
  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  // 4. Delete old image if exists
  if (community.profilePicture) {
    await deleteCloudinaryImage(community.profilePicture);
  }
  
  // 5. Upload new image
  const result = await processAndUploadImage(
    req.file,
    'community-profiles',
    { width: 500, height: 500 }
  );
  
  // 6. Update community
  community.profilePicture = result.secure_url;
  await community.save();
  
  return res.json({
    success: true,
    data: { 
      profilePicture: community.profilePicture 
    }
  });
}
```

**Tests: 12+ tests**
- Owners can update profile picture
- Non-owners get 403
- Old image deleted from Cloudinary
- Image processed correctly (500x500)
- Validates file type and size

---

**T055D: Update Community Cover Image Controller** (0.5 days)
- File: `/server/controllers/community/updateCommunityCoverImageController.js`
- Route: `POST /communities/:id/cover-image`
- Middleware: `checkAuth`, `upload.single('image')`

**Implementation:**
```javascript
async function updateCommunityCoverImage(req, res) {
  const { id: communityId } = req.params;
  const userId = req.user._id;
  
  // 1. Verify user is owner
  const isOwner = await isOwnerHelper(userId, communityId);
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Only owners can update community images'
    });
  }
  
  // 2. Verify file uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }
  
  // 3. Get community
  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({
      success: false,
      message: 'Community not found'
    });
  }
  
  // 4. Delete old image if exists
  if (community.coverImage) {
    await deleteCloudinaryImage(community.coverImage);
  }
  
  // 5. Upload new image
  const result = await processAndUploadImage(
    req.file,
    'community-covers',
    { width: 1500, height: 500 }
  );
  
  // 6. Update community
  community.coverImage = result.secure_url;
  await community.save();
  
  return res.json({
    success: true,
    data: { 
      coverImage: community.coverImage 
    }
  });
}
```

**Tests: 12+ tests**
- Owners can update cover image
- Non-owners get 403
- Old image deleted from Cloudinary
- Image processed correctly (1500x500)
- Validates file type and size
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
- File: `/server/routes/communityRoutes.js` (MODIFY - already exists with feed route)
- Routes:
  - `POST /communities` → createCommunity (checkAuth, upload.fields)
  - `GET /communities` → listCommunities (optionalAuth)
  - `GET /communities/:id` → getCommunity (optionalAuth)
  - `PATCH /communities/:id` → updateCommunity (checkAuth)
  - `POST /communities/:id/profile-picture` → updateCommunityProfilePicture (checkAuth, upload.single)
  - `POST /communities/:id/cover-image` → updateCommunityCoverImage (checkAuth, upload.single)
  - `POST /communities/:id/join` → joinCommunity (checkAuth)
  - `POST /communities/:id/leave` → leaveCommunity (checkAuth)
  - `GET /communities/:id/feed` → getCommunityFeed (optionalAuth) [Already implemented in Epic 5]
  - `POST /communities/:id/moderators` → addModerator (checkAuth)
  - `DELETE /communities/:id/moderators/:userId` → removeModerator (checkAuth)

**T063: Create Community Integration Tests** (1.5 days)
- File: `/server/spec/integration/community.integration.spec.js`
- Tests: 50+ end-to-end tests

**Test Scenarios:**
- Create community flow (with/without images, with tags)
- Update community description (owner only)
- Update profile picture (owner only)
- Update cover image (owner only)
- Join/leave community flow
- Post to community flow
- Community feed generation
- Tag filtering in discovery
- Moderation workflows
- Permission checks
- Edge cases (only owner leaving, etc.)
- Cache invalidation
- Error handling

**T064: Update API Documentation** (0.5 days)
- File: `/server/docs/community.yaml`
- Document all 11 community endpoints
- Schemas for Community (with profilePicture, coverImage, tags) and Enrollment
- Document COMMUNITY_TAGS enum
- Request/response examples
- Permission requirements (owner-only for edits)
- Error codes
- Image upload specifications

---

## Community Discovery

### List All Communities

**Endpoint:** `GET /communities?page=1&limit=20&search=tech&tags=Technology,Gaming`

**Controller:** `listCommunitiesController.js`

**Implementation:**
```javascript
async function listCommunities(req, res) {
  const { page = 1, limit = 20, search, tags } = req.query;
  const userId = req.user?._id;
  
  // Build query
  const query = {};
  if (search) {
    query.name = new RegExp(search, 'i'); // Case-insensitive substring
  }
  
  // Filter by tags if provided
  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim());
    query.tags = { $in: tagArray };
  }
  
  // Get communities
  const communities = await Community.find(query)
    .sort({ memberCount: -1 }) // Most popular first
    .skip((page - 1) * limit)
    .limit(limit)
    .select('name description profilePicture coverImage tags memberCount postCount createdAt')
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
| Edit community description | ❌ | ❌ | ❌ | ✅ |
| Update profile picture | ❌ | ❌ | ❌ | ✅ |
| Update cover image | ❌ | ❌ | ❌ | ✅ |
| Add moderators | ❌ | ❌ | ✅ | ✅ |
| Remove moderators | ❌ | ❌ | ✅ | ✅ |
| Remove owners | ❌ | ❌ | ❌ | ❌ |

*Owner can leave only if not the last owner

---

## Testing Strategy

### Unit Tests (159+ tests)

**Constants (5 tests):**
- COMMUNITY_TAGS validation
- Image size constants

**Community Model (20 tests):**
- Schema validation
- Uniqueness constraints
- Default values
- Tag validation (1-3 tags)
- Indexes

**Enrollment Model (12 tests):**
- Schema validation
- Compound unique index
- Role enum
- Static methods

**Community Helpers (22 tests):**
- Permission checking (including isOwner)
- Atomic count updates
- Error handling

**Controllers (100 tests):**
- Create community (20 tests)
- Update community details (10 tests)
- Update profile picture (12 tests)
- Update cover image (12 tests)
- Get community (8 tests)
- Join/leave (20 tests)
- Community posts (20 tests)
- Moderation (22 tests)
- List communities (4 tests with tag filtering)

### Integration Tests (50+ tests)

**End-to-End Flows:**
- Create community → join → post → feed
- Create community with tags and images
- Update community details (owner only)
- Update images (owner only, old image deletion)
- Join → leave → cannot post
- Add moderator → moderate content
- Remove moderator → loses permissions
- Community discovery with search and tag filtering
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
  "tags": ["Technology", "Education"],  // 1-3 tags required
  "profilePicture": <file> (optional),
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
      "profilePicture": "https://...",
      "coverImage": "https://...",
      "tags": ["Technology", "Education"],
      "memberCount": 1,
      "postCount": 0,
      "owners": ["..."],
      "moderators": ["..."]
    }
  }
}
```

```http
PATCH /communities/:id
Content-Type: application/json
Authorization: Bearer <token>
[Owner only]

Body:
{
  "description": "Updated description"
}

Response 200:
{
  "success": true,
  "data": {
    "community": { ... }
  }
}
```

```http
POST /communities/:id/profile-picture
Content-Type: multipart/form-data
Authorization: Bearer <token>
[Owner only]

Body:
{
  "image": <file>  // Max 5MB, 500x500px
}

Response 200:
{
  "success": true,
  "data": {
    "profilePicture": "https://..."
  }
}
```

```http
POST /communities/:id/cover-image
Content-Type: multipart/form-data
Authorization: Bearer <token>
[Owner only]

Body:
{
  "image": <file>  // Max 10MB, 1500x500px
}

Response 200:
{
  "success": true,
  "data": {
    "coverImage": "https://..."
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
      "name": "Tech Enthusiasts",
      "description": "A community for tech lovers",
      "profilePicture": "https://...",
      "coverImage": "https://...",
      "tags": ["Technology", "Education"],
      "memberCount": 1250,
      "postCount": 342,
      "createdAt": "2024-01-15T12:00:00Z",
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
GET /communities?page=1&limit=20&search=tech&tags=Technology,Education
Authorization: Bearer <token> (optional)

Response 200:
{
  "success": true,
  "data": {
    "communities": [
      {
        "_id": "...",
        "name": "Tech Enthusiasts",
        "description": "A community for tech lovers",
        "profilePicture": "https://...",
        "coverImage": "https://...",
        "tags": ["Technology", "Education"],
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

- [ ] All 15 tasks completed (T051-T064, including T051B, T055B, T055C, T055D)
- [ ] All 159+ unit tests passing
- [ ] All 50+ integration tests passing
- [ ] Users can create communities with profile pictures, cover images, and tags
- [ ] Users can join/leave communities
- [ ] Members can post to communities
- [ ] Owners can edit community description and images
- [ ] Moderation system works (add/remove moderators)
- [ ] Community feed shows correct posts
- [ ] Permission checks enforced (owner-only edits)
- [ ] Community discovery functional with tag filtering
- [ ] Image upload and processing working (Sharp + Cloudinary)
- [ ] Cache invalidation working
- [ ] Constants added (COMMUNITY_TAGS and image specs)
- [ ] Feed controllers refactored to use real Community/Enrollment models
- [ ] API documentation complete (11 endpoints)
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
- [ ] Trending communities
- [ ] Recommended communities (based on interests)
- [ ] Community banners/additional customization
- [ ] Multiple tag support expansion beyond 20 predefined categories

---

## Dependencies

**Epic 1**: Authentication (checkAuth, optionalAuth middleware)  
**Epic 2**: User Profiles (User model, profile data)  
**Epic 3**: Posts (Post model, post controllers)  
**Epic 4**: File Upload (image upload middleware, Cloudinary integration)  
**Epic 5**: Feed Algorithm (community feed generation, cache invalidation, refactored controllers)

**NPM Packages:**
- `cloudinary` (^1.41.0) - Profile picture and cover image uploads
- `multer` (^1.4.5) - Multipart form data handling
- `sharp` (^0.33.0) - Image resizing and processing

**Constants Required:**
- `COMMUNITY_TAGS` - Array of 20 predefined tag categories
- `COMMUNITY_PROFILE_PICTURE_SIZE` - 500x500px dimensions
- `COMMUNITY_COVER_IMAGE_SIZE` - 1500x500px dimensions
- `MIN_COMMUNITY_TAGS` - Minimum 1 tag required
- `MAX_COMMUNITY_TAGS` - Maximum 3 tags allowed

---

**Epic Owner**: TBD  
**Review Date**: January 10, 2026  
**Status**: Not Started
