# Epic 2: User Profiles & Social Features (P0)

**Priority**: P0 (MVP Critical)  
**Estimated Effort**: 10-12 days  
**Dependencies**: Epic 1 (Authentication) must be complete  
**Specifications**: `/docs/specs/API-Specification.md`, `/docs/specs/Database-Schema.md`

---

## User Stories

### US1: View User Profile
**As a** user  
**I want to** view other users' profiles  
**So that** I can learn about them and decide to follow  

**Acceptance Criteria:**
- Display username, full name, bio, profile picture, cover image
- Show specialization, location, and join date
- Display follower/following/post counts
- Show if current user is following this user
- Work with optionalAuth (limited data if not authenticated)

---

### US2: Update Own Profile
**As a** user  
**I want to** update my profile information  
**So that** I can keep my information current  

**Acceptance Criteria:**
- Update full name, bio, specialization, location
- Update profile picture and cover image URLs
- Cannot change email or username (requires separate flow)
- Validate all inputs
- Return updated profile

---

### US3: Follow/Unfollow Users
**As a** user  
**I want to** follow and unfollow other users  
**So that** I can see their content in my feed  

**Acceptance Criteria:**
- Create follow relationship in connections collection
- Update follower/following counts (denormalized)
- Cannot follow yourself
- Prevent duplicate follows
- Unfollow removes relationship and updates counts
- Idempotent operations

---

### US4: View Followers and Following Lists
**As a** user  
**I want to** see who follows me and who I follow  
**So that** I can manage my connections  

**Acceptance Criteria:**
- Paginated lists of followers and following
- Show profile picture, name, username for each
- Show if current user follows each person
- Sort by most recent first

---

### US5: Block/Unblock Users
**As a** user  
**I want to** block users who harass me  
**So that** they cannot interact with my content  

**Acceptance Criteria:**
- Create block relationship
- Automatically unfollow both ways
- Blocked users cannot see blocker's content
- Blocked users cannot interact with blocker
- Unblock reverses the block only

---

## Phase 1: Setup (Shared Infrastructure)

### T011: Create/Update Connection Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/models/Connection.js`

**Schema Definition:**
```javascript
{
  _id: ObjectId,
  follower: ObjectId,          // Ref: users (who follows)
  following: ObjectId,         // Ref: users (who is followed)
  type: String,                // Enum: "follow", "block"
  createdAt: Date,            // Timestamp
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Compound index for follow queries
{ follower: 1, following: 1, type: 1 } // Unique
{ following: 1, type: 1 }
{ follower: 1, type: 1 }
{ createdAt: -1 }
```

**Functions to Implement:**

1. **Static Method: `Connection.createFollow(followerId, followingId)`**
   - Input: `followerId` (ObjectId), `followingId` (ObjectId)
   - Output: Promise<Connection>
   - Description: Creates follow relationship, updates counts on both users

2. **Static Method: `Connection.removeFollow(followerId, followingId)`**
   - Input: `followerId` (ObjectId), `followingId` (ObjectId)
   - Output: Promise<boolean>
   - Description: Removes follow relationship, updates counts

3. **Static Method: `Connection.createBlock(blockerId, blockedId)`**
   - Input: `blockerId` (ObjectId), `blockedId` (ObjectId)
   - Output: Promise<Connection>
   - Description: Creates block, removes follows in both directions

4. **Static Method: `Connection.removeBlock(blockerId, blockedId)`**
   - Input: `blockerId` (ObjectId), `blockedId` (ObjectId)
   - Output: Promise<boolean>
   - Description: Removes block relationship

5. **Static Method: `Connection.isFollowing(followerId, followingId)`**
   - Input: `followerId` (ObjectId), `followingId` (ObjectId)
   - Output: Promise<boolean>
   - Description: Checks if follow relationship exists

6. **Static Method: `Connection.isBlocking(blockerId, blockedId)`**
   - Input: `blockerId` (ObjectId), `blockedId` (ObjectId)
   - Output: Promise<boolean>
   - Description: Checks if block relationship exists

**Tests to Pass:**
File: `/server/spec/models/connectionModel.spec.js`

