# Epic 7: Messaging & Real-time (P0)

**Priority**: P0 (MVP Critical)  
**Estimated Effort**: 12-15 days  
**Dependencies**: Epic 1 (Authentication), Epic 2 (User Profiles), Epic 4 (File Upload)  
**Specifications**: `/docs/specs/API-Specification.md`, `/docs/specs/Database-Schema.md`, `/docs/specs/SRS.md`

---

## User Stories

### US1: View Conversations
**As a** user  
**I want to** view my list of conversations  
**So that** I can see my recent chats and start new conversations

**Acceptance Criteria:**
- Display all conversations where I'm a participant
- Sort by most recent activity (last message)
- Show conversation preview (last message text)
- Display unread message count per conversation
- Show participant info (name, profile picture, online status)
- Support pagination (20 conversations per page)
- Work for both individual and group conversations

---

### US2: Create Conversations
**As a** user  
**I want to** create individual or group conversations  
**So that** I can chat with one or more people

**Individual Conversations:**
- Create 1-on-1 conversation with any user
- Return existing conversation if already exists
- Cannot create conversation with blocked users

**Group Conversations:**
- Create group with 2-99 other users (3-100 total)
- Group name required (2-100 characters)
- Optional group image
- Creator becomes admin automatically

---

### US3: Send and View Messages
**As a** user  
**I want to** send and receive messages  
**So that** I can communicate with others in real-time

**Acceptance Criteria:**
- Send text messages (up to 2000 characters)
- Send images (one per message, max 5MB)
- Message requires either text or image
- View message history (paginated, 20 per page)
- Load older messages with "before" cursor
- See sender info (name, profile picture)
- See message timestamp
- Receive messages in real-time (Socket.io)
- See typing indicators when others are typing

---

### US4: Manage Group Conversations
**As a** group admin  
**I want to** manage group membership and settings  
**So that** I can control who is in the group

**Acceptance Criteria:**
- Add new members (up to 100 total)
- Remove members from group
- Update group name and image
- Transfer admin role if leaving
- Only admin can perform these actions

**As a** group member  
**I want to** leave group conversations  
**So that** I can stop receiving messages

**Acceptance Criteria:**
- Leave any group I'm in
- Cannot send/receive messages after leaving
- Can be re-added by admin

---

### US5: Message Status & Presence
**As a** user  
**I want to** see message status and user presence  
**So that** I know if my messages have been seen

**Message Status:**
- "Sent" - message delivered to server
- "Delivered" - message received by recipient (real-time)
- "Seen" - recipient viewed the message
- Group chats show who has seen each message

**User Presence:**
- Show "Online" for active users
- Show "Last seen" timestamp for offline users
- Update automatically

---

## Phase 1: Setup (Shared Infrastructure)

### T066: Create Conversation Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/models/Conversation.js`

**Schema Definition:**
```javascript
{
  _id: ObjectId,
  type: String,              // "individual" | "group"
  participants: [ObjectId],  // Array of user IDs, min: 2, max: 100
  name: String,              // Required if type="group"
  image: String,             // Optional, URL for group image
  admin: ObjectId,           // Required if type="group"
  lastMessage: {
    content: String,
    senderId: ObjectId,
    timestamp: Date
  },
  unreadCount: Map,          // { userId: count }
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ participants: 1, updatedAt: -1 }
{ participants: 1, type: 1 } // Unique for individual conversations
{ type: 1 }
{ admin: 1 }
```

**Static Methods to Implement:**

1. **`Conversation.findByParticipants(participantIds, type)`**
   - Find conversation between specific users

2. **`Conversation.createIndividual(userId1, userId2)`**
   - Create or return existing individual conversation

3. **`Conversation.createGroup(creatorId, name, participantIds, image)`**
   - Create group conversation with validation

4. **`Conversation.updateUnreadCount(conversationId, userId, increment)`**
   - Update unread message count for user

**Test Cases:**
File: `/server/spec/models/conversationModel.spec.js`

**Schema Validation:**
- ✓ Should require type field
- ✓ Should validate type enum ("individual" | "group")
- ✓ Should require participants array with min 2 users
- ✓ Should reject more than 100 participants
- ✓ Should require name if type is "group"
- ✓ Should require admin if type is "group"
- ✓ Should validate image URL format if provided
- ✓ Should initialize unreadCount as empty Map
- ✓ Should auto-set createdAt and updatedAt

