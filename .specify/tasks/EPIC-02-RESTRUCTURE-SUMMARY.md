# Epic 2: User Profiles & Social Features - Structure Restructure Summary

**Date**: December 13, 2025  
**Epic**: Epic 2 - User Profiles & Social Features  
**Status**: Planning Phase - Structure Updated

---

## Overview

Epic 2 has been restructured to follow the modular pattern established in Epic 1 (Authentication) and Epic 3 (Posts & Comments). Controllers have been split into focused files, common functionality extracted into utilities, and **all magic numbers replaced with constants** to prevent test failures when limits change.

---

## Key Changes

### 1. Controller File Structure

**Before:**
```
server/controllers/
├── userController.js (would contain 4+ functions, 400+ lines)
│   ├── getUserProfile
│   ├── updateProfile
│   ├── getFollowers
│   └── getFollowing
└── connectionController.js (would contain 4+ functions, 300+ lines)
    ├── followUser
    ├── unfollowUser
    ├── blockUser
    └── unblockUser
```

**After:**
```
server/controllers/
├── user/
│   ├── index.js (exports all)
│   ├── getUserProfileController.js (~120 lines)
│   ├── updateProfileController.js (~100 lines)
│   ├── getFollowersController.js (~80 lines)
│   └── getFollowingController.js (~80 lines)
└── connection/
    ├── index.js (exports all)
    ├── followController.js (~150 lines - follow + unfollow)
    └── blockController.js (~120 lines - block + unblock)
```

### 2. New Utility Files

Created **3 new utility files** and updated 1 existing file:

#### `/server/utils/userHelpers.js` (New)
- `sanitizeUserProfile(user, includeEmail)` - Remove sensitive fields consistently
- `checkUserBlocked(currentUserId, targetUserId)` - Bidirectional block check
- `validateProfileUpdate(updateData)` - Profile field validation
- `buildProfileResponse(user, currentUserId)` - Consistent profile response

**Reused by**: getUserProfileController, updateProfileController

**Key Benefit**: Consistent user data sanitization across all endpoints!

---

#### `/server/utils/connectionHelpers.js` (New)
- `validateConnectionAction(currentUserId, targetUserId, action)` - Prevent self-follow/block
- `buildConnectionList(connections, currentUserId, populateField)` - **Generic list builder**
- `checkMutualBlock(userId1, userId2)` - Bidirectional block check

**Reused by**: followController, blockController, getFollowersController, getFollowingController

**Key Benefit**: Single implementation works for BOTH followers and following lists!

---

#### `/server/utils/constants.js` (Updated)
**New Constants Added:**
```javascript
// Profile validation
MIN_FULL_NAME_LENGTH = 2
MAX_FULL_NAME_LENGTH = 100
MAX_BIO_LENGTH = 500
MAX_SPECIALIZATION_LENGTH = 100
MAX_LOCATION_LENGTH = 100

// Connection types
CONNECTION_TYPES = ['follow', 'block']

// User field lists
SENSITIVE_USER_FIELDS = ['password', 'passwordResetToken', ...]
PUBLIC_USER_FIELDS = ['_id', 'username', 'fullName', ...]
```

**Reused by**: ALL controllers, ALL tests

**Key Benefit**: Change limits once, tests automatically adapt!

---

#### Utilities Reused from Epic 3
- ✅ `/server/utils/pagination.js` - buildPaginationQuery, buildPaginationResponse
- ✅ `/server/utils/validation.js` - validateImageUrls (for profile pictures)

**Cross-Epic Reuse**: Utilities are now shared infrastructure!

---

## Task Count Changes

**Original Plan**: 10 tasks (T011-T020)  
**Updated Plan**: 14 tasks (T011-T020, plus utility tasks)

**New Tasks Added:**
- T011b: User Profile Utilities (0.5 days)
- T011c: Connection Helper Utilities (0.5 days)
- T011d: Update Constants File (0.25 days)
- T018b: Controller Index Files (0.25 days)

**Effort Impact:**
- Original: 10-12 days
- Updated: 11-13 days
- **Net increase**: 1 day for utilities and structure

