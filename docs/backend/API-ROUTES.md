# API Reference — Routes Implemented in `server/routes`

This document lists only the endpoints defined under `server/routes/`, grouped by Epic → Integration (based on `.specify/tasks`). It reflects the actual mounted paths in `server/app.js` (no `/api` prefix), the unified success and error formats, and the authentication middleware behavior.

## Base URL and Authentication

- Base URL (local default): `http://localhost:3030`
- Auth header: `Authorization: Bearer <JWT>`
- Middlewares:
  - `checkAuth` (required auth): rejects with 401/403 on missing/invalid/expired token or blocked user.
  - `optionalAuth` (optional): attaches `req.user` if a valid token is present, continues anonymously otherwise.

## Unified Response Formats

### Success (from `server/utils/responseHelpers.js`)

- Shape:
  - `success`: boolean (true)
  - `message`: optional string (included only when provided by controller)
  - `data`: object (endpoint-specific payload)
  - `meta`: optional object

Example (with message):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "fullName": "Jane Doe",
    "bio": "..."
  }
}
```

Example (without message):
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

### Error (from `server/middlewares/errorHandler.js` and `checkAuth.js`)

- Shape:
  - `success`: false
  - `error`: object with:
    - `code`: string
    - `message`: string
    - `details`: optional (may be string or object, e.g., `{ fields: { ... } }` for validation)
    - `fields`: optional object for Mongoose validation shape

Examples:
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "fields": { "email": "Email is required" } }
}
```

```json
{
  "success": false,
  "error": { "code": "INVALID_TOKEN", "message": "Invalid token" }
}
```

Common error codes observed in codebase:

- Auth/middleware: `NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `USER_NOT_FOUND`, `ACCOUNT_BLOCKED`, `AUTH_ERROR`, `NOT_AUTHENTICATED`, `INSUFFICIENT_PERMISSIONS`
- Global handler: `VALIDATION_ERROR`, `INVALID_ID`, `DUPLICATE_ENTRY`, `UPLOAD_ERROR`, `INTERNAL_ERROR`
- Rate limiting (auth routes): `TOO_MANY_REQUESTS`
- 404 handler: `ROUTE_NOT_FOUND`

Note: Controllers also throw domain errors via `utils/errors` (mapped by the global handler to the unified format).

---

## Epic 1: Authentication — Integration

Route base: `/auth` (`server/routes/authRoutes.js`)

1) POST `/auth/register`
- Purpose: Register a new user
- Auth: Public
- Body (JSON): `{ email: string, password: string, username: string, fullName: string }`
- Success: 201
  - Example:
  ```json
  {
    "success": true,
    "message": "Resource created successfully",
    "data": { "user": { /* user fields (no password) */ }, "token": "<jwt>" }
  }
  ```
- Possible errors: `VALIDATION_ERROR` (fields), `EMAIL_EXISTS` (via ConflictError mapped to 409 -> `DUPLICATE_ENTRY` for Mongo unique, or custom code), rate limit `TOO_MANY_REQUESTS`.

2) POST `/auth/login`
- Purpose: Login and get JWT
- Auth: Public
- Body (JSON): `{ email: string, password: string }`
- Success: 200
  - Example:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": { "token": "<jwt>", "user": { /* user fields */ } }
  }
  ```
- Possible errors: `VALIDATION_ERROR`, `INVALID_CREDENTIALS` (auth error), `ACCOUNT_BLOCKED`, rate limit `TOO_MANY_REQUESTS`.

3) POST `/auth/password-reset/request`
- Purpose: Initiate password reset
- Auth: Public
- Body (JSON): `{ email: string }`
- Success: 200
  - Example:
  ```json
  {
    "success": true,
    "data": {},
    "message": "If email exists in our system, a password reset link has been sent"
  }
  ```
- Possible errors: `VALIDATION_ERROR`

