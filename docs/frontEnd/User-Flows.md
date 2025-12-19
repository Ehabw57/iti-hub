# User Flows

Source of truth: Front-End Integration Contract and confirmed decisions. No new APIs, fields, screens, or routes are invented here. Ambiguities are marked TODO.

## Global Conventions

- Auth optional across the site. Home feed is the default landing for both guests and authenticated users.
- JWT stored in localStorage; logout clears the token only.
- Unified envelopes: success `{ success:true, data, message? }`; error `{ success:false, error:{ code, message, fields? } }`.
- Pagination via `page`/`limit`; infinite scroll behavior on feeds (client-side).
- Uploads via `multipart/form-data` with specified field names per endpoint; rely on server URLs (no client transforms).
- Blocked users' content (posts/comments) is not visible.
- WebSocket for messaging/notifications; fallback polling when WS unavailable.

---

## Auth Flows

### Register
1) User submits `{ email, password, username, fullName }` to POST `/auth/register`.
2) On success:
   - Store `token` in localStorage.
   - Navigate to Home feed (landing does not change).
3) On `VALIDATION_ERROR` with `fields`:
   - Display field messages; keep user on form; allow correction and resubmission.
4) On `TOO_MANY_REQUESTS`:
   - Enforce client cooldown before allowing another attempt.

Password policy enforced client-side: min 8 chars, includes special character, mix of letters and numbers.

### Login
1) User submits `{ email, password }` to POST `/auth/login`.
2) On success:
   - Replace `token` in localStorage.
   - Navigate to Home feed.
3) On auth errors (e.g., invalid credentials, account blocked): show error; user may retry.
4) On `TOO_MANY_REQUESTS`: enforce client cooldown.

### Logout
1) Clear token from localStorage.
2) Stay on Home feed as guest.

### Password Reset
1) Request reset: POST `/auth/password-reset/request` with `{ email }`; show success message.
2) Confirm reset: POST `/auth/password-reset/confirm` with `{ token, newPassword }`.
3) On success: redirect to Login.
4) On `INVALID_TOKEN`/`TOKEN_EXPIRED`: show error; user restarts request step.

### Email Verification (front-only for now)
- TODO: Backend endpoints and responses to be defined; flows integrate once available.

---

## Navigation & Routing Guards

- Protected views expose entry via buttons/links for unauthenticated users.
- If user manually navigates to a protected view unauthenticated, redirect to Login.
- After successful login, user still lands on Home feed (not deep-linked back).
- TODO: Canonical route strings (e.g., profile/post/community/conversation/notifications/search) not specified; flows avoid hard-coded paths.

---

## Feed & Content Flows

### Browse Home Feed (Default)
1) Load `GET /feed/home` with `page`, `limit`.
2) Implement infinite scroll; on near-end, fetch next `page`.
3) Render posts; do not reorder on interactions.

### Create Post
1) User opens composer; provides `content?`, `tags?`, `community?`, `images[]?`.
2) Submit `POST /posts` (multipart for images).
3) On success:
   - Navigate to Home feed.
   - Newly created post is shown as the first item.
4) On `UPLOAD_ERROR` or validation errors: show messages; do not auto-retry; allow correction and resubmission.

### Repost Post
1) Submit `POST /posts/:id/repost` with optional `{ comment }`.
2) On success: show success toast; stay on current feed; do not reorder feed.

### Like / Unlike Post
1) Optimistically toggle like state and count.
2) Call `POST /posts/:id/like` or `DELETE /posts/:id/like`.
3) On error: rollback optimistic change and show error.

### Save / Unsave Post
1) Optimistically toggle saved state.
2) Call `POST /posts/:id/save` or `DELETE /posts/:id/save`.
3) On error: rollback optimistic change.

### View Post Detail
1) `GET /posts/:id`.
2) If authenticated, response includes `isLiked`, `isSaved`.
3) Blocked content: if either user blocks the other, content should not be shown.

---

## Social Interaction Flows

### Follow / Unfollow User
1) Optimistically update follow button and counters.
2) Call `POST /users/:userId/follow` or `DELETE /users/:userId/follow`.
3) On error: rollback and show error.

### Block / Unblock User (with confirmation)
1) Prompt confirmation.
2) If confirmed:
   - Block: `POST /users/:userId/block`.
   - Unblock: `DELETE /users/:userId/block`.
3) After block:
   - Hide blocked user content (posts/comments) and disable interactions.

### View Followers / Following
1) `GET /users/:userId/followers` or `.../following` with `page`, `limit`.
2) Items are expected to include following status flags.
3) TODO: Exact user fields per item not specified.

---

## Community Flows

### Discover Communities
1) `GET /communities` with `page`, `limit`, `search`, `tags`.
2) Items may include `isJoined` and `role` when authenticated.

### Fetch Allowed Tags
- TODO: `GET /tags` endpoint path and response shape not implemented yet; implied requirement for client to fetch allowed tag values.