**Why the increase is worth it:**
1. Utilities will save time in Epic 4 (Feed), Epic 5 (Messaging), Epic 6 (Notifications)
2. Test maintenance is drastically reduced (no hardcoded values)
3. Easier to change business rules (update constants, not code)
4. Consistent user data handling across entire application

---

## Magic Numbers Eliminated

### Problem: Hardcoded Values in Tests

**Before (Brittle Tests):**
```javascript
it('should return 400 if fullName too short', async () => {
  const req = {
    user: currentUser,
    body: { fullName: 'A' } // What if we change minimum to 3?
  };
  
  await updateProfile(req, res);
  
  expect(res.statusCode).toBe(400);
  expect(res.body.error.details.fields.fullName).toMatch(/at least 2 characters/i);
  // ^^^ This regex would fail if minimum changes!
});
```

**Issues:**
- Test breaks when minimum changes from 2 to 3
- Regex pattern is hardcoded and fragile
- No single source of truth

---

**After (Resilient Tests):**
```javascript
const {
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH
} = require('../../../utils/constants');

it('should return 400 if fullName too short', async () => {
  const req = {
    user: currentUser,
    body: { fullName: 'A'.repeat(MIN_FULL_NAME_LENGTH - 1) }
  };
  
  await updateProfile(req, res);
  
  expect(res.statusCode).toBe(400);
  expect(res.body.error.details.fields.fullName).toMatch(
    new RegExp(`at least ${MIN_FULL_NAME_LENGTH} characters`, 'i')
  );
});
```

**Benefits:**
- ✅ Test adapts automatically when constant changes
- ✅ Regex pattern uses actual value
- ✅ Single source of truth (constants.js)
- ✅ Clear intent in test code

---

### Sensitive Fields Checking

**Before:**
```javascript
it('should not include sensitive fields', async () => {
  await getUserProfile(req, res);
  
  expect(res.body.data.password).toBeUndefined();
  expect(res.body.data.email).toBeUndefined();
  expect(res.body.data.resetPasswordToken).toBeUndefined();
  // What if we add more sensitive fields?
});
```

**After:**
```javascript
const { SENSITIVE_USER_FIELDS } = require('../../../utils/constants');

it('should not include sensitive fields', async () => {
  await getUserProfile(req, res);
  
  // Automatically checks ALL sensitive fields
  SENSITIVE_USER_FIELDS.forEach(field => {
    expect(res.body.data[field]).toBeUndefined();
  });
});
```

**Benefits:**
- ✅ Add new sensitive field? Test automatically checks it
- ✅ No missed fields
- ✅ Consistent across all tests

---

## Code Duplication Eliminated

### Followers vs Following Lists

#### Before (Without Utilities)
```javascript
// In getFollowersController.js - ~40 lines
const connections = await Connection.find({
  following: userId,
  type: 'follow'
})
.populate('follower', 'username fullName profilePicture');

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

// In getFollowingController.js - SAME 40 LINES with different field names!
```

**Total**: ~40 lines × 2 controllers = **80 lines of duplicated logic**

#### After (With Utilities)
```javascript
// In getFollowersController.js - ~10 lines
const connections = await Connection.find({
  following: userId,
  type: 'follow'
})
.sort(sort)
.skip(skip)
.limit(limit)
.populate('follower', 'username fullName profilePicture');

const followers = await buildConnectionList(
  connections,
  req.user?._id,
  'follower' // Which field to use
);

// In getFollowingController.js - ~10 lines (same utility!)
const connections = await Connection.find({
  follower: userId,
  type: 'follow'
})
.sort(sort)
.skip(skip)
.limit(limit)
.populate('following', 'username fullName profilePicture');

const following = await buildConnectionList(
  connections,
  req.user?._id,
  'following' // Just change the field name!
);
```

**Lines saved**: **60 lines** (75% reduction!)
**Bug risk reduced**: Changes to list building logic only need to be made in ONE place

---

### Pagination Logic

#### Before (Without Utilities)
```javascript
// In getFollowersController.js
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
const skip = (page - 1) * limit;

// ... later ...

res.json({
  data: followers,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
});

// REPEATED in getFollowingController, getComments, getPosts, etc.
```

