# frontend-usage.md

Authoritative usage guide derived strictly from `docs/FRONTEND-CONTRACT.md`. This document does not introduce new APIs, fields, or flows. Any ambiguity is marked as TODO.

## Scope and Rules

- Source of truth: `docs/FRONTEND-CONTRACT.md` (and mounted routes in `server/app.js`).
- Do NOT assume endpoints or fields beyond what’s stated.
- No UI visuals or styling guidance.
- Use this to implement client data-layer calls, error handling, pagination, uploads, and sockets.

---

## Base URL & Authentication

- Base URL (dev): `http://localhost:3030`
- Auth header: `Authorization: Bearer <JWT>`
- Token lifecycle: JWT valid for 7 days; refresh or re-auth on expiration errors.
- Protected endpoints: require JWT; optional-auth endpoints enrich responses when JWT present.

---

## Response Envelope Handling

- Success
  - `success: true`
  - `data: object`
  - `message?: string`
  - `meta?: object`
- Error
  - `success: false`
  - `error: { code: string, message: string, details?: any, fields?: Record<string,string> }`
- Common error codes (non-exhaustive, from the contract):
  - `NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `USER_NOT_FOUND`, `ACCOUNT_BLOCKED`, `AUTH_ERROR`, `NOT_AUTHENTICATED`, `INSUFFICIENT_PERMISSIONS`, `VALIDATION_ERROR`, `INVALID_ID`, `DUPLICATE_ENTRY`, `UPLOAD_ERROR`, `INTERNAL_ERROR`, `TOO_MANY_REQUESTS`, `ROUTE_NOT_FOUND`

---

## Identifiers & Dates

- IDs: MongoDB ObjectId strings
- Dates: ISO 8601 strings (UTC)

---

## Pagination & Filtering

- Query params: `page` (1-based), `limit`
- Defaults/caps: `page` default 1, `limit` default 20, max 100
- Search defaults: default 20, max 50; minimum `q` length = 2
- Response pagination (when present): `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`

---

## Uploads

- Content-Type: `multipart/form-data`
- Fields by route:
  - Users: `image` (profile/cover)
  - Communities: `image` (profile-picture/cover-image)
  - Posts: `images[]`
  - Messages: `image`
- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`
- Size/processing constraints (server-side):
  - Post image: width ≤ 2000px, ≤ 5 MB
  - Profile: 500x500, ≤ 5 MB
  - Cover (user): 1500x500, ≤ 5 MB
  - Community profile: 500x500, ≤ 5 MB
  - Community cover: 1500x500, ≤ 10 MB (fit: cover)
  - Message image: width ≤ 1000px, ≤ 5 MB
- Image URLs: rely on server-provided URLs; no client-side Cloudinary transforms required

---

## Endpoint Usage by Domain

### Auth

- POST `/auth/register`
  - Send: `{ email, password, username, fullName }`
  - Expect: `{ success, data: { user, token }, message? }`
- POST `/auth/login`
  - Send: `{ email, password }`
  - Expect: `{ success, data: { token, user }, message? }`
- POST `/auth/password-reset/request`
  - Send: `{ email }`
  - Expect: `{ success, data: {}, message }`
- POST `/auth/password-reset/confirm`
  - Send: `{ token, newPassword }`
  - Expect: `{ success, data: {}, message }`

### Users & Social

- GET `/users/:username` (optional auth)
  - Expect: `{ success, data: profile }`
  - When authenticated and allowed: `data` includes `isFollowing`, `followsYou`, `isBlocked`
  - When viewing own profile: includes `email`, plus `isOwnProfile: true`
- PUT `/users/profile` (auth)
  - Send: subset of `{ fullName, bio, specialization, location }`
  - Expect: `{ success, data: profile, message }`
- POST `/users/profile/picture` (auth, multipart)
  - Field: `image`
  - Expect: `{ success, data: { profilePicture }, message }`
- POST `/users/profile/cover` (auth, multipart)
  - Field: `image`
  - Expect: `{ success, data: { coverImage }, message }`
- POST `/users/:userId/follow` (auth)
  - Expect: success with message and target user id
- DELETE `/users/:userId/follow` (auth)
  - Expect: success with message and target user id
