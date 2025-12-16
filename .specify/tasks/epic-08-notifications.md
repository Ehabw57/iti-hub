# Epic 8: Notifications & Real-time (P0)

**Priority**: P0 (MVP Critical)  
**Estimated Effort**: 6-8 days  
**Dependencies**: Epic 1 (Authentication), Epic 3 (Posts/Comments), Epic 7 (Messaging & WebSocket)  
**Specifications**: `/docs/specs/API-Specification.md`, `/docs/specs/Database-Schema.md`, `/docs/specs/SRS.md`

---

## User Stories

### US1: Receive Notifications
**As a** user  
**I want to** receive notifications for important activities  
**So that** I stay informed about interactions with my content and profile

**Acceptance Criteria:**
- Receive notifications for:
  - Someone likes my post (grouped: "John and 5 others liked your post")
  - Someone comments on my post (grouped: "John and 3 others commented on your post")
  - Someone replies to my comment (grouped: "John and 2 others replied to your comment")
  - Someone likes my comment (grouped: "John and 4 others liked your comment")
  - Someone reposts my post (individual: "John reposted your post")
  - Someone follows me (individual: "John started following you")
- Similar notifications for same target are grouped together
- Grouped notifications show most recent actor + count
- Display format: 1 actor: "John liked", 2+ actors: "John and X others liked"
- Notifications received in real-time (Socket.io)
- Each notification includes actor details (who did it)
- Notifications include timestamp (updated when grouped)
- Grouped notification becomes unread again when new activity occurs
- Notifications stored in database for later retrieval

---

### US2: View Notifications
**As a** user  
**I want to** view my notification history  
**So that** I can catch up on activities I missed

**Acceptance Criteria:**
- View paginated list of all notifications
- Sort by most recent first (updatedAt desc for grouped, createdAt desc otherwise)
- See unread count badge
- Distinguish read from unread notifications
- View notification details (actor, actorCount, action, target)
- For grouped notifications: Display "John and 5 others" format
- Load more with infinite scroll
- Filter by notification type (optional)

---

### US3: Manage Notifications
**As a** user  
**I want to** mark notifications as read  
**So that** I can clear my unread count and organize my notifications

**Acceptance Criteria:**
- Mark single notification as read
- Mark all notifications as read
- Read status persists across devices
- Unread count updates immediately
- Real-time updates when notifications are read on other devices

---

## Phase 1: Setup (Shared Infrastructure)

### T086: Create Notification Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/models/Notification.js`

**Schema Definition:**
```javascript
{
  _id: ObjectId,
  recipient: ObjectId,        // Ref: users (who receives notification)
  actor: ObjectId,            // Ref: users (most recent actor for grouped notifications)
  actorCount: Number,         // Total count of actors (for grouped notifications, default: 1)
  type: String,               // "like" | "comment" | "reply" | "repost" | "follow" | "comment_like"
  target: ObjectId,           // Ref: posts or comments or user (determined by type)
  isRead: Boolean,            // Default: false
  createdAt: Date,
  updatedAt: Date
}

// Note: 
// - For "like", "comment", "repost": target refs Post
// - For "reply", "comment_like": target refs Comment
// - For "follow": target is null (not needed)
```

**Indexes:**
```javascript
{ recipient: 1, createdAt: -1 }
{ recipient: 1, isRead: 1 }
{ actor: 1, type: 1 }
{ target: 1 }
{ recipient: 1, type: 1, target: 1 }     // For finding existing notification to group with
```

**Static Methods to Implement:**

1. **`Notification.createOrUpdateNotification(recipientId, actorId, type, targetId)`**
   - For groupable types (like, comment, reply, comment_like): Check if notification exists
   - If exists: Update actor (most recent), increment actorCount, update timestamps, set isRead to false
   - If not exists: Create new notification with actorCount = 1
   - For non-groupable types (follow, repost): Always create new notification
   - Prevent duplicate notifications for same actor
   - Don't notify user of own actions

2. **`Notification.getUnreadCount(userId)`**
   - Count unread notifications for user

3. **`Notification.markAsRead(notificationId, userId)`**
   - Mark single notification as read

4. **`Notification.markAllAsRead(userId)`**
   - Mark all user's notifications as read