```javascript
const Connection = require('../../models/Connection');
const User = require('../../models/User');
const { connectDB, closeDB, clearDB } = require('../helpers/DBUtils');

describe('Connection Model', () => {
  let user1, user2;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
    user1 = await User.create({
      email: 'user1@example.com',
      password: 'Password123',
      username: 'user1',
      fullName: 'User One',
      followersCount: 0,
      followingCount: 0
    });
    user2 = await User.create({
      email: 'user2@example.com',
      password: 'Password123',
      username: 'user2',
      fullName: 'User Two',
      followersCount: 0,
      followingCount: 0
    });
  });

  describe('createFollow', () => {
    it('should create follow relationship', async () => {
      const connection = await Connection.createFollow(user1._id, user2._id);
      
      expect(connection.follower.toString()).toBe(user1._id.toString());
      expect(connection.following.toString()).toBe(user2._id.toString());
      expect(connection.type).toBe('follow');
    });

    it('should update follower and following counts', async () => {
      await Connection.createFollow(user1._id, user2._id);
      
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      
      expect(updatedUser1.followingCount).toBe(1);
      expect(updatedUser2.followersCount).toBe(1);
    });

    it('should prevent duplicate follows', async () => {
      await Connection.createFollow(user1._id, user2._id);
      
      try {
        await Connection.createFollow(user1._id, user2._id);
        fail('Should throw error for duplicate follow');
      } catch (error) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error
      }
    });

    it('should not allow following yourself', async () => {
      try {
        await Connection.createFollow(user1._id, user1._id);
        fail('Should throw error for self-follow');
      } catch (error) {
        expect(error.message).toMatch(/cannot follow yourself/i);
      }
    });
  });

  describe('removeFollow', () => {
    beforeEach(async () => {
      await Connection.createFollow(user1._id, user2._id);
    });

    it('should remove follow relationship', async () => {
      const result = await Connection.removeFollow(user1._id, user2._id);
      expect(result).toBe(true);
      
      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });
      expect(connection).toBeNull();
    });

    it('should update follower and following counts', async () => {
      await Connection.removeFollow(user1._id, user2._id);
      
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      
      expect(updatedUser1.followingCount).toBe(0);
      expect(updatedUser2.followersCount).toBe(0);
    });

    it('should return false if connection does not exist', async () => {
      const result = await Connection.removeFollow(user2._id, user1._id);
      expect(result).toBe(false);
    });
  });

  describe('createBlock', () => {
    it('should create block relationship', async () => {
      const connection = await Connection.createBlock(user1._id, user2._id);
      
      expect(connection.follower.toString()).toBe(user1._id.toString());
      expect(connection.following.toString()).toBe(user2._id.toString());
      expect(connection.type).toBe('block');
    });

    it('should remove existing follow relationships in both directions', async () => {
      await Connection.createFollow(user1._id, user2._id);
      await Connection.createFollow(user2._id, user1._id);
      
      await Connection.createBlock(user1._id, user2._id);
      
      const follow1 = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });
      const follow2 = await Connection.findOne({
        follower: user2._id,
        following: user1._id,
        type: 'follow'
      });
      
      expect(follow1).toBeNull();
      expect(follow2).toBeNull();
    });

    it('should not allow blocking yourself', async () => {
      try {
        await Connection.createBlock(user1._id, user1._id);
        fail('Should throw error for self-block');
      } catch (error) {
        expect(error.message).toMatch(/cannot block yourself/i);
      }
    });
  });

  describe('isFollowing', () => {
    it('should return true if following', async () => {
      await Connection.createFollow(user1._id, user2._id);
      const isFollowing = await Connection.isFollowing(user1._id, user2._id);
      expect(isFollowing).toBe(true);
    });

    it('should return false if not following', async () => {
      const isFollowing = await Connection.isFollowing(user1._id, user2._id);
      expect(isFollowing).toBe(false);
    });
  });

  describe('isBlocking', () => {
    it('should return true if blocking', async () => {
      await Connection.createBlock(user1._id, user2._id);
      const isBlocking = await Connection.isBlocking(user1._id, user2._id);
      expect(isBlocking).toBe(true);
    });

    it('should return false if not blocking', async () => {
      const isBlocking = await Connection.isBlocking(user1._id, user2._id);
      expect(isBlocking).toBe(false);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] Connection model created with proper schema
- [ ] All indexes defined
- [ ] All static methods implemented
- [ ] Count updates work correctly
- [ ] Duplicate prevention works
- [ ] All tests pass

---

## Phase 1.5: Shared Utilities (Foundation)

### T011b: [P] Create User Profile Utilities
**Type**: Utility  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/utils/userHelpers.js`

**Functions to Implement:**

1. **`sanitizeUserProfile(user, includeEmail = false)`**
   - Input: `user` (User object), `includeEmail` (boolean)
   - Output: Sanitized user object (excludes sensitive fields)
   - Description: Removes password, reset tokens, and optionally email

2. **`checkUserBlocked(currentUserId, targetUserId)`**
   - Input: `currentUserId` (ObjectId), `targetUserId` (ObjectId)
   - Output: Promise<{ isBlocked: boolean, blockedBy: string | null }>
   - Description: Checks if either user has blocked the other

3. **`validateProfileUpdate(updateData)`**
   - Input: `updateData` (object with profile fields)
   - Output: `{ valid: boolean, errors: object, validData: object }`
   - Description: Validates profile update fields (fullName, bio, URLs, etc.)