- GET `/users/:userId/followers` (optional auth)
  - Query: `page`, `limit`
  - Expect: `{ success, data: { users: [], pagination } }`
  - TODO: Confirm exact user object fields in list
- GET `/users/:userId/following` (optional auth)
  - Query: `page`, `limit`
  - Expect: `{ success, data: { users: [], pagination } }`
  - TODO: Confirm exact user object fields in list
- POST `/users/:userId/block` (auth)
  - Expect: success with message and target user id
- DELETE `/users/:userId/block` (auth)
  - Expect: success with message and target user id

### Posts & Comments

- POST `/posts` (auth, multipart)
  - Fields: `images[]` (optional)
  - JSON fields: `content?`, `tags?`, `community?`
  - Expect: `{ success, data: { post }, message }` (201)
  - TODO: Confirm `post` object shape used by FE
- GET `/posts/saved` (auth)
  - Query: `page`, `limit`
  - Expect: `{ success, data: { posts: [], pagination } }`
  - TODO: Confirm `post` object shape used by FE
- GET `/posts/:id` (optional auth)
  - Expect: post; when authenticated includes `isLiked`, `isSaved`
  - TODO: Confirm `post` object shape used by FE
- PATCH `/posts/:id` (auth)
  - Send: `{ content?, tags? }`
  - Expect: updated post
- DELETE `/posts/:id` (auth)
  - Expect: 204 No Content
- POST `/posts/:id/like` (auth)
  - Expect: `{ success, data: { isLiked, likesCount }, message }`
- DELETE `/posts/:id/like` (auth)
  - Expect: `{ success, data: { isLiked, likesCount }, message }`
- POST `/posts/:id/save` (auth)
  - Expect mirrors like with `isSaved`
- DELETE `/posts/:id/save` (auth)
  - Expect mirrors unlike with `isSaved`
- POST `/posts/:id/repost` (auth)
  - Send: `{ comment? }`
  - Expect: `{ success, data: { post }, message }` (201)

- Comments
  - POST `/posts/:postId/comments` (auth)
    - Send: `{ content, parentCommentId? }`
    - Expect: `{ success, data: { comment }, message }` (201)
    - TODO: Confirm `comment` object shape used by FE
  - GET `/posts/:postId/comments` (optional auth)
    - Query: `page`, `limit`, `parentCommentId?`
    - Expect: list (paginated)
    - TODO: Confirm `comment` object shape and pagination fields
  - PUT `/comments/:id` (auth)
    - Send: `{ content }`
  - DELETE `/comments/:id` (auth)
  - POST `/comments/:id/like` (auth)
  - DELETE `/comments/:id/like` (auth)

### Feed & Discovery

- GET `/feed/home` (optional auth)
- GET `/feed/following` (auth)
- GET `/feed/trending` (optional auth)
- GET `/communities/:communityId/feed`

- Expect: `{ cached, feedType, posts, pagination }`
- Note: `cached` may be treated as internal (no UI indicator required)
- TODO: Confirm `post` object shape used by FE

### Communities

- GET `/communities` (optional auth)
  - Query: `page`, `limit`, `search`, `tags`
  - Expect: list; when authenticated, entries include membership/role flags
  - TODO: Confirm community object shape and role flag field names
- POST `/communities` (auth, multipart)
  - Fields: `profilePicture?`, `coverImage?`
  - Body: `name`, `description`, `tags`
- GET `/communities/:id` (optional auth)
- PATCH `/communities/:id` (auth)
  - Body: `{ description }`
- POST `/communities/:id/profile-picture` (auth, multipart)
  - Field: `image`
- POST `/communities/:id/cover-image` (auth, multipart)
  - Field: `image`
- POST `/communities/:id/join` (auth)
- POST `/communities/:id/leave` (auth)
- POST `/communities/:id/moderators` (auth)
  - Body: `{ userId }`
- DELETE `/communities/:id/moderators/:userId` (auth)

- Community tags source: Fetch from the server (endpoint not specified)
  - TODO: Specify endpoint path/response for community tags list

### Messaging

