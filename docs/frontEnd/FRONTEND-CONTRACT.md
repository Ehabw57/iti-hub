# Front-End Integration Contract

This contract translates the implemented API and real-time events into practical guidance for front-end integration. It’s based on `docs/API-ROUTES.md`, actual routes mounted in `server/app.js`, the unified response/error formats, and `server/docs/websocket-events.md`.

## Scope and Principles

- Document only implemented endpoints and behaviors.
- Use unified response envelopes consistently.
- Prefer explicit contracts for auth, pagination, uploads, and websockets.
- Avoid inventing data fields; when a shape varies by controller, describe guaranteed parts and call out flags commonly provided.

## Base URL and Authentication

- Base URL (local dev): `http://localhost:3030` (no `/api` prefix)
- Auth header: `Authorization: Bearer <JWT>`
- Auth behaviors:
  - Protected endpoints require a valid JWT; unauthenticated access returns unified errors (`NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`).
  - Optional auth endpoints attach relationship flags when a valid token is present.
  - Rate limits apply on some auth endpoints (e.g., register/login).
- Token lifecycle:
  - JWT issued for 7 days.
  - Front-end should refresh/reauth on expiration errors.

## Global Response Envelope

- Success:
  - `success: true`
  - `data: object`
  - `message?: string` (when controllers include it)
  - `meta?: object`
- Error:
  - `success: false`
  - `error: { code: string, message: string, details?: any, fields?: Record<string, string> }`
- Common error codes: `NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `USER_NOT_FOUND`, `ACCOUNT_BLOCKED`, `AUTH_ERROR`, `NOT_AUTHENTICATED`, `INSUFFICIENT_PERMISSIONS`, `VALIDATION_ERROR`, `INVALID_ID`, `DUPLICATE_ENTRY`, `UPLOAD_ERROR`, `INTERNAL_ERROR`, `TOO_MANY_REQUESTS`, `ROUTE_NOT_FOUND`.

## Identifiers & Dates

- IDs are MongoDB ObjectId strings.
- Dates are ISO 8601 strings (UTC); display using local time on the client.

## Pagination & Filtering Contract

- Query params: `page` (1-based), `limit`.
- Defaults/caps (from server constants): `page` default 1, `limit` default 20, max 100.
- Search defaults: default limit 20, max results 50 per page; minimum `q` length is 2.
- Response pagination (when present): `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- Some endpoints have specific limits (e.g., notifications `limit` max 50). Respect server caps.

## Upload Contract

- `multipart/form-data` for image uploads.
- Field names:
  - Users: `image` for profile/cover.
  - Communities: `image` for profile-picture/cover-image.
  - Posts: `images` (array).
  - Messages: `image` optional.
- MIME: JPEG/PNG/WebP; size/type validated by server. Errors return `UPLOAD_ERROR`.

- Server image constraints (from constants):
  - Allowed MIME: `image/jpeg`, `image/png`, `image/webp`.
  - Posts: width ≤ 2000px, max 5 MB, quality ~85.
  - User Profile: 500x500, max 5 MB.
  - User Cover: 1500x500, max 5 MB.
  - Community Profile: 500x500, max 5 MB.
  - Community Cover: 1500x500, max 10 MB (fit: cover).
  - Message Image: width ≤ 1000px, max 5 MB.

## Epics — Client Contracts

### Auth

- Register: `POST /auth/register`
  - Request: `{ email, password, username, fullName }`
  - Response: `{ success, data: { user, token }, message? }`
  - FE: Store `token`; sanitize & cache basic user profile.
- Login: `POST /auth/login`
  - Request: `{ email, password }`
  - Response: `{ success, data: { token, user }, message? }`
  - FE: Replace token; hydrate session state.
- Password reset request: `POST /auth/password-reset/request`
  - Request: `{ email }`
  - Response: `{ success, data: {}, message }` (message is generic for privacy)
- Password reset confirm: `POST /auth/password-reset/confirm`
  - Request: `{ token, newPassword }`
  - Response: `{ success, data: {}, message }`

### Users & Social

- Get profile by username: `GET /users/:username` (optional auth)
  - Response: `{ success, data: profile }` where `profile` is sanitized.
  - When authenticated (and not blocked by the target): flags are included: `isFollowing`, `followsYou`, `isBlocked`.
  - When viewing own profile: `isOwnProfile: true` and `email` is included.