4. **`buildProfileResponse(user, currentUserId = null)`**
   - Input: `user` (User object), `currentUserId` (ObjectId, optional)
   - Output: Promise<object> with sanitized profile + isFollowing flag
   - Description: Builds consistent profile response with relationship status

**Acceptance Criteria:**
- [ ] Sanitization removes all sensitive fields
- [ ] Block checking works in both directions
- [ ] Validation uses constants from constants.js
- [ ] Profile response is consistent across endpoints
- [ ] Reusable across all profile-related controllers

---

### T011c: [P] Create Connection Helper Utilities
**Type**: Utility  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/utils/connectionHelpers.js`

**Functions to Implement:**

1. **`validateConnectionAction(currentUserId, targetUserId, action)`**
   - Input: `currentUserId`, `targetUserId`, `action` (string: 'follow' | 'block')
   - Output: `{ valid: boolean, error: string | null }`
   - Description: Validates connection actions (cannot follow/block self, etc.)

2. **`buildConnectionList(connections, currentUserId = null, populateField = 'follower')`**
   - Input: `connections` (array), `currentUserId`, `populateField`
   - Output: Promise<array> with user data + isFollowing flags
   - Description: Generic function to build follower/following lists

3. **`checkMutualBlock(userId1, userId2)`**
   - Input: `userId1` (ObjectId), `userId2` (ObjectId)
   - Output: Promise<boolean>
   - Description: Checks if users have blocked each other

**Acceptance Criteria:**
- [ ] Validation prevents self-follows and self-blocks
- [ ] Connection list builder works for both followers and following
- [ ] Efficiently checks relationships
- [ ] Reusable across connection controllers

---

### T011d: [P] Update Constants File for User Profiles
**Type**: Utility  
**User Story**: Foundation  
**Estimated Effort**: 0.25 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/utils/constants.js` (update existing from Epic 3)

**New Constants to Add:**

```javascript
// Profile validation constants
const MIN_FULL_NAME_LENGTH = 2;
const MAX_FULL_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_SPECIALIZATION_LENGTH = 100;
const MAX_LOCATION_LENGTH = 100;

// Connection constants
const CONNECTION_TYPES = ['follow', 'block'];

// User profile fields to exclude
const SENSITIVE_USER_FIELDS = [
  'password',
  'passwordResetToken',
  'passwordResetExpires',
  '__v'
];

const PUBLIC_USER_FIELDS = [
  '_id',
  'username',
  'fullName',
  'bio',
  'profilePicture',
  'coverImage',
  'specialization',
  'location',
  'followersCount',
  'followingCount',
  'postsCount',
  'role',
  'createdAt',
  'lastSeen'
];

module.exports = {
  // ... existing constants from Epic 3 ...
  
  // Profile constants
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_SPECIALIZATION_LENGTH,
  MAX_LOCATION_LENGTH,
  
  // Connection constants
  CONNECTION_TYPES,
  
  // User field constants
  SENSITIVE_USER_FIELDS,
  PUBLIC_USER_FIELDS
};
```

**Acceptance Criteria:**
- [ ] All magic numbers centralized
- [ ] Field lists defined
- [ ] Easy to reference in tests
- [ ] Compatible with Epic 3 constants

---

## Phase 2: User Story 1 - View User Profile

### T012: [US1] Implement Get User Profile Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 1.5 days  
**Depends On**: Epic 1, T011, T011b, T011c, T011d  
**Priority**: P0

**Target File:**
- `/server/controllers/user/getUserProfileController.js`

**Utility Dependencies:**
- `/server/utils/userHelpers.js` (for sanitizeUserProfile, checkUserBlocked, buildProfileResponse)
- `/server/utils/constants.js` (for SENSITIVE_USER_FIELDS, PUBLIC_USER_FIELDS)

**Function to Implement:**

**`getUserProfile(req, res)`**
- **Input**: 
  - `req.params.userId` (string)
  - `req.user` (object, optional - from optionalAuth)
- **Output**: JSON response with user profile (200) or error (404/500)
- **Description**: Gets user profile with privacy considerations

**Implementation Steps:**
1. Validate userId parameter
2. Find user by ID (exclude sensitive fields)
3. If requester is authenticated:
   - Check if following
   - Check if blocked (hide profile if blocked)
4. Return user profile with computed fields

**Tests to Pass:**
File: `/server/spec/controllers/user/getUserProfileController.spec.js`