- Conversations
  - GET `/conversations` (auth)
    - Query: `page`, `limit`
  - GET `/conversations/:conversationId` (auth)
  - POST `/conversations` (auth)
    - Send: `{ participantId }` (200 if existed, 201 if created)
  - POST `/conversations/group` (auth)
    - Send: `{ name, participantIds[], image? }`
  - POST `/conversations/:conversationId/members` (auth)
    - Send: `{ userId }`
  - DELETE `/conversations/:conversationId/members/:userId` (auth)
  - POST `/conversations/:conversationId/leave` (auth)
  - PATCH `/conversations/:conversationId` (auth)
    - Send: `{ name? }` or multipart `image`

- Messages
  - GET `/conversations/:conversationId/messages` (auth)
    - Query: `cursor`, `limit`
    - TODO: Confirm cursor value format (e.g., ISO timestamp or opaque token)
  - POST `/conversations/:conversationId/messages` (auth, multipart)
    - Fields: `image?`
    - Body: `content?`
  - PUT `/conversations/:conversationId/seen` (auth)

### Notifications

- GET `/notifications` (auth)
  - Query: `page`, `limit` (max 50)
- GET `/notifications/unread/count` (auth)
- PUT `/notifications/read` (auth)
- PUT `/notifications/:id/read` (auth)

- TODO: Confirm notification object shape used by FE

### Search

- GET `/search/users` (optional auth)
  - Query: `q` (min 2), `specialization?`, `page`, `limit`
  - TODO: Confirm user object fields and any relationship flags in results
- GET `/search/posts` (optional auth)
  - Query: `q`, `type?`, `communityId?`, `page`, `limit`
  - TODO: Confirm post object fields and any like/save flags in results
- GET `/search/communities` (optional auth)
  - Query: `q`, `tags`, `page`, `limit`
  - TODO: Confirm community object fields and membership flags in results

---

## WebSocket Events (Socket.io)

- Connect: `io('http://localhost:3030', { auth: { token: '<JWT>' } })`

- Client → Server
  - `message:send` → `{ conversationId, content?, image?, senderId, senderName?, messageId? }`
  - `message:seen` → `{ conversationId, userId }`
  - `typing:start` → `{ conversationId, userId }`
  - `typing:stop` → `{ conversationId, userId }`
  - `notification:markAsRead` → `{ notificationId }`
  - `notification:markAllAsRead` → `{}`

- Server → Client
  - `message:new` → `{ conversationId, content?, image?, senderId, senderName?, messageId, timestamp }`
  - `message:seen` → `{ conversationId, userId, timestamp }`
  - `typing:start` / `typing:stop` → `{ conversationId, userId }`
  - `notification:new` → `{ notification, timestamp }`
  - `notification:update` → `{ notification, timestamp }`
  - `notification:count` → `{ unreadCount, timestamp }`
  - `notification:read` → `{ notificationId, unreadCount, timestamp }`

- Throttling & Security
  - `typing:start` throttled ~1/sec; auto `typing:stop` after ~3s
  - `lastSeen` updates throttled ~60s in auth middleware
  - Participation is validated; blocked users cannot send via REST

- TODO: Presence events `user:online` / `user:offline` are pending; payload not finalized here

---

## Client Patterns (Non-UI)

- Error handling
  - Map `error.code` to UX messages; respect `error.fields` for form-level feedback
  - Do not retry `VALIDATION_ERROR`; consider backoff for transient network failures
- Optimistic updates
  - Safe to apply for like/save/follow/membership; rollback on error
  - Messaging: append local item, reconcile with server ack/`message:new`
- Caching
  - Cache feed pages by `{ feedType, page }`
  - Cache entity profiles by id/username; invalidate on updates

---

## TODO Summary (Ambiguities to confirm)

1) Exact object shapes used by FE:
   - Post objects (all places including feed, saved posts, single post)
   - Comment objects (create/list/update responses)
   - User objects in followers/following/search results
   - Community objects (list/detail; role/membership flag field names)
   - Notification objects (list and socket payloads)
2) Search results flags:
   - Whether user/post/community search results include relationship/engagement flags
3) Messaging cursor format for message listing
4) Endpoint for fetching community tags list (path and response shape)

---

This usage guide mirrors `FRONTEND-CONTRACT.md` exactly and intentionally leaves TODOs where the contract does not specify details.