### Create Community
1) Submit `POST /communities` (multipart) with `name`, `description`, `tags`, optional `profilePicture`, `coverImage`.
2) On success: proceed to community detail.
3) On upload/validation errors: show messages; allow correction.

### Update Community
1) Description: `PATCH /communities/:id` with `{ description }`.
2) Images: `POST /communities/:id/profile-picture` or `/cover-image` with `image`.

### Join / Leave Community
1) Join: `POST /communities/:id/join`.
2) Leave: `POST /communities/:id/leave`.

### Moderation & Ownership
- Moderators: can delete posts and remove members.
  - Post deletion uses existing post deletion flow: `DELETE /posts/:id` (permission enforcement server-side).
  - TODO: Member removal endpoint not specified; cannot define the exact call.
- Owners: can change name and other fields; assign/remove moderators via:
  - Add moderator: `POST /communities/:id/moderators` with `{ userId }`.
  - Remove moderator: `DELETE /communities/:id/moderators/:userId`.
  - TODO: Endpoint for changing community name/fields beyond description not defined; only description has a documented route.

---

## Messaging Flows

### Conversation List & Detail
1) List: `GET /conversations` with `page`, `limit`.
2) Open: `GET /conversations/:conversationId` (must be participant).

### Start 1:1 Conversation
1) `POST /conversations` with `{ participantId }`.
2) If server returns an existing conversation, redirect to that conversation; otherwise use the newly created one.

### Create Group Conversation
1) `POST /conversations/group` with `{ name, participantIds[], image? }`.
2) Admin is the creator.

### Manage Group Participants (Admin Only)
1) Add: `POST /conversations/:conversationId/members` with `{ userId }`.
2) Remove: `DELETE /conversations/:conversationId/members/:userId`.
3) Leave Group: `POST /conversations/:conversationId/leave`.

### Update Group (Admin Only)
1) `PATCH /conversations/:conversationId` with `{ name? }` or multipart `image`.

### List Messages with Cursor
1) `GET /conversations/:conversationId/messages` with `cursor`, `limit`.
2) Cursor = last message `_id` returned by previous page.

### Send Message (Text and/or Image)
1) Compose with optional `content` and optional `image` (multipart).
2) If both present, send text first, then image.
3) Submit `POST /conversations/:conversationId/messages`.

### Mark Messages as Seen
1) `PUT /conversations/:conversationId/seen`.

### Realtime Behavior
1) Connect socket with auth token.
2) Emit: `message:send`, `message:seen`, `typing:start`, `typing:stop`, `notification:markAsRead`, `notification:markAllAsRead`.
3) Listen: `message:new`, `message:seen`, `typing:start`, `typing:stop`, `notification:new`, `notification:update`, `notification:count`, `notification:read`.
4) Throttle `typing:start` (~1/sec) and auto-stop (~3s).
5) Fallback: If socket fails, poll `GET /conversations` periodically.

---

## Notification Flows

### List & Sort
1) `GET /notifications` with `page`, `limit` (max 50).
2) Sort by `updatedAt`.
3) Items can be grouped by server for types other than follow and repost.

### Mark as Read (HTTP Preferred)
1) All: `PUT /notifications/read`.
2) One: `PUT /notifications/:id/read`.
3) Socket updates may still be received; HTTP remains the source of truth for marking.

### Badge Count Synchronization
1) Periodically fetch `GET /notifications/unread/count`.
2) Optionally merge with socket `notification:count` events; reconcile to HTTP.

---

## Search Flows

### Tab-Scoped Full Search
1) Users: `GET /search/users` with `q (>=2)`, `specialization?`, `page`, `limit`.
2) Posts: `GET /search/posts` with `q`, `type?`, `communityId?`, `page`, `limit`.
3) Communities: `GET /search/communities` with `q`, `tags`, `page`, `limit`.
4) Each tab paginates independently; include domain-specific flags in items.
5) TODO: Exact item field sets for each domain are not specified.

### Top Matches (Unified Preview)
1) Debounce input (≥2 chars, ~300ms).
2) TODO: Call suggestions endpoint (not implemented) to return closest matches across users/posts/communities.
3) Selecting a suggestion navigates to the appropriate tab/detail; full search runs on submit.

---

## Error & Edge Case Handling

- Token expiry (`TOKEN_EXPIRED`): treat user as unauthenticated; flows continue in guest mode.
- Validation errors (`VALIDATION_ERROR` + `fields`): block submission; show per-field messages; user corrects.
- Upload errors (`UPLOAD_ERROR` / type/size): show feedback; no auto-retry; user corrects and retries.
- Server errors (`INTERNAL_ERROR`): prompt user to retry.
- Rate limits (`TOO_MANY_REQUESTS` on auth): enforce client cooldowns.

---

## Open TODOs

- Canonical route strings for pages (profile/post/community/conversation/notifications/search) to enable deep-linking in flows.
- Communities: `GET /tags` endpoint path and payload.
- Search suggestions: endpoint path and payload for debounced unified preview.
- Exact list item field sets for users/posts/communities/notifications across list views.