```javascript
const { getUserProfile } = require('../../../controllers/user/getUserProfileController');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const mockResponse = require('../../helpers/responseMock');
const { SENSITIVE_USER_FIELDS } = require('../../../utils/constants');

describe('getUserProfile', () => {
  let targetUser;

  beforeEach(() => {
    targetUser = {
      _id: 'targetUserId',
      username: 'targetuser',
      fullName: 'Target User',
      bio: 'This is my bio',
      profilePicture: 'https://...',
      coverImage: 'https://...',
      specialization: 'Web Developer',
      location: 'Cairo, Egypt',
      followersCount: 100,
      followingCount: 50,
      postsCount: 25,
      createdAt: new Date()
    };
  });

  it('should return 404 if user not found', async () => {
    const req = { params: { userId: 'nonexistent' } };
    const res = mockResponse();
    spyOn(User, 'findById').and.returnValue(Promise.resolve(null));

    await getUserProfile(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('should return user profile without authentication', async () => {
    const req = { params: { userId: 'targetUserId' } };
    const res = mockResponse();
    spyOn(User, 'findById').and.returnValue(Promise.resolve(targetUser));

    await getUserProfile(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.username).toBe('targetuser');
    expect(res.body.data.isFollowing).toBeUndefined();
  });

  it('should include isFollowing when authenticated', async () => {
    const req = {
      params: { userId: 'targetUserId' },
      user: { _id: 'currentUserId' }
    };
    const res = mockResponse();
    spyOn(User, 'findById').and.returnValue(Promise.resolve(targetUser));
    spyOn(Connection, 'isFollowing').and.returnValue(Promise.resolve(true));

    await getUserProfile(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isFollowing).toBe(true);
  });

  it('should hide profile if blocked by target user', async () => {
    const req = {
      params: { userId: 'targetUserId' },
      user: { _id: 'currentUserId' }
    };
    const res = mockResponse();
    spyOn(User, 'findById').and.returnValue(Promise.resolve(targetUser));
    spyOn(Connection, 'isBlocking').and.returnValue(Promise.resolve(true));

    await getUserProfile(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('USER_BLOCKED');
  });

  it('should not include sensitive fields', async () => {
    const req = { params: { userId: 'targetUserId' } };
    const res = mockResponse();
    const userWithSensitiveData = {
      ...targetUser,
      password: 'hashedPassword',
      email: 'target@example.com',
      passwordResetToken: 'token',
      passwordResetExpires: new Date()
    };
    spyOn(User, 'findById').and.returnValue(Promise.resolve(userWithSensitiveData));

    await getUserProfile(req, res);

    // Use constants instead of hardcoded field names
    SENSITIVE_USER_FIELDS.forEach(field => {
      expect(res.body.data[field]).toBeUndefined();
    });
  });

  it('should work for viewing own profile', async () => {
    const req = {
      params: { userId: 'currentUserId' },
      user: { _id: 'currentUserId' }
    };
    const res = mockResponse();
    const currentUser = { ...targetUser, _id: 'currentUserId' };
    spyOn(User, 'findById').and.returnValue(Promise.resolve(currentUser));

    await getUserProfile(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isFollowing).toBe(false); // Not following yourself
  });
});
```

**Acceptance Criteria:**
- [ ] Returns user profile with all public fields
- [ ] Works with and without authentication
- [ ] Shows isFollowing flag when authenticated
- [ ] Respects blocking relationships
- [ ] Excludes sensitive fields
- [ ] All tests pass

---

## Phase 3: User Story 2 - Update Own Profile

### T013: [US2] Implement Update Profile Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1 day  
**Depends On**: Epic 1, T011b, T011d  
**Priority**: P0

**Target File:**
- `/server/controllers/user/updateProfileController.js`

**Utility Dependencies:**
- `/server/utils/userHelpers.js` (for validateProfileUpdate, sanitizeUserProfile)
- `/server/utils/validation.js` (for validateImageUrls - reuse from Epic 3)
- `/server/utils/constants.js` (for validation limits)

**Function to Implement:**

**`updateProfile(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
  - `req.body.fullName` (string, optional)
  - `req.body.bio` (string, optional)
  - `req.body.specialization` (string, optional)
  - `req.body.location` (string, optional)
  - `req.body.profilePicture` (string, optional)
  - `req.body.coverImage` (string, optional)
- **Output**: JSON response with updated user (200) or error (400/500)
- **Description**: Updates user profile fields with validation

**Implementation Steps:**
1. Get current user from req.user
2. Validate each provided field
3. Update only provided fields
4. Save user
5. Return updated user (without sensitive fields)

**Tests to Pass:**
File: `/server/spec/controllers/user/updateProfileController.spec.js`

```javascript
const { updateProfile } = require('../../../controllers/user/updateProfileController');
const User = require('../../../models/User');
const mockResponse = require('../../helpers/responseMock');
const {
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH,
  SENSITIVE_USER_FIELDS
} = require('../../../utils/constants');