4) POST `/auth/password-reset/confirm`
- Purpose: Confirm password reset
- Auth: Public
- Body (JSON): `{ token: string, newPassword: string }`
- Success: 200
  - Example:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Password reset successful. You can now login with your new password."
  }
  ```
- Possible errors: `VALIDATION_ERROR`, `INVALID_TOKEN`, `TOKEN_EXPIRED`

Headers (for rate-limited endpoints): standard, no custom headers required beyond JSON content.

---

## Epic 2: User Profiles & Social — Integration

Routes: `/users/...` and connections under `/users/:userId/(follow|followers|following)`.

1) GET `/users/:username`
- Purpose: Get user profile by username
- Auth: Optional (`optionalAuth`) — adds relationship metadata when authenticated
- Params: `username` (string)
- Success example:
```json
{
  "success": true,
  "data": { /* sanitized profile with relationship flags when applicable */ }
}
```
- Errors: `NotFoundError` → `VALIDATION_ERROR`/`INTERNAL_ERROR` mapping is centralized; specifically throws `NotFoundError('User')` → unified error with 404 code depending on implementation.

2) PUT `/users/profile`
- Purpose: Update own profile
- Auth: Required (`checkAuth`)
- Body (JSON): any subset of allowed fields per `UPDATABLE_PROFILE_FIELDS`:
  - `fullName` (string, length validated)
  - `bio` (string, max length)
  - `specialization` (string|null)
  - `location` (string|null)
- Success example:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated sanitized profile (email included for own profile) */ }
}
```
- Errors: `VALIDATION_ERROR`, `User not found`