5. **`Notification.isGroupableType(type)`**
   - Return true for: "like", "comment", "reply", "comment_like"
   - Return false for: "follow", "repost"

**Test Cases:**
File: `/server/spec/models/notificationModel.spec.js`

**Schema Validation:**
- ✓ Should require recipient field
- ✓ Should require actor field
- ✓ Should require type field
- ✓ Should validate type enum values
- ✓ Should require target for like/comment/reply/repost/comment_like types
- ✓ Should not require target for follow type
- ✓ Should default isRead to false
- ✓ Should default actorCount to 1
- ✓ Should auto-set createdAt and updatedAt

**Static Method Tests:**
- ✓ createOrUpdateNotification: Should create like notification (first time)
- ✓ createOrUpdateNotification: Should update existing like notification (group)
- ✓ createOrUpdateNotification: Should increment actorCount on grouping
- ✓ createOrUpdateNotification: Should update timestamps on grouping
- ✓ createOrUpdateNotification: Should set isRead to false on grouping
- ✓ createOrUpdateNotification: Should update actor to most recent
- ✓ createOrUpdateNotification: Should create comment notification
- ✓ createOrUpdateNotification: Should group comment notifications
- ✓ createOrUpdateNotification: Should create reply notification
- ✓ createOrUpdateNotification: Should group reply notifications
- ✓ createOrUpdateNotification: Should create comment_like notification
- ✓ createOrUpdateNotification: Should group comment_like notifications
- ✓ createOrUpdateNotification: Should NOT group repost notifications
- ✓ createOrUpdateNotification: Should NOT group follow notifications
- ✓ createOrUpdateNotification: Should prevent self-notification
- ✓ createOrUpdateNotification: Should prevent duplicate from same actor
- ✓ createOrUpdateNotification: Should group by target (different targets = different notifications)
- ✓ createOrUpdateNotification: Should validate required fields per type
- ✓ createOrUpdateNotification: Should reject invalid recipient
- ✓ createOrUpdateNotification: Should reject invalid actor
- ✓ isGroupableType: Should return true for groupable types
- ✓ isGroupableType: Should return false for non-groupable types
- ✓ getUnreadCount: Should return correct count
- ✓ getUnreadCount: Should return 0 if no unread
- ✓ markAsRead: Should update isRead to true
- ✓ markAsRead: Should only mark user's notification
- ✓ markAllAsRead: Should mark all user notifications
- ✓ markAllAsRead: Should not affect other users

**Acceptance Criteria:**
- [ ] Model created with proper schema
- [ ] All indexes defined
- [ ] All static methods implemented
- [ ] All validation rules enforced
- [ ] All test cases passing

---

## Phase 2: User Story 1 - Trigger Notifications

### T087: Implement Post Like Notification
**Type**: Controller Enhancement  
**User Story**: US1  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 3  
**Priority**: P0

**Target File:**
- `/server/controllers/post/likePostController.js`

**Implementation:**
- Add notification creation/update when post is liked
- Use `Notification.createOrUpdateNotification()` for grouping
- Notify post author (not self)
- Include post ID and actor ID
- Emit real-time notification event (new or update)

**Test Cases:**
File: `/server/spec/controllers/post/likePostController.spec.js`

- ✓ Should create notification when liking post (first time)
- ✓ Should update existing notification when another user likes (grouping)
- ✓ Should increment actorCount on grouping
- ✓ Should update actor to most recent
- ✓ Should update timestamps on grouping
- ✓ Should set isRead to false on grouping
- ✓ Should not create notification for own post
- ✓ Should include correct actor and target IDs
- ✓ Should set type to "like"
- ✓ Should emit real-time event (notification:new or notification:update)
- ✓ Should handle notification creation failure gracefully
- ✓ Should not block like action if notification fails
- ✓ Should group notifications for same post
- ✓ Should not group notifications for different posts

**Acceptance Criteria:**
- [ ] Notification created/updated on like
- [ ] Grouping logic working
- [ ] Real-time event emitted
- [ ] No self-notification
- [ ] All test cases passing

---