**Duplicated across**: 6+ controllers = **~60 lines total**

#### After (With Utilities from Epic 3)
```javascript
const { buildPaginationQuery, buildPaginationResponse } = require('../../utils/pagination');

// In ANY controller
const { skip, limit, sort } = buildPaginationQuery(req);
// ... query ...
const response = buildPaginationResponse(data, total, req.query.page, limit);

res.json({
  success: true,
  ...response
});
```

**Lines saved**: **~50 lines** (83% reduction!)
**Consistency**: All endpoints return identical pagination format

---

## File Size Comparison

### Without Restructure (Hypothetical)
```
userController.js: ~450 lines
- getUserProfile: ~120 lines
- updateProfile: ~100 lines
- getFollowers: ~100 lines
- getFollowing: ~100 lines

connectionController.js: ~350 lines
- followUser: ~90 lines
- unfollowUser: ~70 lines
- blockUser: ~100 lines
- unblockUser: ~70 lines
```

**Problem**: 400+ and 350+ line files are difficult to navigate

### With Restructure (Actual)
```
Largest file: followController.js: ~150 lines (both follow and unfollow)
Average file size: ~90 lines
```

**Benefit**: All files easily fit on one screen

---

## Testing Strategy

### Utility Tests (New)
```javascript
// /server/spec/utils/userHelpers.spec.js
describe('sanitizeUserProfile', () => {
  it('should remove all sensitive fields', () => {
    const user = {
      username: 'testuser',
      password: 'hashed',
      passwordResetToken: 'token'
    };
    
    const sanitized = sanitizeUserProfile(user);
    
    SENSITIVE_USER_FIELDS.forEach(field => {
      expect(sanitized[field]).toBeUndefined();
    });
  });
});

// /server/spec/utils/connectionHelpers.spec.js
describe('buildConnectionList', () => {
  it('should build list with isFollowing flags', async () => { ... });
  it('should work for both followers and following', async () => { ... });
});
```

**Benefit**: Test utilities once, trust them everywhere

### Controller Tests (Simplified)
```javascript
// Controllers can now focus on business logic
describe('getUserProfile', () => {
  it('should return profile with public fields', () => { ... });
  // No need to test sanitization - that's in userHelpers
});
```

**Benefit**: Controller tests are shorter and more focused

---

## Constants Usage Examples

### In Controllers
```javascript
const {
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH
} = require('../../utils/constants');

// Validation
if (fullName.length < MIN_FULL_NAME_LENGTH) {
  errors.fullName = `Full name must be at least ${MIN_FULL_NAME_LENGTH} characters`;
}

if (bio.length > MAX_BIO_LENGTH) {
  errors.bio = `Bio must not exceed ${MAX_BIO_LENGTH} characters`;
}
```

### In Tests
```javascript
const {
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH,
  SENSITIVE_USER_FIELDS
} = require('../../../utils/constants');

it('should validate fullName length', async () => {
  const req = {
    body: {
      fullName: 'A'.repeat(MAX_FULL_NAME_LENGTH + 1) // Auto-adjusts!
    }
  };
  
  await updateProfile(req, res);
  
  expect(res.statusCode).toBe(400);
  expect(res.body.error.details.fields.fullName).toMatch(
    new RegExp(`max.*${MAX_FULL_NAME_LENGTH}`, 'i') // Dynamic regex!
  );
});
```

### Changing a Limit
```javascript
// In constants.js - ONE PLACE TO CHANGE
const MAX_BIO_LENGTH = 500; // Changed from 500 to 1000

// Result:
// ✅ Controller validation automatically uses 1000
// ✅ Error messages automatically say 1000
// ✅ ALL tests automatically use 1000
// ✅ Test assertions automatically check for 1000
// ✅ NO CODE CHANGES NEEDED!
```

---

## Cross-Epic Utility Reuse

### Utilities Created in Epic 3, Reused in Epic 2