3) POST `/users/profile/picture`
- Purpose: Upload/update profile picture
- Auth: Required
- Upload: `multipart/form-data` with field `image` (JPEG/PNG/WebP)
- Success example:
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": { "profilePicture": "https://..." }
}
```
- Errors: `VALIDATION_ERROR` (no file), `UPLOAD_ERROR`, `User not found`

4) POST `/users/profile/cover`
- Purpose: Upload/update cover image
- Auth: Required
- Upload: `multipart/form-data` with field `image`
- Success example:
```json
{
  "success": true,
  "message": "Cover image updated successfully",
  "data": { "coverImage": "https://..." }
}
```
- Errors: `VALIDATION_ERROR`, `UPLOAD_ERROR`, `User not found`

5) POST `/users/:userId/follow`
- Purpose: Follow a user
- Auth: Required
- Params: `userId` (ObjectId)
- Success example:
```json
{
  "success": true,
  "message": "Successfully followed user",
  "data": { "followedUserId": "<id>", "followedAt": "2025-12-17T12:00:00.000Z" }
}
```
- Errors: `VALIDATION_ERROR`, `NotFoundError`

6) DELETE `/users/:userId/follow`
- Purpose: Unfollow a user
- Auth: Required
- Success example: `{ success: true, message: "Successfully unfollowed user", data: { "unfollowedUserId": "<id>" } }`

7) GET `/users/:userId/followers`
- Purpose: Paginated followers list
- Auth: Optional
- Query: `page`, `limit`
- Success example includes pagination inside `data`.

8) GET `/users/:userId/following`
- Purpose: Paginated following list
- Auth: Optional
- Query: `page`, `limit`

9) POST `/users/:userId/block`
- Purpose: Block a user (also removes follow relationships both ways)
- Auth: Required
- Success example: `{ success: true, message: "Successfully blocked user", data: { "blockedUserId": "<id>", "blockedAt": "..." } }`

10) DELETE `/users/:userId/block`
- Purpose: Unblock a user
- Auth: Required
- Success example: `{ success: true, message: "Successfully unblocked user", data: { "unblockedUserId": "<id>" } }`

---

## Epic 3: Posts & Comments — Integration

Routes: `/posts` and `/comments`.

Posts

1) POST `/posts`
- Purpose: Create post (content and/or images, optional community)
- Auth: Required
- Upload: `multipart/form-data` with `images` (max per constraints). Body JSON fields may include `content`, `tags`, `community`.
- Success: 201 — `{ success: true, message: "Resource created successfully", data: { post: { ... } } }`

2) GET `/posts/saved`
- Purpose: Get current user’s saved posts (paginated)
- Auth: Required
- Query: `page`, `limit`
- Success: `{ success: true, data: { posts: [ ... ], pagination: { ... } } }`

3) GET `/posts/:id`
- Purpose: Get post by ID (adds `isLiked`/`isSaved` when authenticated)
- Auth: Optional

4) PATCH `/posts/:id`
- Purpose: Update a post (content, tags)
- Auth: Required
- Body (JSON): allowed update fields based on validators: `content`, `tags`

5) DELETE `/posts/:id`
- Purpose: Delete a post and related data
- Auth: Required
- Success: 204 No Content (no body)

6) POST `/posts/:id/like` and DELETE `/posts/:id/like`
- Purpose: Like/Unlike post
- Auth: Required
- Success (like): `{ success: true, message: "Post liked successfully", data: { isLiked: true, likesCount: <number> } }`
- Success (unlike): `{ success: true, message: "Post unliked successfully", data: { isLiked: false, likesCount: <number> } }`

7) POST `/posts/:id/save` and DELETE `/posts/:id/save`
- Purpose: Save/Unsave post
- Auth: Required
- Success mirrors like/unlike with `isSaved`

8) POST `/posts/:id/repost`
- Purpose: Repost a post (optional comment)
- Auth: Required
- Body (JSON): `{ comment?: string }`
- Success: 201 — `{ success: true, message: "Post reposted successfully", data: { post: { ... } } }`

Comments

9) POST `/posts/:postId/comments`
- Purpose: Create a comment or reply
- Auth: Required
- Body (JSON): `{ content: string, parentCommentId?: string }`
- Success: 201 — `{ success: true, message: "Comment created successfully", data: { comment: { ... } } }`

10) GET `/posts/:postId/comments`
- Purpose: Get comments (top-level or replies when `parentCommentId` provided)
- Auth: Optional
- Query: `page`, `limit`, `parentCommentId`

11) PUT `/comments/:id`
- Purpose: Update a comment’s content
- Auth: Required
- Body (JSON): `{ content: string }`

12) DELETE `/comments/:id`
- Purpose: Delete a comment (and replies if top-level)
- Auth: Required

13) POST `/comments/:id/like` and DELETE `/comments/:id/like`
- Purpose: Like/Unlike a comment
- Auth: Required

---

## Epic 4: File Upload & Media — Integration

Uploads are processed via `multer` in memory and validated against MIME types and size limits (`server/middlewares/upload.js`).

- POST `/users/profile/picture` — field: `image` (single)
- POST `/users/profile/cover` — field: `image` (single)
- POST `/communities/:id/profile-picture` — field: `image` (single)
- POST `/communities/:id/cover-image` — field: `image` (single)
- POST `/posts` — field: `images` (array)
- POST `/conversations/:conversationId/messages` — field: `image` (single), with optional text `content`

All above require `Authorization: Bearer <JWT>` except fetching resources. Errors surface via `MulterError` → unified `UPLOAD_ERROR` with HTTP 400 in the global handler.

---

## Epic 5: Feed & Discovery — Integration

Routes: `/feed`

1) GET `/feed/home`
- Purpose: Home feed (algorithmic for authenticated users; recent posts for guests)
- Auth: Optional
- Query: `page`, `limit`
- Success data includes `{ cached: boolean, feedType: "home", posts: [...], pagination: {...} }`

2) GET `/feed/following`
- Purpose: Following feed (chronological posts from followed users and joined communities)
- Auth: Required
- Query: `page`, `limit`
- Success data includes `{ cached: boolean, feedType: "following", posts: [...], pagination: {...} }`

3) GET `/feed/trending`
- Purpose: Trending feed (algorithmic, global)
- Auth: Optional
- Query: `page`, `limit`
- Success data includes `{ cached: boolean, feedType: "trending", posts: [...], pagination: {...} }`

Community feed (chronological):

4) GET `/communities/:communityId/feed`
- Purpose: Posts for a specific community
- Auth: Optional
- Query: `page`, `limit`

---

## Epic 6: Communities — Integration

Routes: `/communities`

1) GET `/communities`
- Purpose: List communities (search/filter/paginate)
- Auth: Optional (adds `isJoined` when authenticated)
- Query: `page`, `limit`, `search`, `tags` (comma-separated or repeated)

2) POST `/communities`
- Purpose: Create a community (with optional images)
- Auth: Required
- Upload: `multipart/form-data` fields: `profilePicture` (file), `coverImage` (file); Body fields: `name`, `description`, `tags` (JSON array or stringified)
- Success: 201 — `{ success: true, message: "Community created successfully", data: { community: { ... } } }`

3) GET `/communities/:id`
- Purpose: Get community details (adds `isJoined`/`role` when authenticated)
- Auth: Optional

4) PATCH `/communities/:id`
- Purpose: Update community description (owner only)
- Auth: Required
- Body (JSON): `{ description: string }`

5) POST `/communities/:id/profile-picture`
- Purpose: Update profile picture (owner only)
- Auth: Required
- Upload: `multipart/form-data` field `image`

6) POST `/communities/:id/cover-image`
- Purpose: Update cover image (owner only)
- Auth: Required
- Upload: `multipart/form-data` field `image`

7) POST `/communities/:id/join`
- Purpose: Join community (idempotent)
- Auth: Required
- Success: 201 with message

8) POST `/communities/:id/leave`
- Purpose: Leave community (with ownership rule)
- Auth: Required

9) POST `/communities/:id/moderators`
- Purpose: Add moderator (owner/moderator only)
- Auth: Required
- Body (JSON): `{ userId: string }`

10) DELETE `/communities/:id/moderators/:userId`
- Purpose: Remove moderator (owner/moderator only; cannot remove owners)
- Auth: Required

---

## Epic 7: Messaging — Integration

Routes: `/conversations` (messages nested under a conversation)

1) GET `/conversations`
- Purpose: List user’s conversations (paginated)
- Auth: Required
- Query: `page`, `limit`

2) GET `/conversations/:conversationId`
- Purpose: Get a conversation (must be a participant)
- Auth: Required

3) POST `/conversations`
- Purpose: Create or return existing 1:1 conversation
- Auth: Required
- Body (JSON): `{ participantId: string }`
- Success: 200 if existed (with message), 201 if created

4) POST `/conversations/group`
- Purpose: Create a group conversation
- Auth: Required
- Body (JSON): `{ name: string, participantIds: string[], image?: string }`

5) POST `/conversations/:conversationId/members`
- Purpose: Add member (admin only)
- Auth: Required
- Body (JSON): `{ userId: string }`

6) DELETE `/conversations/:conversationId/members/:userId`
- Purpose: Remove member (admin only)
- Auth: Required

7) POST `/conversations/:conversationId/leave`
- Purpose: Leave group (admin triggers admin transfer logic as implemented)
- Auth: Required

8) PATCH `/conversations/:conversationId`
- Purpose: Update group details (admin only) — name and/or image
- Auth: Required
- Body (JSON or multipart for image): `{ name?: string }` with optional `image` upload field

9) GET `/conversations/:conversationId/messages`
- Purpose: Get messages (cursor pagination)
- Auth: Required
- Query: `cursor`, `limit`

10) POST `/conversations/:conversationId/messages`
- Purpose: Send message (text and/or image)
- Auth: Required
- Body: `multipart/form-data` with optional `content` and optional `image`

11) PUT `/conversations/:conversationId/seen`
- Purpose: Mark all messages as seen in a conversation
- Auth: Required

---

## Epic 8: Notifications — Integration

Routes: `/notifications`

1) GET `/notifications`
- Purpose: Paginated notifications for authenticated user
- Auth: Required
- Query: `page` (default 1, >=1), `limit` (default 20, max 50)
- Success example (note: controller puts a message string inside data for some endpoints like count):
```json
{
  "success": true,
  "data": {
    "notifications": [ /* populated notifications */ ],
    "unreadCount": 2,
    "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
  },
  "message": "Notifications retrieved successfully"
}
```

2) GET `/notifications/unread/count`
- Purpose: Get unread notifications count
- Auth: Required
- Success example (no outer message; the controller includes a message inside data):
```json
{
  "success": true,
  "data": { "message": "Unread count retrieved successfully", "unreadCount": 3 }
}
```

3) PUT `/notifications/read`
- Purpose: Mark all as read
- Auth: Required
- Success example:
```json
{
  "success": true,
  "data": { "message": "All notifications marked as read", "modifiedCount": 10, "unreadCount": 0 }
}
```

4) PUT `/notifications/:id/read`
- Purpose: Mark specific notification as read
- Auth: Required
- Params: `id` (ObjectId)

---

## Epic 9: Search — Integration

Route base: `/search`

1) GET `/search/users`
- Purpose: Search users (text search with optional specialization filter)
- Auth: Optional (adds `isFollowing` metadata when authenticated)
- Query: `q` (required, min length per constants), `specialization` (optional), `page`, `limit`

2) GET `/search/posts`
- Purpose: Search posts
- Auth: Optional (adds `hasLiked`/`hasSaved` when authenticated)
- Query: `q` (required), `type` (`original`|`repost`, optional), `communityId` (optional), `page`, `limit`

3) GET `/search/communities`
- Purpose: Search communities
- Auth: Optional (adds `isMember` when authenticated)
- Query: `q` (required), `tags` (comma-separated), `page`, `limit`

---

## Headers, Params, Query, and Bodies — Summary

- JSON endpoints: `Content-Type: application/json`
- Upload endpoints: `Content-Type: multipart/form-data` with field names as listed per route.
- All protected endpoints require `Authorization: Bearer <JWT>`.

---

## Example Unified Errors by Context

- Missing token (protected route):
```json
{ "success": false, "error": { "code": "NO_TOKEN", "message": "Authentication required" } }
```

- Invalid/expired token:
```json
{ "success": false, "error": { "code": "INVALID_TOKEN", "message": "Invalid token" } }
```
```json
{ "success": false, "error": { "code": "TOKEN_EXPIRED", "message": "Token has expired" } }
```

- Validation error (generic):
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed" } }
```