### T088: Implement Comment Notification
**Type**: Controller Enhancement  
**User Story**: US1  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 3  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/createCommentController.js`

**Implementation:**
- Add notification creation/update when post is commented on
- Use `Notification.createOrUpdateNotification()` for grouping
- Notify post author (not self)
- Include post ID and actor ID
- Emit real-time notification event (new or update)

**Test Cases:**
File: `/server/spec/controllers/comment/createCommentController.spec.js`

- ✓ Should create notification when commenting on post (first time)
- ✓ Should update existing notification when another user comments (grouping)
- ✓ Should increment actorCount on grouping
- ✓ Should update actor to most recent
- ✓ Should update timestamps on grouping
- ✓ Should set isRead to false on grouping
- ✓ Should not create notification for own post
- ✓ Should include correct actor and target IDs
- ✓ Should set type to "comment"
- ✓ Should emit real-time event (notification:new or notification:update)
- ✓ Should handle notification creation failure gracefully
- ✓ Should not block comment creation if notification fails
- ✓ Should group notifications for same post
- ✓ Should not group notifications for different posts

**Acceptance Criteria:**
- [ ] Notification created/updated on comment
- [ ] Grouping logic working
- [ ] Real-time event emitted
- [ ] No self-notification
- [ ] All test cases passing

---

### T089: Implement Reply Notification
**Type**: Controller Enhancement  
**User Story**: US1  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 3  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/createCommentController.js` (when parentComment exists)

**Implementation:**
- Add notification creation/update when comment is replied to
- Use `Notification.createOrUpdateNotification()` for grouping
- Notify parent comment author (not self)
- Include parent comment ID as target and actor ID
- Emit real-time notification event (new or update)

**Test Cases:**
File: `/server/spec/controllers/comment/createCommentController.spec.js`

- ✓ Should create notification when replying to comment (first time)
- ✓ Should update existing notification when another user replies (grouping)
- ✓ Should increment actorCount on grouping
- ✓ Should update actor to most recent
- ✓ Should update timestamps on grouping
- ✓ Should set isRead to false on grouping
- ✓ Should not create notification for own comment
- ✓ Should include correct actor and target IDs
- ✓ Should set type to "reply"
- ✓ Should emit real-time event (notification:new or notification:update)
- ✓ Should handle notification creation failure gracefully
- ✓ Should not block reply creation if notification fails
- ✓ Should group notifications for same comment
- ✓ Should not group notifications for different comments

**Acceptance Criteria:**
- [ ] Notification created/updated on reply
- [ ] Grouping logic working
- [ ] Real-time event emitted
- [ ] No self-notification
- [ ] All test cases passing

---

### T089b: Implement Comment Like Notification
**Type**: Controller Enhancement  
**User Story**: US1  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 3  
**Priority**: P0

**Target File:**
- `/server/controllers/comment/likeCommentController.js`

**Implementation:**
- Add notification creation/update when comment is liked
- Use `Notification.createOrUpdateNotification()` for grouping
- Notify comment author (not self)
- Include comment ID as target and actor ID
- Emit real-time notification event (new or update)

**Test Cases:**
File: `/server/spec/controllers/comment/likeCommentController.spec.js`

- ✓ Should create notification when liking comment (first time)
- ✓ Should update existing notification when another user likes (grouping)
- ✓ Should increment actorCount on grouping
- ✓ Should update actor to most recent
- ✓ Should update timestamps on grouping
- ✓ Should set isRead to false on grouping
- ✓ Should not create notification for own comment
- ✓ Should include correct actor and target IDs
- ✓ Should set type to "comment_like"
- ✓ Should emit real-time event (notification:new or notification:update)
- ✓ Should handle notification creation failure gracefully
- ✓ Should not block like action if notification fails
- ✓ Should group notifications for same comment
- ✓ Should not group notifications for different comments

**Acceptance Criteria:**
- [ ] Notification created/updated on comment like
- [ ] Grouping logic working
- [ ] Real-time event emitted
- [ ] No self-notification
- [ ] All test cases passing

---

### T090: Implement Repost Notification
**Type**: Controller Enhancement  
**User Story**: US1  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 3  
**Priority**: P0

**Target File:**
- `/server/controllers/post/repostController.js`

**Implementation:**
- Add notification creation when post is reposted
- Use `Notification.createOrUpdateNotification()` (will NOT group - individual notifications)
- Notify original post author (not self)
- Include post ID and actor ID
- Emit real-time notification event