describe('updateProfile', () => {
  let currentUser;

  beforeEach(() => {
    currentUser = {
      _id: 'currentUserId',
      username: 'currentuser',
      email: 'current@example.com',
      fullName: 'Current User',
      bio: 'Old bio',
      specialization: 'Old specialization',
      location: 'Old location',
      profilePicture: 'https://old.url',
      coverImage: 'https://old-cover.url',
      save: jasmine.createSpy().and.callFake(function() {
        return Promise.resolve(this);
      }),
      toObject: function() {
        const { password, ...rest } = this;
        return rest;
      }
    };
  });

  it('should update fullName', async () => {
    const req = {
      user: currentUser,
      body: { fullName: 'Updated Name' }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(currentUser.fullName).toBe('Updated Name');
    expect(currentUser.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.fullName).toBe('Updated Name');
  });

  it('should update bio', async () => {
    const req = {
      user: currentUser,
      body: { bio: 'New bio text' }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(currentUser.bio).toBe('New bio text');
  });

  it('should update multiple fields at once', async () => {
    const req = {
      user: currentUser,
      body: {
        fullName: 'New Name',
        bio: 'New bio',
        specialization: 'New specialization',
        location: 'New location'
      }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(currentUser.fullName).toBe('New Name');
    expect(currentUser.bio).toBe('New bio');
    expect(currentUser.specialization).toBe('New specialization');
    expect(currentUser.location).toBe('New location');
  });

  it('should return 400 if fullName too short', async () => {
    const req = {
      user: currentUser,
      body: { fullName: 'A'.repeat(MIN_FULL_NAME_LENGTH - 1) }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.fullName).toMatch(
      new RegExp(`at least ${MIN_FULL_NAME_LENGTH} characters`, 'i')
    );
  });

  it('should return 400 if fullName too long', async () => {
    const req = {
      user: currentUser,
      body: { fullName: 'A'.repeat(MAX_FULL_NAME_LENGTH + 1) }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.fullName).toMatch(
      new RegExp(`max.*${MAX_FULL_NAME_LENGTH} characters`, 'i')
    );
  });

  it('should return 400 if bio too long', async () => {
    const req = {
      user: currentUser,
      body: { bio: 'A'.repeat(MAX_BIO_LENGTH + 1) }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.bio).toMatch(
      new RegExp(`max.*${MAX_BIO_LENGTH} characters`, 'i')
    );
  });

  it('should return 400 if profile picture URL invalid', async () => {
    const req = {
      user: currentUser,
      body: { profilePicture: 'not-a-url' }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.profilePicture).toMatch(/invalid url/i);
  });

  it('should not allow updating email or username', async () => {
    const req = {
      user: currentUser,
      body: {
        email: 'newemail@example.com',
        username: 'newusername'
      }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(currentUser.email).toBe('current@example.com');
    expect(currentUser.username).toBe('currentuser');
    expect(res.statusCode).toBe(200); // Silently ignore or 400
  });

  it('should not include password in response', async () => {
    const req = {
      user: currentUser,
      body: { fullName: 'Updated' }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    // Use constants to check all sensitive fields are excluded
    SENSITIVE_USER_FIELDS.forEach(field => {
      expect(res.body.data.user[field]).toBeUndefined();
    });
  });

  it('should return 200 with no changes if body empty', async () => {
    const req = {
      user: currentUser,
      body: {}
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(200);
    expect(currentUser.save).not.toHaveBeenCalled();
  });
});
```

**Acceptance Criteria:**
- [ ] Updates only allowed fields
- [ ] Validates all inputs
- [ ] Does not allow email/username changes
- [ ] Returns updated user without sensitive fields
- [ ] Handles empty update gracefully
- [ ] All tests pass

---

## Phase 4: User Story 3 - Follow/Unfollow

### T014: [US3] Implement Follow User Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 1.5 days  
**Depends On**: T011, T011c, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/connection/followController.js`

**Utility Dependencies:**
- `/server/utils/connectionHelpers.js` (for validateConnectionAction, checkMutualBlock)
- `/server/utils/constants.js` (for CONNECTION_TYPES)

**Function to Implement:**

**`followUser(req, res)`**
- **Input**:
  - `req.params.userId` (string) - user to follow
  - `req.user` (object) - current user
- **Output**: JSON response (200) or error (400/404/409/500)
- **Description**: Creates follow relationship

**Tests to Pass:**
File: `/server/spec/controllers/connection/followController.spec.js`

```javascript
const { followUser, unfollowUser } = require('../../../controllers/connection/followController');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const mockResponse = require('../../helpers/responseMock');

describe('Connection Controller', () => {
  describe('followUser', () => {
    it('should return 400 if trying to follow yourself', async () => {
      const req = {
        params: { userId: 'user123' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();

      await followUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toMatch(/cannot follow yourself/i);
    });

    it('should return 404 if target user not found', async () => {
      const req = {
        params: { userId: 'nonexistent' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();
      spyOn(User, 'findById').and.returnValue(Promise.resolve(null));

      await followUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 409 if already following', async () => {
      const req = {
        params: { userId: 'user456' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();
      spyOn(User, 'findById').and.returnValue(Promise.resolve({ _id: 'user456' }));
      spyOn(Connection, 'isFollowing').and.returnValue(Promise.resolve(true));

      await followUser(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_FOLLOWING');
    });

    it('should return 403 if target user blocked current user', async () => {
      const req = {
        params: { userId: 'user456' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();
      spyOn(User, 'findById').and.returnValue(Promise.resolve({ _id: 'user456' }));
      spyOn(Connection, 'isFollowing').and.returnValue(Promise.resolve(false));
      spyOn(Connection, 'isBlocking').and.returnValue(Promise.resolve(true));

      await followUser(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('USER_BLOCKED');
    });

    it('should create follow relationship successfully', async () => {
      const req = {
        params: { userId: 'user456' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();
      const targetUser = { _id: 'user456', followersCount: 10 };
      spyOn(User, 'findById').and.returnValue(Promise.resolve(targetUser));
      spyOn(Connection, 'isFollowing').and.returnValue(Promise.resolve(false));
      spyOn(Connection, 'isBlocking').and.returnValue(Promise.resolve(false));
      spyOn(Connection, 'createFollow').and.returnValue(Promise.resolve({
        follower: 'user123',
        following: 'user456',
        type: 'follow'
      }));

      await followUser(req, res);

      expect(Connection.createFollow).toHaveBeenCalledWith('user123', 'user456');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.isFollowing).toBe(true);
      expect(res.body.data.followersCount).toBe(11);
    });
  });

  describe('unfollowUser', () => {
    it('should return 400 if trying to unfollow yourself', async () => {
      const req = {
        params: { userId: 'user123' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toMatch(/cannot unfollow yourself/i);
    });

    it('should return 404 if target user not found', async () => {
      const req = {
        params: { userId: 'nonexistent' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();
      spyOn(User, 'findById').and.returnValue(Promise.resolve(null));

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should be idempotent - unfollow when not following', async () => {
      const req = {
        params: { userId: 'user456' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();
      const targetUser = { _id: 'user456', followersCount: 10 };
      spyOn(User, 'findById').and.returnValue(Promise.resolve(targetUser));
      spyOn(Connection, 'removeFollow').and.returnValue(Promise.resolve(false));

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isFollowing).toBe(false);
    });

    it('should remove follow relationship successfully', async () => {
      const req = {
        params: { userId: 'user456' },
        user: { _id: 'user123' }
      };
      const res = mockResponse();
      const targetUser = { _id: 'user456', followersCount: 11 };
      spyOn(User, 'findById').and.returnValue(Promise.resolve(targetUser));
      spyOn(Connection, 'removeFollow').and.returnValue(Promise.resolve(true));

      await unfollowUser(req, res);

      expect(Connection.removeFollow).toHaveBeenCalledWith('user123', 'user456');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.isFollowing).toBe(false);
      expect(res.body.data.followersCount).toBe(10);
    });
  });
});
```

---

### T015: [US3] Implement Unfollow User Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: Included in T014  
**Depends On**: T011, T011c, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/connection/followController.js` (same file as T014)

**Note**: Both follow and unfollow are in the same controller file as they share logic.

(Tests covered in T014 above)

**Acceptance Criteria for T014 & T015:**
- [ ] Follow creates connection and updates counts
- [ ] Cannot follow yourself
- [ ] Cannot follow if blocked
- [ ] Duplicate follows prevented
- [ ] Unfollow removes connection and updates counts
- [ ] Unfollow is idempotent
- [ ] All tests pass

---

## Phase 5: User Story 4 - View Followers/Following

### T016: [US4] Implement Get Followers Controller
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 1 day  
**Depends On**: T011, T011c, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/user/getFollowersController.js`

**Utility Dependencies:**
- `/server/utils/connectionHelpers.js` (for buildConnectionList)
- `/server/utils/pagination.js` (reuse from Epic 3)
- `/server/utils/constants.js` (for DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT)

**Function to Implement:**

**`getFollowers(req, res)`**
- **Input**:
  - `req.params.userId` (string)
  - `req.user` (object, optional)
  - `req.query.page` (number, default: 1)
  - `req.query.limit` (number, default: 20, max: 100)
- **Output**: Paginated list of followers (200) or error (404/500)

**Implementation:**
```javascript
const Connection = require('../../models/Connection');
const User = require('../../models/User');
const { buildConnectionList } = require('../../utils/connectionHelpers');
const { buildPaginationQuery, buildPaginationResponse } = require('../../utils/pagination');

async function getFollowers(req, res) {
  try {
    const { userId } = req.params;
    const { skip, limit, sort } = buildPaginationQuery(req, {
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Get followers
    const connections = await Connection.find({
      following: userId,
      type: 'follow'
    })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('follower', 'username fullName profilePicture');

    const total = await Connection.countDocuments({
      following: userId,
      type: 'follow'
    });

    // Build response with isFollowing flags using utility
    const followers = await buildConnectionList(
      connections,
      req.user?._id,
      'follower'
    );

    const response = buildPaginationResponse(
      followers,
      total,
      req.query.page,
      limit
    );

    res.status(200).json({
      success: true,
      ...response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get followers' }
    });
  }
}

module.exports = { getFollowers };
```

**Tests:** (Similar structure for getFollowing)

```javascript
describe('getFollowers', () => {
  it('should return paginated list of followers', async () => {
    // Test implementation
  });

  it('should include isFollowing flag when authenticated', async () => {
    // Test implementation
  });

  it('should respect pagination parameters', async () => {
    // Test implementation
  });

  it('should return 404 if user not found', async () => {
    // Test implementation
  });
});
```

---

### T017: [US4] Implement Get Following Controller
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 0.5 days  
**Depends On**: T011, T011c, T016, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/user/getFollowingController.js`

**Utility Dependencies:**
- `/server/utils/connectionHelpers.js` (for buildConnectionList)
- `/server/utils/pagination.js` (reuse from Epic 3)

**Note**: Implementation is nearly identical to T016, but queries `follower: userId` instead of `following: userId`, and populates `'following'` field instead of `'follower'`.

(Similar to T016, uses buildConnectionList utility with `populateField = 'following'`)

**Acceptance Criteria for T016 & T017:**
- [ ] Returns paginated lists
- [ ] Includes user info for each connection
- [ ] Shows isFollowing flag when authenticated
- [ ] Respects page and limit params
- [ ] All tests pass

---

## Phase 6: User Story 5 - Block/Unblock

### T018: [US5] Implement Block/Unblock Controllers
**Type**: Controller  
**User Story**: US5  
**Estimated Effort**: 1.5 days  
**Depends On**: T011, T011c, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/connection/blockController.js`

**Utility Dependencies:**
- `/server/utils/connectionHelpers.js` (for validateConnectionAction)
- `/server/utils/constants.js` (for CONNECTION_TYPES)

**Functions to Implement:**

1. **`blockUser(req, res)`**
2. **`unblockUser(req, res)`**

**Tests:**
```javascript
describe('blockUser', () => {
  it('should create block and remove follows', async () => {
    // Test implementation
  });

  it('should not allow blocking yourself', async () => {
    // Test implementation
  });
});

describe('unblockUser', () => {
  it('should remove block relationship', async () => {
    // Test implementation
  });

  it('should be idempotent', async () => {
    // Test implementation
  });
});
```

**Acceptance Criteria:**
- [ ] Block creates block relationship
- [ ] Block removes follows in both directions
- [ ] Cannot block yourself
- [ ] Unblock removes block
- [ ] All tests pass

---

### T018b: [P] Create Controller Index Files
**Type**: Structure  
**User Story**: Foundation  
**Estimated Effort**: 0.25 days  
**Can Run in Parallel**: No  
**Priority**: P0

**Target Files:**
- `/server/controllers/user/index.js`
- `/server/controllers/connection/index.js`

**Purpose:** Export all controller functions from their respective folders for clean imports

**Example `/server/controllers/user/index.js`:**
```javascript
const { getUserProfile } = require('./getUserProfileController');
const { updateProfile } = require('./updateProfileController');
const { getFollowers } = require('./getFollowersController');
const { getFollowing } = require('./getFollowingController');

module.exports = {
  getUserProfile,
  updateProfile,
  getFollowers,
  getFollowing
};
```

**Example `/server/controllers/connection/index.js`:**
```javascript
const { followUser, unfollowUser } = require('./followController');
const { blockUser, unblockUser } = require('./blockController');

module.exports = {
  followUser,
  unfollowUser,
  blockUser,
  unblockUser
};
```

**Acceptance Criteria:**
- [ ] Clean imports in routes: `require('./controllers/user')`
- [ ] All functions exported
- [ ] Consistent with Epic 1 and Epic 3 patterns

---

## Phase 7: Routes & Integration

### T019: Create/Update User and Connection Routes
**Type**: Routes  
**Estimated Effort**: 0.5 days  
**Depends On**: T012-T018b  
**Priority**: P0

**Target Files:**
- `/server/routes/userRoutes.js` (update existing)
- `/server/routes/connectionRoutes.js` (new)

**Routes:**
```javascript
// userRoutes.js
const express = require('express');
const router = express.Router();
const { checkAuth, optionalAuth } = require('../middlewares/checkAuth');
const {
  getUserProfile,
  updateProfile,
  getFollowers,
  getFollowing
} = require('../controllers/user'); // Clean import from index.js

router.get('/:userId', optionalAuth, getUserProfile);
router.patch('/me', checkAuth, updateProfile);
router.get('/:userId/followers', optionalAuth, getFollowers);
router.get('/:userId/following', optionalAuth, getFollowing);

module.exports = router;

// connectionRoutes.js
const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middlewares/checkAuth');
const {
  followUser,
  unfollowUser,
  blockUser,
  unblockUser
} = require('../controllers/connection'); // Clean import from index.js

router.post('/users/:userId/follow', checkAuth, followUser);
router.delete('/users/:userId/follow', checkAuth, unfollowUser);
router.post('/users/:userId/block', checkAuth, blockUser);
router.delete('/users/:userId/block', checkAuth, unblockUser);

module.exports = router;
```

**app.js Updates:**
```javascript
const userRoute = require('./routes/userRoutes');
const connectionRoute = require('./routes/connectionRoutes');

app.use('/users', userRoute);
app.use('/', connectionRoute); // Mount at root for /users/:userId/follow paths
```

**Acceptance Criteria:**
- [ ] All routes properly defined
- [ ] Correct middleware applied
- [ ] Clean controller imports
- [ ] Routes mounted in app.js
- [ ] All endpoints accessible

---

### T020: Create User Profile Integration Tests
**Type**: Testing  
**Estimated Effort**: 1 day  
**Depends On**: T012-T019  
**Priority**: P0

**Target File:**
- `/server/spec/integration/userProfile.integration.spec.js`

**Test Scenarios:**
- Complete follow/unfollow flow
- Profile update flow
- Block user flow
- View followers/following with pagination

---

## Summary

**Total Tasks**: 14 (T011-T020)
- **Models**: 1 task (T011)
- **Utilities**: 3 tasks (T011b, T011c, T011d)
- **User Controllers**: 4 tasks (T012, T013, T016, T017)
- **Connection Controllers**: 3 tasks (T014, T015, T018)
- **Structure**: 1 task (T018b)
- **Routes & Testing**: 2 tasks (T019, T020)

**Estimated Total Effort**: 11-13 days  
**Dependencies**: Epic 1 (Authentication) must be complete

**File Structure:**
```
server/
├── controllers/
│   ├── user/
│   │   ├── index.js (exports all)
│   │   ├── getUserProfileController.js
│   │   ├── updateProfileController.js
│   │   ├── getFollowersController.js
│   │   └── getFollowingController.js
│   └── connection/
│       ├── index.js (exports all)
│       ├── followController.js (follow + unfollow)
│       └── blockController.js (block + unblock)
├── utils/
│   ├── userHelpers.js (profile utilities)
│   ├── connectionHelpers.js (connection utilities)
│   ├── pagination.js (reused from Epic 3)
│   ├── validation.js (reused from Epic 3)
│   └── constants.js (updated with profile constants)
├── models/
│   ├── User.js (updated with profile fields)
│   └── Connection.js (new)
└── routes/
    ├── userRoutes.js (updated)
    └── connectionRoutes.js (new)
```

**Parallel Opportunities:**
- Phase 1.5: T011b, T011c, T011d (all utilities in parallel)
- Phase 2-6: Controllers can be worked on in parallel after utilities complete
- T018b must wait until all controllers are complete

**Benefits of This Structure:**
1. **Maintainability**: Each controller file is focused and < 150 lines
2. **Reusability**: 
   - buildConnectionList works for both followers and following
   - Pagination utilities reused from Epic 3
   - Validation utilities reused from Epic 3
3. **Testability**: Easier to test individual functions, utilities tested once
4. **Consistency**: Follows Epic 1 and Epic 3 patterns
5. **DRY**: No code duplication between followers/following logic
6. **Magic Numbers**: All limits use constants, easy to change in tests

**Code Reuse from Epic 3:**
- ✅ `pagination.js` - buildPaginationQuery, buildPaginationResponse
- ✅ `validation.js` - validateImageUrls for profile/cover pictures
- ✅ `constants.js` - Extended with profile-specific constants

**Definition of Done:**
- [ ] All models, controllers, routes implemented
- [ ] All utility functions tested and working
- [ ] All unit tests passing (use constants, not magic numbers)
- [ ] All integration tests passing
- [ ] Privacy and blocking logic works correctly
- [ ] Denormalized counts stay consistent
- [ ] API documentation updated
- [ ] Code follows Epic 1 and Epic 3 patterns
- [ ] Tests use constants instead of hardcoded values