- Route not found:
```json
{ "success": false, "error": { "code": "ROUTE_NOT_FOUND", "message": "Cannot GET /unknown" } }
```

---

## Model Schemas (from `server/models/*`)

This section summarizes the Mongoose models used by the API. It covers key fields, constraints/validation, indexes, and notable instance/static methods. Refer to each model file for full details.

### User
- Fields: `username` (unique, lowercase, 3–30, `[a-z0-9_]`), `email` (unique, lowercase), `password` (select: false), `fullName` (2–100), `bio` (<=500), `profilePicture`, `coverImage`, `specialization`, `location`, `role` (`user|admin`), `isBlocked`, `blockReason`, denormalized counts (`followersCount`, `followingCount`, `postsCount`), password reset fields (`resetPasswordToken` select:false, `resetPasswordExpires`), presence fields (`isOnline`, `lastSeen`), timestamps.
- Indexes: Text index on `username`, `fullName`, `bio` with weights (username:10, fullName:5, bio:1).
- Methods: `comparePassword(candidatePassword)`, `generateAuthToken()` (JWT 7d), `generatePasswordResetToken()` (stores hash + 1h expiry).

### Post
- Fields: `author` (ref `User`), `content` (max per `MAX_POST_CONTENT_LENGTH`), `images` (<= `MAX_POST_IMAGES`), `tags` (ObjectId[] `Tag`, <= `MAX_POST_TAGS`), `community` (ref `Community`), `repostComment` (<= `MAX_REPOST_COMMENT_LENGTH`), `originalPost` (ref `Post`), counts (`likesCount`, `commentsCount`, `repostsCount`, `savesCount`), `editedAt`, timestamps.
- Validation: Requires `content` or `images` unless `originalPost` set (repost).
- Indexes: `{ author, createdAt }`, `{ community, createdAt }`, `{ tags, createdAt }`, `{ createdAt }`, `{ originalPost }`; text index on `content`.