- Update own profile: `PUT /users/profile` (auth)
  - Request: subset of allowed fields: `fullName`, `bio`, `specialization`, `location`.
  - Response: `{ success, data: profile, message }`.
- Upload profile/cover images: `POST /users/profile/(picture|cover)` (auth, multipart `image`)
  - Response: `{ success, data: { profilePicture|coverImage }, message }`.
- Follow/Unfollow: `POST /users/:userId/follow`, `DELETE /users/:userId/follow` (auth)
  - Response: success with message and target user id; FE can do optimistic UI with rollback on error.
- Followers/Following lists: `GET /users/:userId/(followers|following)` (optional auth)
  - Response: `{ success, data: { users: [], pagination } }`.
- Block/Unblock: `POST /users/:userId/block`, `DELETE /users/:userId/block` (auth)
  - Response: success with message and target user id; FE should remove conversations and prevent messaging per UX.

### Posts & Comments

- Create post: `POST /posts` (auth, multipart `images[]` + JSON fields)
  - Request: `content?`, `tags?`, `community?` + `images[]`.
  - Response: `{ success, data: { post }, message }` (201).
- Saved posts: `GET /posts/saved` (auth)
  - Response: `{ success, data: { posts: [], pagination } }`.
- Get/Update/Delete post: `GET|PATCH|DELETE /posts/:id`
  - `GET` response includes (when authenticated): `isLiked`, `isSaved`.
  - `PATCH` request: `{ content?, tags? }`; response updated post.
  - `DELETE` returns 204 No Content.
- Like/Unlike: `POST|DELETE /posts/:id/like` (auth)
  - Response: `{ success, data: { isLiked, likesCount }, message }`.
- Save/Unsave: `POST|DELETE /posts/:id/save` (auth)
  - Response mirrors like/unlike with `isSaved`.
- Repost: `POST /posts/:id/repost` (auth)
  - Request: `{ comment? }`.
  - Response: `{ success, data: { post }, message }` (201).

- Comments:
  - Create: `POST /posts/:postId/comments` (auth) → `{ content, parentCommentId? }`
  - List: `GET /posts/:postId/comments` (optional auth) → `page`, `limit`, `parentCommentId?`
  - Update: `PUT /comments/:id` (auth) → `{ content }`
  - Delete: `DELETE /comments/:id` (auth)
  - Like/Unlike: `POST|DELETE /comments/:id/like` (auth)

### Uploads & Media

- See Upload Contract above.
- FE should handle client-side validation, progress bars, and retries on `UPLOAD_ERROR`.

### Feed & Discovery

- Home: `GET /feed/home` (optional auth)
- Following: `GET /feed/following` (auth)
- Trending: `GET /feed/trending` (optional auth)
- Community feed: `GET /communities/:communityId/feed`

- Response includes `{ cached, feedType, posts, pagination }`.
- FE can cache by `feedType+page`. The `cached` flag can be treated as internal; no UI indicator required.

### Communities

- List: `GET /communities` (optional auth)
  - Query: `page`, `limit`, `search`, `tags`.
  - Response: list with `isJoined`/role flags when authenticated.
- Create: `POST /communities` (auth, multipart)
  - Body: `name`, `description`, `tags`, `profilePicture?`, `coverImage?`.
- Get: `GET /communities/:id` (optional auth)
- Update: `PATCH /communities/:id` (auth)
- Update images: `POST /communities/:id/(profile-picture|cover-image)` (auth, multipart `image`)
- Join/Leave: `POST /communities/:id/(join|leave)` (auth)
- Moderators: `POST /communities/:id/moderators`, `DELETE /communities/:id/moderators/:userId` (auth)

### Messaging

- Conversations:
  - List: `GET /conversations` (auth, paginated)
  - Get: `GET /conversations/:conversationId` (auth)
  - Create 1:1: `POST /conversations` (auth) → `{ participantId }` (200 if exists, 201 if new)
  - Create group: `POST /conversations/group` (auth) → `{ name, participantIds[], image? }`
  - Members: `POST /conversations/:conversationId/members` (add), `DELETE /conversations/:conversationId/members/:userId` (remove) (auth/admin)
  - Leave: `POST /conversations/:conversationId/leave` (auth)
  - Update group: `PATCH /conversations/:conversationId` (auth/admin) → `{ name? }` or multipart `image`