| Utility | Epic 3 Usage | Epic 2 Usage |
|---------|--------------|--------------|
| `pagination.js` | getComments, getPosts | getFollowers, getFollowing |
| `validation.js` | validateImageUrls (posts) | validateImageUrls (profiles) |
| `constants.js` | Post/comment limits | Profile limits |

**Future Reuse** (Epic 4, 5, 6):
- `pagination.js` - getFeed, getMessages, getNotifications
- `validation.js` - All file upload validations
- `constants.js` - All business rules

---

## Benefits Summary

### 1. Maintainability
- ✅ Small, focused files (~90 lines average)
- ✅ Easy to find code
- ✅ Less merge conflicts

### 2. Reusability
- ✅ buildConnectionList works for followers AND following
- ✅ Pagination reused from Epic 3
- ✅ Validation reused from Epic 3

### 3. Testability
- ✅ Tests use constants, not magic numbers
- ✅ Tests adapt automatically when limits change
- ✅ Utility tests cover common logic once

### 4. Consistency
- ✅ Follows Epic 1 and Epic 3 patterns
- ✅ All endpoints return same pagination format
- ✅ All endpoints sanitize user data the same way

### 5. Flexibility
- ✅ Change limits in ONE place
- ✅ Add sensitive fields without touching controllers
- ✅ Update validation rules centrally

---

## Migration Path

### Epic 4: Feed Algorithm
Will reuse:
- ✅ `pagination.js` - for feed pagination
- ✅ `userHelpers.js` - for user data in feed
- ✅ `postHelpers.js` - for post data in feed
- ✅ `constants.js` - for feed limits

### Epic 5: Messaging
Will reuse:
- ✅ `pagination.js` - for message lists
- ✅ `userHelpers.js` - for participant data
- ✅ `constants.js` - for message limits

### Epic 6: Notifications
Will reuse:
- ✅ `pagination.js` - for notification lists
- ✅ `userHelpers.js` - for actor data
- ✅ `constants.js` - for notification limits

**Pattern Established**: Each epic adds domain-specific utilities, reuses cross-cutting utilities

---

## ROI Calculation

### Time Investment
- **Utility creation**: 1.25 days (~10 hours)
- **Controller refactoring**: Already accounted for in estimates

### Time Saved
- **Epic 2**: ~4 hours (from reduced duplication)
- **Epic 4**: ~6 hours (reuse pagination, user helpers)
- **Epic 5**: ~4 hours (reuse pagination, user helpers)
- **Epic 6**: ~3 hours (reuse pagination, user helpers)
- **Test maintenance**: ~10 hours over project lifetime (no hardcoded values)

**Total ROI**: ~17 hours saved over project lifetime  
**Break-even**: After Epic 4  
**Long-term benefit**: Priceless (code quality, maintainability, developer experience)

---

## Comparison with Epic 1 and Epic 3

### Consistency Check

| Aspect | Epic 1 (Auth) | Epic 2 (Profiles) | Epic 3 (Posts) |
|--------|---------------|-------------------|----------------|
| Controller structure | ✅ Folder with index.js | ✅ Folder with index.js | ✅ Folder with index.js |
| Utility files | ❌ (simple epic) | ✅ userHelpers, connectionHelpers | ✅ postHelpers, commentHelpers |
| Constants usage | ⚠️ Some hardcoded | ✅ All constants | ✅ All constants |
| Pagination | ❌ N/A | ✅ Reused from Epic 3 | ✅ Created pagination.js |
| Test resilience | ⚠️ Some magic numbers | ✅ No magic numbers | ✅ No magic numbers |

**Recommendation**: Update Epic 1 tests to use constants in future refactor

---

## Next Steps

1. ✅ Review and approve this structure
2. ⬜ Implement Phase 1: Connection Model (T011)
3. ⬜ Implement Phase 1.5: Utilities (T011b, T011c, T011d)
4. ⬜ Implement Phase 2-6: Controllers (T012-T018)
5. ⬜ Implement Phase 7: Routes & Testing (T019-T020)
6. ⬜ Consider: Update Epic 1 tests to use constants

---

**Approved by**: [Pending Review]  
**Date**: December 13, 2025  
**Status**: Ready for Implementation

---

**End of Restructure Summary**