### Comment
- Fields: `author` (ref `User`), `post` (ref `Post`), `content` (min/max per constants), `parentComment` (ref `Comment`), `likesCount`, `repliesCount`, `editedAt`, timestamps.
- Validation: Prevents nested replies deeper than one level.
- Indexes: `{ post, parentComment }`, `{ post, createdAt }`, `{ author }`.

### PostLike / PostSave / CommentLike
- Fields: `user` (ref `User`), target (`post` or `comment` ref).
- Indexes: Unique compound `{ user, post }` or `{ user, comment }`; query indexes on `{ user, createdAt }` and `{ post|comment, createdAt }`.

### Community
- Fields: `name` (2–100), `description` (<=1000), `profilePicture`, `coverImage`, `tags` (required, length between `MIN_COMMUNITY_TAGS`–`MAX_COMMUNITY_TAGS`, values from `COMMUNITY_TAGS`), counters (`memberCount`, `postCount` >= 0), `owners` (>=1, ref `User`), `moderators` (ref `User`), timestamps.
- Indexes: Case-insensitive unique on `name` (collation), `{ memberCount:-1 }`, `{ createdAt:-1 }`, `{ tags:1 }`; text index on `name`, `description`, `tags` with weights.
- Methods: `isOwner(userId)`, `isModerator(userId)`.

### CommunityMember
- Fields: `user` (ref `User`), `community` (ref `Community`), `role` (`member|moderator|owner`), timestamps.
- Indexes: Unique `{ user, community }`; `{ community:1 }`, `{ user:1 }`.
- Statics: `isEnrolled(userId, communityId)`, `getRole(userId, communityId)`.

### Connection
- Fields: `follower` (ref `User`), `following` (ref `User`), `type` (`follow|block`), timestamps.
- Indexes: Unique compound `{ follower, following, type }`; `{ following, type }`, `{ follower, type }`, `{ createdAt:-1 }`.
- Statics: `createFollow`, `removeFollow`, `createBlock` (removes follow in both directions and adjusts counts), `removeBlock`, `isFollowing`, `isBlocking`.