**Test Cases:**
File: `/server/spec/controllers/post/repostController.spec.js`

- ✓ Should create notification when reposting
- ✓ Should create separate notification for each repost (not grouped)
- ✓ Should not create notification for own post
- ✓ Should include correct actor and target IDs
- ✓ Should set type to "repost"
- ✓ Should set actorCount to 1
- ✓ Should emit real-time event (notification:new)
- ✓ Should handle notification creation failure gracefully
- ✓ Should not block repost action if notification fails

**Acceptance Criteria:**
- [ ] Notification created on repost
- [ ] NOT grouped (individual notifications)
- [ ] Real-time event emitted
- [ ] No self-notification
- [ ] All test cases passing

---

### T091: Implement Follow Notification
**Type**: Controller Enhancement  
**User Story**: US1  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 2  
**Priority**: P0

**Target File:**
- `/server/controllers/connection/followController.js`

**Implementation:**
- Add notification creation when user is followed
- Use `Notification.createOrUpdateNotification()` (will NOT group - individual notifications)
- Notify followed user
- Include actor ID only (no target)
- Emit real-time notification event

**Test Cases:**
File: `/server/spec/controllers/connection/followController.spec.js`

- ✓ Should create notification when following user
- ✓ Should create separate notification for each follow (not grouped)
- ✓ Should include correct actor ID
- ✓ Should set type to "follow"
- ✓ Should set actorCount to 1
- ✓ Should not include target ID
- ✓ Should emit real-time event (notification:new)
- ✓ Should handle notification creation failure gracefully
- ✓ Should not block follow action if notification fails

**Acceptance Criteria:**
- [ ] Notification created on follow
- [ ] NOT grouped (individual notifications)
- [ ] Real-time event emitted
- [ ] All test cases passing

---

## Phase 3: User Story 2 - View Notifications