- Messages:
  - List: `GET /conversations/:conversationId/messages` (auth) → `cursor`, `limit`
  - Send: `POST /conversations/:conversationId/messages` (auth, multipart `image` + `content?`)
  - Seen: `PUT /conversations/:conversationId/seen` (auth)

### Notifications

- List: `GET /notifications` (auth, paginated)
- Unread count: `GET /notifications/unread/count` (auth)
- Mark all read: `PUT /notifications/read` (auth)
- Mark one read: `PUT /notifications/:id/read` (auth)

### Search

- Users: `GET /search/users` → `q` (min length 2), `specialization?`, `page`, `limit` (optional auth)
- Posts: `GET /search/posts` → `q`, `type?`, `communityId?`, `page`, `limit` (optional auth)
- Communities: `GET /search/communities` → `q`, `tags`, `page`, `limit` (optional auth)

## WebSocket Events (Socket.io)

- Connect: `io('http://localhost:3030', { auth: { token: '<JWT>' } })`
- Client → Server:
  - `message:send` → `{ conversationId, content?, image?, senderId, senderName?, messageId? }`
  - `message:seen` → `{ conversationId, userId }`
  - `typing:start` → `{ conversationId, userId }`
  - `typing:stop` → `{ conversationId, userId }`
  - `notification:markAsRead` → `{ notificationId }`
  - `notification:markAllAsRead` → `{}`
- Server → Client:
  - `message:new` → `{ conversationId, content?, image?, senderId, senderName?, messageId, timestamp }`
  - `message:seen` → `{ conversationId, userId, timestamp }`
  - `typing:start` / `typing:stop` → `{ conversationId, userId }`
  - `user:online` / `user:offline` (pending) → presence updates
  - `notification:new` → `{ notification, timestamp }`
  - `notification:update` → `{ notification, timestamp }`
  - `notification:count` → `{ unreadCount, timestamp }`
  - `notification:read` → `{ notificationId, unreadCount, timestamp }`
- Throttling & Security:
  - `typing:start` throttled (~1/sec) and auto-stops after ~3s.
  - `lastSeen` updates throttled (~60s) in auth middleware.
  - Participation validated; blocked users can’t send (enforced via REST).

Confirmed: No extra HTTP rate limits beyond auth endpoints. WebSocket typing events are throttled client/server-side as above.

## Client Patterns & Examples

- Error handling:
  - Map `error.code` to UX messages; show field-level validation errors from `error.fields`.
  - Retry with exponential backoff on network errors; do not retry `VALIDATION_ERROR`.
- Optimistic updates:
  - Likes, saves, follows, and membership changes can be optimistic with rollback on error.
  - For messaging, append local message, then reconcile with `message:new` / server response.
- Caching:
  - Cache feed pages keyed by `{ feedType, page }`.
  - Cache user/Community profiles by id/username; invalidate on updates.
- IDs & navigation:
  - Use string ObjectIds directly from responses for routing and cache keys.

## Confirmed specifics

- Pagination defaults/caps: `page` default 1, `limit` default 20, max 100. Search default 20, max 50. Search `q` min length: 2.
- Upload constraints: MIME JPEG/PNG/WebP; see sizes in Upload Contract. FE does not need to request Cloudinary transforms—use server URLs as provided.
- Rate limiting: No additional HTTP rate limits beyond auth endpoints.
- User profile flags: When authenticated, `isFollowing`, `followsYou`, `isBlocked` are included; viewing own profile adds `isOwnProfile: true` and includes `email`.
- Posts: When authenticated, `GET /posts/:id` always includes `isLiked`, `isSaved` flags.
- Feed `cached`: Treat as internal; FE doesn’t need to surface a UI indicator.
- Community tags: Fetch from the server rather than hardcoding in the client.
- WebSocket notifications: FE should handle `notification:new`, `notification:update`, `notification:count`, `notification:read`; may emit `notification:markAsRead` and `notification:markAllAsRead`.

---

This contract will evolve as controllers and specs change. Front-end should adhere to the envelope formats and endpoint contracts here, and raise any ambiguities for alignment.