### Conversation
- Fields: `type` (from `CONVERSATION_TYPES`), `participants` (ref `User`[]), `name` (group only), `image` (URL), `admin` (group only), `lastMessage` (content/senderId/timestamp), `unreadCount` (Map<UserId, number>), timestamps.
- Validation: Participant count within bounds; group requires `name` and `admin`.
- Indexes: `{ participants:1, updatedAt:-1 }`, `{ participants:1, type:1 }`, `{ type:1 }`, `{ admin:1 }`.
- Statics: `findByParticipants(participantIds, type)`, `createIndividual(userId1, userId2)` (checks block), `createGroup(creatorId, name, participantIds, image)`, `updateUnreadCount(conversationId, userId, increment)`.

### Message
- Fields: `conversation` (ref `Conversation`), `sender` (ref `User`), `content` (<= `MAX_MESSAGE_CONTENT_LENGTH`), `image` (URL), `status` (from `MESSAGE_STATUS`, default `SENT`), `seenBy` [{ `userId` ref `User`, `seenAt` }], timestamps.
- Validation: Requires either `content` or `image`.
- Indexes: `{ conversation:1, createdAt:-1 }`, `{ sender:1, createdAt:-1 }`, `{ status:1 }`.
- Statics: `createMessage(conversationId, senderId, content, image)`, `markAsSeen(conversationId, userId)`, `getConversationMessages(conversationId, before?, limit?)`.

### Notification
- Fields: `recipient` (ref `User`), `actor` (ref `User`), `actorCount` (>=1), `type` (from `NOTIFICATION_TYPES`), `target` (ref via `refPath` → `Post` or `Comment`, optional for `follow`), `targetModel`, `isRead`.
- Indexes: `{ recipient:1, createdAt:-1 }`, `{ recipient:1, isRead:1 }`, `{ recipient:1, type:1, target:1 }` (grouping).
- Statics: `isGroupableType(type)`, `createOrUpdateNotification(recipientId, actorId, type, targetId)` (emits socket updates and unread count), `getUnreadCount(userId)`, `markAsRead(notificationId, userId)`, `markAllAsRead(userId)`.

### Role
- Fields: `_id` (string), `permissions` (string[]).
- Note: Export appears to be `model.exports` instead of `module.exports` in `Role.js`; if unused, ignore, otherwise fix before use.

---

## WebSocket Events

Real-time features use Socket.io with JWT-authenticated connections. See `server/docs/websocket-events.md` for full details. Below is a concise integration view.

### Connection and Auth
- Client connects with: `io('http://localhost:3030', { auth: { token: '<JWT>' } })`.
- Events: `connect`, `connect_error` (invalid/expired token, user not found), `disconnect`.

### Client → Server
- `message:send`: Emit metadata about a new message to conversation participants (REST creates the message). Payload includes `conversationId`, optional `content`/`image`, `senderId`, optional `senderName`/`messageId`.
- `message:seen`: Notify participants that a user saw messages. Payload: `conversationId`, `userId`.
- `typing:start`: Indicate user started typing. Payload: `conversationId`, `userId`. Throttled to 1/sec; auto-stops after ~3s if no `typing:stop`.
- `typing:stop`: Indicate user stopped typing. Payload: `conversationId`, `userId`.

### Server → Client
- `message:new`: Real-time message delivered. Payload: `conversationId`, `content?`, `image?`, `senderId`, `senderName?`, `messageId`, `timestamp`.
- `message:seen`: Someone saw messages. Payload: `conversationId`, `userId`, `timestamp`.
- `typing:start` / `typing:stop`: Typing indicators with `conversationId`, `userId`.
- `user:online` / `user:offline` (pending): Presence updates; `offline` includes `lastSeen`.

### Performance and Security
- Typing events throttled per user; `lastSeen` updates throttled in auth middleware (~60s).
- Multi-device: A user may have multiple active sockets; events are emitted to all.
- Authorization: Server checks conversation participation before emitting; blocked users cannot send via REST.


## Notes

- Paths documented here are exactly as mounted in `server/app.js`.
- Success and error response wrappers are centralized and respected by controllers and middleware. Inner `data` shapes vary per endpoint and are not duplicated here to avoid drift; refer to controllers for precise payload fields when integrating.
