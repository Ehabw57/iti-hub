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

## Phase 2: User Story 1 - View User Profile

### T012: [US1] Implement Get User Profile Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 1.5 days  
**Depends On**: Epic 1, T011  
**Priority**: P0

**Target File:**
- `/server/controllers/userController.js`

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
File: `/server/spec/controllers/userController.spec.js`

```javascript
const { getUserProfile } = require('../../controllers/userController');
const User = require('../../models/User');
const Connection = require('../../models/Connection');
const mockResponse = require('../helpers/responseMock');

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
      resetPasswordToken: 'token'
    };
    spyOn(User, 'findById').and.returnValue(Promise.resolve(userWithSensitiveData));

    await getUserProfile(req, res);

    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.email).toBeUndefined();
    expect(res.body.data.resetPasswordToken).toBeUndefined();
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
**Depends On**: Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/userController.js`

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
File: `/server/spec/controllers/userController.spec.js`

```javascript
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
      body: { fullName: 'A' }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.fullName).toMatch(/at least 2 characters/i);
  });

  it('should return 400 if fullName too long', async () => {
    const req = {
      user: currentUser,
      body: { fullName: 'A'.repeat(101) }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.fullName).toMatch(/max.*100 characters/i);
  });

  it('should return 400 if bio too long', async () => {
    const req = {
      user: currentUser,
      body: { bio: 'A'.repeat(501) }
    };
    const res = mockResponse();

    await updateProfile(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.bio).toMatch(/max.*500 characters/i);
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

    expect(res.body.data.user.password).toBeUndefined();
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
**Depends On**: T011, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/connectionController.js` (new file)

**Function to Implement:**

**`followUser(req, res)`**
- **Input**:
  - `req.params.userId` (string) - user to follow
  - `req.user` (object) - current user
- **Output**: JSON response (200) or error (400/404/409/500)
- **Description**: Creates follow relationship

**Tests to Pass:**
File: `/server/spec/controllers/connectionController.spec.js`

```javascript
const { followUser, unfollowUser } = require('../../controllers/connectionController');
const User = require('../../models/User');
const Connection = require('../../models/Connection');
const mockResponse = require('../helpers/responseMock');

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
(Covered in T014 tests above)

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
**Depends On**: T011, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/userController.js`

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
async function getFollowers(req, res) {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

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
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('follower', 'username fullName profilePicture');

    const total = await Connection.countDocuments({
      following: userId,
      type: 'follow'
    });

    // Add isFollowing flag if authenticated
    const followers = await Promise.all(
      connections.map(async (conn) => {
        const follower = conn.follower;
        let isFollowing = false;
        
        if (req.user) {
          isFollowing = await Connection.isFollowing(req.user._id, follower._id);
        }

        return {
          id: follower._id,
          username: follower.username,
          fullName: follower.fullName,
          profilePicture: follower.profilePicture,
          isFollowing
        };
      })
    );

    res.status(200).json({
      success: true,
      data: followers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get followers' }
    });
  }
}
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
(Similar to T016)

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
**Depends On**: T011, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/connectionController.js`

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

## Phase 7: Routes & Integration

### T019: Create/Update User and Connection Routes
**Type**: Routes  
**Estimated Effort**: 0.5 days  
**Depends On**: T012-T018  
**Priority**: P0

**Target Files:**
- `/server/routes/userRoutes.js`
- `/server/routes/connectionRoutes.js` (new)

**Routes:**
```javascript
// userRoutes.js
GET /users/:userId (optionalAuth)
PATCH /users/me (checkAuth)
GET /users/:userId/followers (optionalAuth)
GET /users/:userId/following (optionalAuth)

// connectionRoutes.js
POST /users/:userId/follow (checkAuth)
DELETE /users/:userId/follow (checkAuth)
POST /users/:userId/block (checkAuth)
DELETE /users/:userId/block (checkAuth)
```

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

**Total Tasks**: 10 (T011-T020)  
**Estimated Total Effort**: 10-12 days  
**Dependencies**: Epic 1 (Authentication) must be complete

**Definition of Done:**
- [ ] All models, controllers, routes implemented
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Privacy and blocking logic works correctly
- [ ] Denormalized counts stay consistent
- [ ] API documentation updated