### T092: Implement Get Notifications Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1.5 days  
**Depends On**: T086, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/notification/getNotificationsController.js`

**Function to Implement:**

**`getNotifications(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
  - `req.query.page` (number, default: 1)
  - `req.query.limit` (number, default: 20, max: 100)
  - `req.query.type` (string, optional - filter by type)
  - `req.query.unreadOnly` (boolean, optional)
- **Output**: JSON response with paginated notifications (200) or error (500)

**Implementation Steps:**
1. Get current user from req.user
2. Build query with filters
3. Query notifications for user
4. Sort by updatedAt desc (for accurate ordering with grouped notifications)
5. Populate actor details (name, username, profilePicture)
6. Populate target details based on type:
   - For "like", "comment", "repost": populate Post
   - For "reply", "comment_like": populate Comment
   - For "follow": no target to populate
7. Format notification messages based on actorCount:
   - actorCount === 1: "{actor} liked your post"
   - actorCount > 1: "{actor} and {count} others liked your post"
8. Return paginated response with unread count

**Test Cases:**
File: `/server/spec/controllers/notification/getNotificationsController.spec.js`

- ✓ Should return paginated notifications
- ✓ Should sort by updatedAt desc (newest first)
- ✓ Should include actor details
- ✓ Should include actorCount for each notification
- ✓ Should populate target (Post) for post-related notifications
- ✓ Should populate target (Comment) for comment-related notifications
- ✓ Should not populate target for follow notifications
- ✓ Should format message correctly for single actor
- ✓ Should format message correctly for multiple actors (grouped)
- ✓ Should distinguish read from unread
- ✓ Should return total unread count
- ✓ Should filter by type if provided
- ✓ Should filter by unreadOnly if true
- ✓ Should respect pagination limits
- ✓ Should default to page 1 and limit 20
- ✓ Should cap limit at 100
- ✓ Should return empty array if no notifications
- ✓ Should handle deleted actors gracefully
- ✓ Should handle deleted targets gracefully
- ✓ Should include all notification types
- ✓ Should calculate total pages correctly
- ✓ Should show grouped notifications correctly
- ✓ Should return 200 with valid data
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Returns all user's notifications
- [ ] Properly paginated
- [ ] Includes all related details
- [ ] Filter options working
- [ ] All test cases passing

---

### T093: Implement Get Unread Count Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/notification/getUnreadCountController.js`

**Function to Implement:**

**`getUnreadCount(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
- **Output**: JSON response with unread count (200) or error (500)

**Test Cases:**
File: `/server/spec/controllers/notification/getUnreadCountController.spec.js`

- ✓ Should return correct unread count
- ✓ Should return 0 if no unread notifications
- ✓ Should only count current user's notifications
- ✓ Should return 200 with count
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Returns accurate unread count
- [ ] Fast query (indexed)
- [ ] All test cases passing

---

## Phase 4: User Story 3 - Manage Notifications

### T094: Implement Mark Notification as Read Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 1, Epic 7 (T080)  
**Priority**: P0

**Target File:**
- `/server/controllers/notification/markAsReadController.js`

**Function to Implement:**

**`markAsRead(req, res)`**
- **Input**:
  - `req.params.notificationId` (string)
  - `req.user` (object - from checkAuth)
- **Output**: JSON response (200) or error (403/404/500)

**Implementation Steps:**
1. Validate notificationId
2. Find notification
3. Verify notification belongs to user
4. Update isRead to true
5. Emit real-time event (for multi-device sync)
6. Return success response

**Test Cases:**
File: `/server/spec/controllers/notification/markAsReadController.spec.js`

- ✓ Should mark notification as read
- ✓ Should return 200 with success message
- ✓ Should return 403 if not user's notification
- ✓ Should return 404 if notification not found
- ✓ Should return 400 for invalid notification ID
- ✓ Should emit real-time event
- ✓ Should handle already-read notification gracefully
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Marks notification as read
- [ ] Verifies ownership
- [ ] Emits real-time event
- [ ] All test cases passing

---

### T095: Implement Mark All as Read Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 0.5 days  
**Depends On**: T086, Epic 1, Epic 7 (T080)  
**Priority**: P0

**Target File:**
- `/server/controllers/notification/markAllAsReadController.js`

**Function to Implement:**

**`markAllAsRead(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
- **Output**: JSON response with count (200) or error (500)

**Implementation Steps:**
1. Get current user
2. Update all unread notifications to read
3. Emit real-time event with updated count
4. Return count of marked notifications

**Test Cases:**
File: `/server/spec/controllers/notification/markAllAsReadController.spec.js`

- ✓ Should mark all unread notifications as read
- ✓ Should return count of marked notifications
- ✓ Should return 200 with success message
- ✓ Should emit real-time event
- ✓ Should handle no unread notifications gracefully
- ✓ Should only affect current user's notifications
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Marks all notifications as read
- [ ] Returns accurate count
- [ ] Emits real-time event
- [ ] All test cases passing

---

## Phase 5: Real-time Notification Delivery (MVP Essential)

### T096: Implement Real-time Notification Events
**Type**: WebSocket Events  
**User Story**: US1, US3  
**Estimated Effort**: 1 day  
**Depends On**: Epic 7 (T080), T086  
**Priority**: P0

**Target File:**
- `/server/utils/socketEvents.js`

**Events to Implement:**

1. **`notification:new`** - Emit when notification created (first time)
2. **`notification:update`** - Emit when notification updated (grouped)
3. **`notification:read`** - Emit when notification marked as read
4. **`notification:count`** - Emit updated unread count

**Implementation:**
- Use Socket.io to emit events to specific user
- Include full notification data in events
- For grouped notifications: emit notification:update with updated actorCount
- Update unread count in real-time
- Support multi-device sync

**Test Cases:**
File: `/server/spec/utils/socketEvents.spec.js`

**notification:new:**
- ✓ Should emit to recipient user only
- ✓ Should include full notification data
- ✓ Should include actor details
- ✓ Should include target details if applicable
- ✓ Should include actorCount (should be 1 for new)
- ✓ Should work for all notification types
- ✓ Should handle offline users gracefully
- ✓ Should emit to all user's connected devices

**notification:update:**
- ✓ Should emit when notification is grouped
- ✓ Should include updated actorCount
- ✓ Should include updated actor (most recent)
- ✓ Should include updated timestamps
- ✓ Should set isRead to false
- ✓ Should emit to all user's devices
- ✓ Should only emit for groupable notification types

**notification:read:**
- ✓ Should emit when single notification read
- ✓ Should emit when all notifications read
- ✓ Should include notification ID
- ✓ Should update unread count
- ✓ Should emit to all user's devices

**notification:count:**
- ✓ Should emit updated unread count
- ✓ Should emit after notification created
- ✓ Should emit after notification updated (grouped)
- ✓ Should emit after notification read
- ✓ Should emit to all user's devices
- ✓ Should include accurate count

**Acceptance Criteria:**
- [ ] All events implemented
- [ ] Events emitted to correct recipients
- [ ] Real-time updates working
- [ ] Multi-device sync working
- [ ] All test cases passing

---

## Phase 6: Routes & Integration

### T097: Create Notification Routes
**Type**: Routes  
**Estimated Effort**: 0.5 days  
**Depends On**: T092-T095  
**Priority**: P0

**Target File:**
- `/server/routes/notificationRoutes.js`

**Routes:**
```javascript
GET    /notifications              // Get paginated notifications
GET    /notifications/unread       // Get unread count
POST   /notifications/:notificationId/read  // Mark as read
POST   /notifications/read-all     // Mark all as read
```

**Acceptance Criteria:**
- [ ] All routes properly defined
- [ ] Correct middleware applied (checkAuth)
- [ ] Clean controller imports
- [ ] Routes mounted in app.js
- [ ] All endpoints accessible

---

### T098: Create Notification Integration Tests
**Type**: Testing  
**Estimated Effort**: 1.5 days  
**Depends On**: T086-T097  
**Priority**: P0

**Target File:**
- `/server/spec/integration/notifications.integration.spec.js`

**Test Scenarios:**

**Notification Creation:**
- ✓ Like notification created and delivered in real-time
- ✓ Comment notification created and delivered
- ✓ Reply notification created and delivered
- ✓ Comment like notification created and delivered
- ✓ Repost notification created and delivered (individual)
- ✓ Follow notification created and delivered (individual)
- ✓ No self-notification for any action
- ✓ Duplicate from same actor prevented

**Notification Grouping:**
- ✓ Multiple likes on same post grouped together
- ✓ Multiple comments on same post grouped together
- ✓ Multiple replies to same comment grouped together
- ✓ Multiple likes on same comment grouped together
- ✓ ActorCount increments correctly on grouping
- ✓ Actor updated to most recent on grouping
- ✓ Timestamps updated on grouping
- ✓ isRead set to false on grouping (becomes unread again)
- ✓ Different posts have separate notifications (not grouped)
- ✓ Different comments have separate notifications (not grouped)
- ✓ Repost notifications NOT grouped (individual)
- ✓ Follow notifications NOT grouped (individual)

**Notification Retrieval:**
- ✓ Get all notifications paginated
- ✓ Grouped notifications display correctly ("John and 5 others")
- ✓ Filter by type
- ✓ Filter by unread only
- ✓ Get unread count
- ✓ Unread count updates after marking as read
- ✓ Sort by updatedAt desc (grouped notifications appear at top)

**Notification Management:**
- ✓ Mark single notification as read
- ✓ Mark all notifications as read
- ✓ Read status persists
- ✓ Cannot mark other user's notification

**Real-time Features:**
- ✓ New notification delivered immediately (notification:new)
- ✓ Grouped notification updates delivered (notification:update)
- ✓ Read status synced across devices
- ✓ Unread count updated in real-time
- ✓ Multiple devices receive updates

**Edge Cases:**
- ✓ Deleted post/comment handled gracefully
- ✓ Deleted actor handled gracefully
- ✓ Offline users receive on reconnect
- ✓ Blocked users don't receive notifications
- ✓ Grouping with read then new activity makes it unread

**Acceptance Criteria:**
- [ ] 50+ integration test cases passing
- [ ] All 6 notification types tested (like, comment, reply, comment_like, repost, follow)
- [ ] Grouping logic thoroughly tested
- [ ] Real-time features verified (new and update events)
- [ ] Edge cases covered

---

## Phase 7: Documentation & Cleanup

### T099: Update API Documentation for Notifications
**Type**: Documentation  
**Estimated Effort**: 0.5 days  
**Depends On**: T097  
**Priority**: P0

**Target File:**
- `/server/docs/notification.yaml`

**Content:**
- All notification endpoints
- Request/response schemas (including actorCount field)
- WebSocket event documentation (notification:new, notification:update, notification:read, notification:count)
- Notification types and structure (6 types: like, comment, reply, comment_like, repost, follow)
- Grouping behavior explanation
- Display format examples ("John liked" vs "John and 5 others liked")
- Error codes and messages

**Acceptance Criteria:**
- [ ] All endpoints documented
- [ ] WebSocket events documented
- [ ] Examples provided
- [ ] Integrated into docs/index.js

---

### T100: Create Notification Controller Index File
**Type**: Structure  
**Estimated Effort**: 0.25 days  
**Depends On**: T092-T095  
**Priority**: P0

**Target File:**
- `/server/controllers/notification/index.js`

**Purpose:** Export all controller functions for clean imports

**Acceptance Criteria:**
- [ ] Clean imports in routes
- [ ] All functions exported
- [ ] Consistent with Epic 1-7 patterns

---

## Summary

**Total Tasks**: 14 (T086-T099, including T089b for comment_like and T100 for completeness)
- **Models**: 1 task (T086)
- **Controller Enhancements**: 6 tasks (T087-T091, T089b)
- **Notification Controllers**: 3 tasks (T092-T095)
- **WebSocket Events**: 1 task (T096)
- **Routes & Testing**: 2 tasks (T097-T098)
- **Documentation**: 1 task (T099)
- **Structure**: 1 task (T100)

**Estimated Total Effort**: 7-9 days (increased from 6-8 due to grouping logic)
**Dependencies**: Epic 1, Epic 3, Epic 7

**File Structure:**
```
server/
├── controllers/
│   └── notification/
│       ├── index.js
│       ├── getNotificationsController.js
│       ├── getUnreadCountController.js
│       ├── markAsReadController.js
│       └── markAllAsReadController.js
├── utils/
│   ├── socketEvents.js
│   └── socketServer.js (from Epic 7)
├── models/
│   └── Notification.js
├── routes/
│   └── notificationRoutes.js
└── docs/
    └── notification.yaml
```

**Key Features:**
- ✅ 6 notification types (like, comment, reply, comment_like, repost, follow)
- ✅ Smart grouping for similar notifications (like, comment, reply, comment_like)
- ✅ Individual notifications for repost and follow
- ✅ Display format: "John liked" vs "John and 5 others liked"
- ✅ Grouped notifications show most recent actor + count
- ✅ Grouping updates existing notification (timestamp, actor, unread status)
- ✅ Real-time notification delivery (Socket.io)
- ✅ Real-time updates for grouped notifications (notification:update event)
- ✅ Read/unread status tracking
- ✅ Unread count badge
- ✅ Multi-device synchronization
- ✅ Pagination support
- ✅ Type filtering
- ✅ Batch mark as read

**Notification Types:**
1. **Like**: "{Actor} liked your post" (grouped by post)
2. **Comment**: "{Actor} commented on your post" (grouped by post)
3. **Reply**: "{Actor} replied to your comment" (grouped by comment)
4. **Comment Like**: "{Actor} liked your comment" (grouped by comment)
5. **Repost**: "{Actor} reposted your post" (individual - not grouped)
6. **Follow**: "{Actor} started following you" (individual - not grouped)

**Grouping Rules:**
- **Groupable**: like, comment, reply, comment_like (grouped by target)
- **Not Groupable**: repost, follow (always individual)
- **Display**: 1 actor shows name only, 2+ actors shows "Name and X others"
- **Update Behavior**: New activity updates timestamp and sets to unread
- **Actor Storage**: Only store most recent actor + total count

**Definition of Done:**
- [ ] Notification model implemented and tested with grouping logic
- [ ] All 6 notification types working (like, comment, reply, comment_like, repost, follow)
- [ ] Grouping working for groupable types (like, comment, reply, comment_like)
- [ ] Individual notifications for non-groupable types (repost, follow)
- [ ] All controllers implemented and tested
- [ ] WebSocket events working (new, update, read, count)
- [ ] Real-time delivery verified
- [ ] Real-time updates for grouped notifications verified
- [ ] All test cases passing (140+ scenarios including grouping tests)
- [ ] API documentation complete with grouping examples
- [ ] Code follows Epic 1-7 patterns
- [ ] Manual testing successful
- [ ] Multi-device sync tested
- [ ] Grouping behavior documented with examples