**Static Method Tests:**
- ✓ findByParticipants: Should find individual conversation by 2 participants
- ✓ findByParticipants: Should find group conversation by participants
- ✓ findByParticipants: Should return null if not found
- ✓ createIndividual: Should create new individual conversation
- ✓ createIndividual: Should return existing conversation
- ✓ createIndividual: Should prevent self-conversation
- ✓ createIndividual: Should check for blocking
- ✓ createGroup: Should create group with valid data
- ✓ createGroup: Should reject invalid participant count
- ✓ createGroup: Should set creator as admin
- ✓ createGroup: Should reject missing name
- ✓ updateUnreadCount: Should increment count for user
- ✓ updateUnreadCount: Should decrement count (reset to 0)
- ✓ updateUnreadCount: Should handle multiple users

**Acceptance Criteria:**
- [ ] Model created with proper schema
- [ ] All indexes defined
- [ ] All static methods implemented
- [ ] All validation rules enforced
- [ ] All test cases passing

---

### T067: Create Message Model
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/models/Message.js`

**Schema Definition:**
```javascript
{
  _id: ObjectId,
  conversation: ObjectId,    // Ref: conversations
  sender: ObjectId,          // Ref: users
  content: String,           // Max 2000 chars
  image: String,             // Optional, Cloudinary URL
  status: String,            // "sent" | "delivered" | "seen"
  seenBy: [
    {
      userId: ObjectId,
      seenAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ conversation: 1, createdAt: -1 }
{ sender: 1, createdAt: -1 }
{ status: 1 }
```

**Static Methods to Implement:**

1. **`Message.createMessage(conversationId, senderId, content, image)`**
   - Create message with validation

2. **`Message.markAsSeen(conversationId, userId)`**
   - Mark all unread messages as seen for user

3. **`Message.getConversationMessages(conversationId, before, limit)`**
   - Get paginated messages with cursor

**Test Cases:**
File: `/server/spec/models/messageModel.spec.js`

**Schema Validation:**
- ✓ Should require conversation field
- ✓ Should require sender field
- ✓ Should require either content or image
- ✓ Should validate content max length (2000 chars)
- ✓ Should validate image URL format
- ✓ Should default status to "sent"
- ✓ Should validate status enum
- ✓ Should initialize seenBy as empty array
- ✓ Should auto-set createdAt and updatedAt

**Static Method Tests:**
- ✓ createMessage: Should create with content only
- ✓ createMessage: Should create with image only
- ✓ createMessage: Should create with both content and image
- ✓ createMessage: Should reject without content or image
- ✓ createMessage: Should reject invalid conversation
- ✓ createMessage: Should reject invalid sender
- ✓ markAsSeen: Should update status to "seen"
- ✓ markAsSeen: Should add userId to seenBy array
- ✓ markAsSeen: Should not duplicate userId in seenBy
- ✓ markAsSeen: Should handle multiple users
- ✓ getConversationMessages: Should return messages in order
- ✓ getConversationMessages: Should paginate correctly
- ✓ getConversationMessages: Should filter by "before" cursor

**Acceptance Criteria:**
- [ ] Model created with proper schema
- [ ] All indexes defined
- [ ] All static methods implemented
- [ ] All validation rules enforced
- [ ] All test cases passing

---

### T068: Create Message Helpers
**Type**: Utility  
**User Story**: Foundation  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/utils/messageHelpers.js`

**Functions to Implement:**

1. **`isParticipant(conversationId, userId)`**
   - Check if user is participant in conversation
   - Output: Promise<boolean>

2. **`canSendMessage(senderId, recipientId)`**
   - Check if sender can message recipient (not blocked)
   - Output: Promise<{ canSend: boolean, reason: string | null }>

3. **`formatConversation(conversation, currentUserId)`**
   - Format conversation for API response
   - Include unread count for current user
   - Include participant online status
   - Output: Promise<object>

4. **`formatMessage(message)`**
   - Format message for API response
   - Populate sender details
   - Output: Promise<object>

**Test Cases:**
File: `/server/spec/utils/messageHelpers.spec.js`

- ✓ isParticipant: Should return true if user in participants
- ✓ isParticipant: Should return false if user not in participants
- ✓ isParticipant: Should handle invalid conversation ID
- ✓ canSendMessage: Should allow if not blocked
- ✓ canSendMessage: Should prevent if blocked by recipient
- ✓ canSendMessage: Should prevent if blocker
- ✓ formatConversation: Should include unread count for user
- ✓ formatConversation: Should format individual conversation
- ✓ formatConversation: Should format group conversation
- ✓ formatConversation: Should include online status
- ✓ formatMessage: Should populate sender details
- ✓ formatMessage: Should include seenBy information

**Acceptance Criteria:**
- [ ] All helper functions implemented
- [ ] Functions are reusable across controllers
- [ ] All test cases passing
- [ ] Proper error handling

---

## Phase 2: User Story 1 - View Conversations

### T069: Implement Get Conversations Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 1.5 days  
**Depends On**: T066, T067, T068, Epic 1, Epic 2  
**Priority**: P0

**Target File:**
- `/server/controllers/conversation/getConversationsController.js`

**Function to Implement:**

**`getConversations(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
  - `req.query.page` (number, default: 1)
  - `req.query.limit` (number, default: 20, max: 100)
- **Output**: JSON response with paginated conversations (200) or error (500)

**Implementation Steps:**
1. Get current user from req.user
2. Query conversations where user is participant
3. Sort by updatedAt (most recent first)
4. Populate participant details (name, profilePicture, lastSeen)
5. Include unread count for current user
6. Format using formatConversation helper
7. Return paginated response

**Test Cases:**
File: `/server/spec/controllers/conversation/getConversationsController.spec.js`

- ✓ Should return paginated list of conversations
- ✓ Should sort by most recent first (updatedAt desc)
- ✓ Should include unread count for current user
- ✓ Should include last message preview
- ✓ Should include participant details
- ✓ Should show online status for individual chats
- ✓ Should handle empty conversation list
- ✓ Should respect pagination limits
- ✓ Should default to page 1 and limit 20
- ✓ Should cap limit at 100
- ✓ Should include both individual and group conversations
- ✓ Should exclude conversations where user was removed
- ✓ Should handle database errors gracefully
- ✓ Should format individual conversations correctly
- ✓ Should format group conversations correctly
- ✓ Should calculate total pages correctly
- ✓ Should return 200 with valid data
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Returns all user's conversations
- [ ] Sorted by most recent activity
- [ ] Includes unread counts
- [ ] Pagination working correctly
- [ ] All test cases passing

---

### T070: Implement Get Conversation by ID Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 1 day  
**Depends On**: T066, T068, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/conversation/getConversationController.js`

**Function to Implement:**

**`getConversation(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.user` (object - from checkAuth)
- **Output**: JSON response with conversation details (200) or error (403/404/500)

**Implementation Steps:**
1. Validate conversationId parameter
2. Find conversation by ID
3. Verify user is participant
4. Populate all participant details
5. Format using formatConversation helper
6. Return conversation details

**Test Cases:**
File: `/server/spec/controllers/conversation/getConversationController.spec.js`

- ✓ Should return conversation details if user is participant
- ✓ Should include all participant details
- ✓ Should include group name and image for groups
- ✓ Should include admin info for groups
- ✓ Should return 403 if user not participant
- ✓ Should return 404 if conversation not found
- ✓ Should return 400 for invalid conversation ID
- ✓ Should populate participant online status
- ✓ Should format individual conversation correctly
- ✓ Should format group conversation correctly
- ✓ Should return 500 on server error
- ✓ Should handle deleted participants gracefully

**Acceptance Criteria:**
- [ ] Returns full conversation details
- [ ] Verifies user authorization
- [ ] Includes all participant info
- [ ] All test cases passing

---

## Phase 3: User Story 2 - Create Conversations

### T071: Implement Create Individual Conversation Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1 day  
**Depends On**: T066, T068, Epic 1, Epic 2  
**Priority**: P0

**Target File:**
- `/server/controllers/conversation/createConversationController.js`

**Function to Implement:**

**`createConversation(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
  - `req.body.participantId` (string)
- **Output**: JSON response with conversation (201/200) or error (400/403/500)

**Implementation Steps:**
1. Validate participantId
2. Check if trying to message self (reject)
3. Check if blocked (in either direction)
4. Check if conversation already exists
5. If exists, return existing conversation (200)
6. If not, create new conversation (201)
7. Format and return conversation

**Test Cases:**
File: `/server/spec/controllers/conversation/createConversationController.spec.js`

- ✓ Should create new individual conversation
- ✓ Should return existing conversation if already exists
- ✓ Should return 201 for new conversation
- ✓ Should return 200 for existing conversation
- ✓ Should return 400 if trying to message self
- ✓ Should return 400 if participantId missing
- ✓ Should return 400 if participantId invalid
- ✓ Should return 404 if participant user not found
- ✓ Should return 403 if blocked by participant
- ✓ Should return 403 if blocker of participant
- ✓ Should sort participants array consistently
- ✓ Should set type to "individual"
- ✓ Should not set name or admin for individual
- ✓ Should initialize unreadCount as empty
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Creates or returns existing conversation
- [ ] Prevents self-messaging
- [ ] Respects blocking relationships
- [ ] All test cases passing

---

### T072: Implement Create Group Conversation Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1.5 days  
**Depends On**: T066, T068, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/conversation/createGroupConversationController.js`

**Function to Implement:**

**`createGroupConversation(req, res)`**
- **Input**:
  - `req.user` (object - from checkAuth)
  - `req.body.name` (string, required)
  - `req.body.participantIds` (array, required)
  - `req.body.image` (string, optional)
- **Output**: JSON response with group conversation (201) or error (400/500)

**Implementation Steps:**
1. Validate name (2-100 chars)
2. Validate participantIds array (2-99 + creator = max 100)
3. Check all participants exist
4. Add creator to participants
5. Sort participants array
6. Set creator as admin
7. Create group conversation
8. Return formatted conversation

**Test Cases:**
File: `/server/spec/controllers/conversation/createGroupConversationController.spec.js`

- ✓ Should create group conversation with valid data
- ✓ Should return 201 with created group
- ✓ Should set creator as admin
- ✓ Should include creator in participants automatically
- ✓ Should return 400 if name missing
- ✓ Should return 400 if name too short (< 2 chars)
- ✓ Should return 400 if name too long (> 100 chars)
- ✓ Should return 400 if participantIds missing
- ✓ Should return 400 if participantIds not array
- ✓ Should return 400 if too few participants (< 2 other users)
- ✓ Should return 400 if too many participants (> 99 + creator)
- ✓ Should return 404 if any participant not found
- ✓ Should return 400 if invalid image URL
- ✓ Should set type to "group"
- ✓ Should sort participants array
- ✓ Should initialize unreadCount for all participants
- ✓ Should allow creating without image
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Creates group conversation
- [ ] Validates all inputs
- [ ] Sets creator as admin
- [ ] Enforces participant limits
- [ ] All test cases passing

---

## Phase 4: User Story 3 - Send/View Messages

### T073: Implement Get Messages Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 1.5 days  
**Depends On**: T066, T067, T068, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/message/getMessagesController.js`

**Function to Implement:**

**`getMessages(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.user` (object - from checkAuth)
  - `req.query.before` (timestamp, optional)
  - `req.query.limit` (number, default: 20, max: 100)
- **Output**: JSON response with paginated messages (200) or error (403/404/500)

**Implementation Steps:**
1. Validate conversationId
2. Verify user is participant
3. Build query with before cursor if provided
4. Get messages sorted by createdAt desc
5. Populate sender details
6. Format messages using helper
7. Return paginated response

**Test Cases:**
File: `/server/spec/controllers/message/getMessagesController.spec.js`

- ✓ Should return paginated messages
- ✓ Should sort by createdAt desc (newest first)
- ✓ Should include sender details
- ✓ Should include seenBy information
- ✓ Should return 403 if user not participant
- ✓ Should return 404 if conversation not found
- ✓ Should return 400 for invalid conversation ID
- ✓ Should filter by "before" cursor when provided
- ✓ Should respect limit parameter
- ✓ Should default to limit 20
- ✓ Should cap limit at 100
- ✓ Should return empty array if no messages
- ✓ Should include message status
- ✓ Should populate sender profile picture
- ✓ Should populate sender username
- ✓ Should handle content-only messages
- ✓ Should handle image-only messages
- ✓ Should handle messages with both content and image
- ✓ Should return correct pagination metadata
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Returns paginated messages
- [ ] Cursor-based pagination works
- [ ] Verifies user authorization
- [ ] Includes all message details
- [ ] All test cases passing

---

### T074: Implement Send Message Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 2 days  
**Depends On**: T066, T067, T068, Epic 1, T082  
**Priority**: P0

**Target File:**
- `/server/controllers/message/sendMessageController.js`

**Function to Implement:**

**`sendMessage(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.user` (object - from checkAuth)
  - `req.body.content` (string, optional)
  - `req.body.image` (file, optional) -> check middelware/uploade.js
- **Output**: JSON response with created message (201) or error (400/403/500)

**Implementation Steps:**
1. Validate conversationId
2. Verify user is participant
3. Validate content or image present
4. Create message with status "sent"
5. Update conversation lastMessage
6. Update conversation updatedAt
7. Increment unreadCount for other participants
8. Emit real-time event to other participants (Socket.io)
9. Return created message

**Test Cases:**
File: `/server/spec/controllers/message/sendMessageController.spec.js`

- ✓ Should create message with content only
- ✓ Should create message with image only
- ✓ Should create message with both content and image
- ✓ Should return 201 with created message
- ✓ Should return 400 if both content and image missing
- ✓ Should return 400 if content exceeds 2000 chars
- ✓ Should return 400 if invalid image URL
- ✓ Should return 403 if user not participant
- ✓ Should return 404 if conversation not found
- ✓ Should return 400 for invalid conversation ID
- ✓ Should update conversation lastMessage
- ✓ Should update conversation updatedAt
- ✓ Should increment unreadCount for other participants
- ✓ Should not increment unreadCount for sender
- ✓ Should set message status to "sent"
- ✓ Should emit real-time event to participants
- ✓ Should not emit to sender (already has message)
- ✓ Should include sender details in response
- ✓ Should work for individual conversations
- ✓ Should work for group conversations
- ✓ Should trim whitespace from content
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Creates message successfully
- [ ] Updates conversation metadata
- [ ] Increments unread counts
- [ ] Emits real-time event
- [ ] All test cases passing

---

## Phase 5: User Story 4 - Group Management

### T075: Implement Add/Remove Group Members Controllers
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 1.5 days  
**Depends On**: T066, T068, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/conversation/groupMembersController.js`

**Functions to Implement:**

**`addGroupMember(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.user` (object - from checkAuth)
  - `req.body.userId` (string)
- **Output**: JSON response (200) or error (400/403/500)

**`removeGroupMember(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.params.userId` (string)
  - `req.user` (object - from checkAuth)
- **Output**: JSON response (204) or error (400/403/500)

**Test Cases:**
File: `/server/spec/controllers/conversation/groupMembersController.spec.js`

**addGroupMember:**
- ✓ Should add member to group
- ✓ Should return 200 with success message
- ✓ Should return 403 if not admin
- ✓ Should return 403 if not group conversation
- ✓ Should return 400 if user already member
- ✓ Should return 400 if group at max capacity (100 members)
- ✓ Should return 404 if user to add not found
- ✓ Should return 404 if conversation not found
- ✓ Should initialize unreadCount for new member
- ✓ Should allow admin to add multiple members
- ✓ Should return 500 on server error

**removeGroupMember:**
- ✓ Should remove member from group
- ✓ Should return 204 on success
- ✓ Should return 403 if not admin
- ✓ Should return 403 if not group conversation
- ✓ Should return 400 if user not in group
- ✓ Should return 400 if trying to remove admin (use leave instead)
- ✓ Should return 404 if conversation not found
- ✓ Should remove user from unreadCount map
- ✓ Should allow admin to remove multiple members
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Admin can add/remove members
- [ ] Non-admin cannot modify membership
- [ ] Group capacity enforced
- [ ] All test cases passing

---

### T076: Implement Leave Group Controller
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 0.5 days  
**Depends On**: T066, T068, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/conversation/leaveGroupController.js`

**Function to Implement:**

**`leaveGroup(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.user` (object - from checkAuth)
- **Output**: JSON response (200) or error (400/403/500)

**Test Cases:**
File: `/server/spec/controllers/conversation/leaveGroupController.spec.js`

- ✓ Should remove user from group participants
- ✓ Should return 200 with success message
- ✓ Should return 400 if not group conversation
- ✓ Should return 400 if user not in group
- ✓ Should return 404 if conversation not found
- ✓ Should assign new admin if admin leaves
- ✓ Should assign oldest member as new admin
- ✓ Should delete group if last member leaves
- ✓ Should remove user from unreadCount
- ✓ Should allow non-admin to leave
- ✓ Should allow admin to leave
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] User can leave group
- [ ] Admin transfer works correctly
- [ ] Group cleanup on last member
- [ ] All test cases passing

---

### T077: Implement Update Group Info Controller
**Type**: Controller  
**User Story**: US4  
**Estimated Effort**: 0.5 days  
**Depends On**: T066, T068, Epic 1  
**Priority**: P0

**Target File:**
- `/server/controllers/conversation/updateGroupController.js`

**Function to Implement:**

**`updateGroupInfo(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.user` (object - from checkAuth)
  - `req.body.name` (string, optional)
  - `req.body.image` (file, optional) -> check middelware/upload.js
- **Output**: JSON response with updated conversation (200) or error (400/403/500)

**Test Cases:**
File: `/server/spec/controllers/conversation/updateGroupController.spec.js`

- ✓ Should update group name
- ✓ Should update group image
- ✓ Should update both name and image
- ✓ Should return 200 with updated conversation
- ✓ Should return 403 if not admin
- ✓ Should return 403 if not group conversation
- ✓ Should return 404 if conversation not found
- ✓ Should return 400 if name too short
- ✓ Should return 400 if name too long
- ✓ Should return 400 if invalid image URL

**Acceptance Criteria:**
- [ ] Admin can update group info
- [ ] Validates all inputs
- [ ] Non-admin cannot update
- [ ] All test cases passing

---

## Phase 6: User Story 5 - Message Status & Real-time

### T078: Implement Mark as Seen Controller
**Type**: Controller  
**User Story**: US5  
**Estimated Effort**: 1 day  
**Depends On**: T066, T067, Epic 1, T082  
**Priority**: P0

**Target File:**
- `/server/controllers/message/markAsSeenController.js`

**Function to Implement:**

**`markAsSeen(req, res)`**
- **Input**:
  - `req.params.conversationId` (string)
  - `req.user` (object - from checkAuth)
- **Output**: JSON response (200) or error (403/404/500)

**Implementation Steps:**
1. Verify user is participant
2. Find all unread messages in conversation
3. Update status to "seen"
4. Add userId to seenBy array
5. Reset unreadCount for user
6. Emit real-time "seen" event to other participants
7. Return success response

**Test Cases:**
File: `/server/spec/controllers/message/markAsSeenController.spec.js`

- ✓ Should mark all unread messages as seen
- ✓ Should return 200 with success message
- ✓ Should return 403 if user not participant
- ✓ Should return 404 if conversation not found
- ✓ Should add user to seenBy array of all messages
- ✓ Should reset unreadCount to 0 for user
- ✓ Should not duplicate user in seenBy
- ✓ Should emit real-time "seen" event
- ✓ Should include conversation ID in event
- ✓ Should include user ID in event
- ✓ Should handle empty unread messages
- ✓ Should work for individual conversations
- ✓ Should work for group conversations
- ✓ Should not affect other users' unread counts
- ✓ Should return 500 on server error

**Acceptance Criteria:**
- [ ] Marks messages as seen
- [ ] Updates seenBy array
- [ ] Resets unread count
- [ ] Emits real-time event
- [ ] All test cases passing

---

### T079: Update User Last Seen
**Type**: Middleware Enhancement  
**User Story**: US5  
**Estimated Effort**: 0.5 days  
**Depends On**: Epic 1  
**Priority**: P0

**Target File:**
- `/server/middlewares/checkAuth.js`

**Implementation:**
- Add logic to update user.lastSeen on authenticated requests
- Throttle updates to once per 60 seconds
- No dedicated endpoint (passive update)

**Test Cases:**
File: `/server/spec/middlewares/checkAuth.spec.js`

- ✓ Should update lastSeen on authenticated request
- ✓ Should throttle updates to once per 60 seconds
- ✓ Should not update if last update was < 60 seconds ago
- ✓ Should not block request if update fails
- ✓ Should handle database errors gracefully
- ✓ Should work with existing auth middleware
- ✓ Should not affect unauthenticated requests
- ✓ Should use current timestamp for lastSeen

**Acceptance Criteria:**
- [ ] LastSeen updates automatically
- [ ] Updates are throttled
- [ ] No performance impact
- [ ] All test cases passing

---

## Phase 7: WebSocket & Real-time (MVP Essential)

### T080: Setup Socket.io Server
**Type**: Infrastructure  
**User Story**: US3, US5  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: No  
**Priority**: Blocking

**Target File:**
- `/server/utils/socketServer.js`

**Implementation:**
- Setup Socket.io server attached to Express
- Implement authentication middleware for Socket.io
- Store userId → socketId mappings
- Handle connect/disconnect events
- Update user online status

**Test Cases:**
File: `/server/spec/utils/socketServer.spec.js`

- ✓ Should setup Socket.io server successfully
- ✓ Should authenticate socket connection with JWT
- ✓ Should reject connection without valid JWT
- ✓ Should store userId → socketId mapping on connect
- ✓ Should remove mapping on disconnect
- ✓ Should handle multiple connections per user
- ✓ Should update user online status on connect
- ✓ Should update user lastSeen on disconnect
- ✓ Should emit online status to user's contacts
- ✓ Should handle reconnection scenarios
- ✓ Should clean up resources on disconnect
- ✓ Should handle authentication errors gracefully
- ✓ Should support CORS for client connections
- ✓ Should handle concurrent connections
- ✓ Should log connection events

**Acceptance Criteria:**
- [ ] Socket.io server running
- [ ] Authentication working
- [ ] User mappings maintained
- [ ] Online status tracking
- [ ] All test cases passing

---

### T081: Implement Real-time Message Events
**Type**: WebSocket Events  
**User Story**: US3, US5  
**Estimated Effort**: 1.5 days  
**Depends On**: T080, T066, T067  
**Priority**: P0

**Target File:**
- `/server/utils/socketEvents.js`

**Events to Implement:**

1. **`message:send`** - Real-time message delivery
2. **`message:seen`** - Seen status updates
3. **`typing:start`** - User starts typing
4. **`typing:stop`** - User stops typing
5. **`online:status`** - User online/offline status

**Test Cases:**
File: `/server/spec/utils/socketEvents.spec.js`

**message:send:**
- ✓ Should emit to all conversation participants except sender
- ✓ Should include message data in event
- ✓ Should work for individual conversations
- ✓ Should work for group conversations
- ✓ Should handle offline participants gracefully
- ✓ Should not emit to blocked users

**message:seen:**
- ✓ Should emit to message sender when seen
- ✓ Should include userId and conversationId
- ✓ Should work for individual conversations
- ✓ Should work for group conversations
- ✓ Should handle multiple users seeing message

**typing:start / typing:stop:**
- ✓ Should emit to conversation participants
- ✓ Should include userId and conversationId
- ✓ Should not emit to self
- ✓ Should throttle typing events (max 1 per second)
- ✓ Should auto-stop typing after 3 seconds

**online:status:**
- ✓ Should emit when user connects
- ✓ Should emit when user disconnects
- ✓ Should emit to user's contacts only
- ✓ Should include userId and status (online/offline)
- ✓ Should include lastSeen for offline status

**Acceptance Criteria:**
- [ ] All events implemented
- [ ] Events emitted to correct recipients
- [ ] Event data properly formatted
- [ ] All test cases passing

---

## Phase 8: Routes & Integration

### T082: Create Message and Conversation Routes
**Type**: Routes  
**Estimated Effort**: 0.5 days  
**Depends On**: T069-T079  
**Priority**: P0

**Target Files:**
- `/server/routes/conversationRoutes.js`
- `/server/routes/messageRoutes.js`

**Routes:**

**conversationRoutes.js:**
```javascript
GET    /conversations
GET    /conversations/:conversationId
POST   /conversations
POST   /conversations/group
POST   /conversations/:conversationId/members
DELETE /conversations/:conversationId/members/:userId
POST   /conversations/:conversationId/leave
PATCH  /conversations/:conversationId
```

**messageRoutes.js:**
```javascript
GET    /conversations/:conversationId/messages
POST   /conversations/:conversationId/messages
POST   /conversations/:conversationId/seen
```

**Acceptance Criteria:**
- [ ] All routes properly defined
- [ ] Correct middleware applied (checkAuth)
- [ ] Clean controller imports
- [ ] Routes mounted in app.js
- [ ] All endpoints accessible

---

### T083: Create Controller Index Files
**Type**: Structure  
**Estimated Effort**: 0.25 days  
**Depends On**: T069-T079  
**Priority**: P0

**Target Files:**
- `/server/controllers/conversation/index.js`
- `/server/controllers/message/index.js`

**Purpose:** Export all controller functions for clean imports

**Acceptance Criteria:**
- [ ] Clean imports in routes
- [ ] All functions exported
- [ ] Consistent with Epic 1-6 patterns

---

### T084: Create Messaging Integration Tests
**Type**: Testing  
**Estimated Effort**: 2 days  
**Depends On**: T069-T083  
**Priority**: P0

**Target File:**
- `/server/spec/integration/messaging.integration.spec.js`

**Test Scenarios:**

**Individual Conversations:**
- ✓ Complete flow: create conversation, send messages, mark as seen
- ✓ Finding and returning existing conversation
- ✓ Blocking prevents conversation creation
- ✓ Unread counts update correctly
- ✓ Last message preview updates
- ✓ Message pagination works

**Group Conversations:**
- ✓ Create group with multiple participants
- ✓ Send messages to group
- ✓ All participants receive messages
- ✓ SeenBy tracking with multiple users
- ✓ Add/remove members as admin
- ✓ Non-admin cannot modify membership
- ✓ Leave group as member
- ✓ Leave group as admin (transfer admin)
- ✓ Update group name and image

**Real-time Features:**
- ✓ Messages delivered in real-time
- ✓ Typing indicators work
- ✓ Seen status updates in real-time
- ✓ Online status updates
- ✓ Multiple device support

**Acceptance Criteria:**
- [ ] 50+ integration test cases passing
- [ ] All user flows tested end-to-end
- [ ] Real-time features verified
- [ ] Edge cases covered

---

### T085: Update API Documentation for Messaging
**Type**: Documentation  
**Estimated Effort**: 0.5 days  
**Depends On**: T082  
**Priority**: P0

**Target Files:**
- `/server/docs/conversation.yaml`
- `/server/docs/message.yaml`

**Content:**
- All conversation endpoints
- All message endpoints
- Request/response schemas
- WebSocket event documentation
- Error codes and messages

**Acceptance Criteria:**
- [ ] All endpoints documented
- [ ] WebSocket events documented
- [ ] Examples provided
- [ ] Integrated into docs/index.js

---

## Summary

**Total Tasks**: 20 (T066-T085)
- **Models**: 2 tasks (T066, T067)
- **Utilities**: 1 task (T068)
- **Conversation Controllers**: 6 tasks (T069-T072, T075-T077)
- **Message Controllers**: 2 tasks (T073, T074, T078)
- **Middleware**: 1 task (T079)
- **WebSocket**: 2 tasks (T080, T081)
- **Routes & Testing**: 3 tasks (T082-T084)
- **Documentation**: 1 task (T085)
- **Structure**: 1 task (T083)

**Estimated Total Effort**: 12-15 days  
**Dependencies**: Epic 1, Epic 2, Epic 4

**File Structure:**
```
server/
├── controllers/
│   ├── conversation/
│   │   ├── index.js
│   │   ├── getConversationsController.js
│   │   ├── getConversationController.js
│   │   ├── createConversationController.js
│   │   ├── createGroupConversationController.js
│   │   ├── groupMembersController.js
│   │   ├── leaveGroupController.js
│   │   └── updateGroupController.js
│   └── message/
│       ├── index.js
│       ├── getMessagesController.js
│       ├── sendMessageController.js
│       └── markAsSeenController.js
├── utils/
│   ├── messageHelpers.js
│   ├── socketServer.js
│   └── socketEvents.js
├── models/
│   ├── Conversation.js
│   └── Message.js
├── routes/
│   ├── conversationRoutes.js
│   └── messageRoutes.js
└── docs/
    ├── conversation.yaml
    └── message.yaml
```

**Key Features:**
- ✅ Individual and group conversations
- ✅ Real-time message delivery (Socket.io)
- ✅ Real-time typing indicators
- ✅ Message status tracking (sent/delivered/seen)
- ✅ Online/last seen status
- ✅ Group admin management
- ✅ Pagination with cursor support
- ✅ Image messages
- ✅ Unread message counts

**Definition of Done:**
- [ ] All models, controllers, routes implemented
- [ ] All utility functions tested and working
- [ ] All test cases passing (180+ scenarios)
- [ ] WebSocket server running and tested
- [ ] Real-time events working
- [ ] API documentation complete
- [ ] Code follows Epic 1-6 patterns
- [ ] Manual testing successful
