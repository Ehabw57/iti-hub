# Data & State Management Plan

Sources of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`, and component specs in `docs/fontendArchetect/components/*.md`. No APIs, fields, or screens are invented.

Global conventions applied throughout:
- Unified response envelopes: success `{ success:true, data, message? }`; error `{ success:false, error:{ code, message, fields? } }`.
- Auth header: `Authorization: Bearer <JWT>` (optional on many endpoints to surface flags).
- Pagination: `page`/`limit`; endpoint-specific response pagination shapes. Derive `hasNext` from server-provided fields (e.g., `page < pages` or `hasNextPage`).
- Uploads via `multipart/form-data` with field names per contract.
- WebSocket optional for Messaging/Notifications; HTTP is source of truth where specified.
- Controllers never read localStorage; token is provided by the app and attached when present.

Open clarifications (non-blocking):
- Canonical client routes remain TODO in Screen-Map; not needed for data/state.
- Search suggestions/top matches are not implemented; excluded here per contract.

---

## AUTH screens

References: `AUTH_LOGIN.md`, `AUTH_REGISTER.md`, `AUTH_PASSWORD_RESET_REQUEST.md`, `AUTH_PASSWORD_RESET_CONFIRM.md`.

### AUTH_LOGIN

- Screen Name / ID: AUTH_LOGIN
- Data Requirements:
  - POST `/auth/login` → `{ email, password }`
  - Success `{ data: { token, user } }` with guaranteed user fields: `_id, email, username, fullName, role, isBlocked, createdAt, updatedAt, lastSeen?`
- Local State:
  - LoginController: `form = { email, password }`, `status = 'idle'|'loading'|'success'|'error'`, `cooldownUntil?` (when `TOO_MANY_REQUESTS`), `error?`.
  - LoginForm (child): controlled inputs; disabled when `status==='loading'` or cooldown active.
- Global State:
  - Auth: JWT token (persisted by app), minimal cached user profile.
  - Navigation intent: emit `onNavigateHome` on success; app routes accordingly.
- Side-effects:
  - API: POST `/auth/login`.
  - On success: emit token to app; app persists; no controller storage I/O.
  - Error handling: show `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_BLOCKED`; cooldown on `TOO_MANY_REQUESTS`.
- Fetching logic:
  - Submit → set `status='loading'` → call → set `status` per envelope.
- Loading states:
  - While loading, disable inputs and submit.
- Error handling:
  - Map `error.code`; per-field messages via `error.fields` when present.
- Pagination / cursor: N/A.
- WebSocket: N/A.
- Data flow (ASCII):
  ```
  LoginForm(onSubmit) -> LoginController(POST /auth/login)
    -> success: emit onToken(token), onNavigateHome()
    -> error: status='error', set cooldown on TOO_MANY_REQUESTS
  ```

### AUTH_REGISTER

- Screen Name / ID: AUTH_REGISTER
- Data Requirements:
  - POST `/auth/register` → `{ email, password, username, fullName }`
  - Success `{ data: { token, user } }` (same guarantees as login)
- Local State:
  - RegisterController: `form = { email, password, username, fullName }`, `status`, `cooldownUntil?`, `error?`.
  - RegisterForm (child): controlled inputs; password policy enforced client-side.
- Global State:
  - Auth: JWT token persisted; minimal user cached.
- Side-effects:
  - API: POST `/auth/register`.
  - On success: emit token; navigate Home.
- Fetching logic / Loading / Error:
  - Same conventions as AUTH_LOGIN; `VALIDATION_ERROR` includes `fields`.
- Pagination / cursor: N/A.
- WebSocket: N/A.
- Data flow:
  ```
  RegisterForm(onSubmit) -> RegisterController(POST /auth/register)
    -> success: emit onToken, onNavigateHome
    -> error: status='error', validations, cooldown on TOO_MANY_REQUESTS
  ```

### AUTH_PASSWORD_RESET_REQUEST

- Screen Name / ID: AUTH_PASSWORD_RESET_REQUEST
- Data Requirements:
  - POST `/auth/password-reset/request` → `{ email }`
  - Success always returns generic message; no token.
- Local State:
  - ResetRequestController: `form = { email }`, `status`, `cooldownUntil?`, `message?`, `error?`.
  - ResetRequestForm (child): controlled input.
- Global State:
  - None; does not alter auth session.
- Side-effects:
  - API: POST request.
- Fetching logic:
  - Submit; display success message regardless of account existence.
- Loading / Error:
  - Handle `VALIDATION_ERROR`, `TOO_MANY_REQUESTS`.
- Pagination / cursor: N/A.
- WebSocket: N/A.
- Data flow:
  ```
  ResetRequestForm(onSubmit) -> ResetRequestController(POST /auth/password-reset/request)
    -> success: set message
    -> error: status='error', set cooldown if TOO_MANY_REQUESTS
  ```

### AUTH_PASSWORD_RESET_CONFIRM

- Screen Name / ID: AUTH_PASSWORD_RESET_CONFIRM
- Data Requirements:
  - POST `/auth/password-reset/confirm` → `{ token, newPassword }`
- Local State:
  - ResetConfirmController: `form = { token, newPassword }`, `status`, `error?`.
  - ResetConfirmForm (child): controlled inputs.
- Global State:
  - None; on success, navigate to Login.
- Side-effects:
  - API: POST confirm.
- Fetching / Loading / Error:
  - Handle `INVALID_TOKEN`, `TOKEN_EXPIRED`, validation.
- Pagination / cursor: N/A.
- WebSocket: N/A.
- Data flow:
  ```
  ResetConfirmForm(onSubmit) -> ResetConfirmController(POST /auth/password-reset/confirm)
    -> success: onNavigateToLogin()
    -> error: status='error'
  ```

---

## FEED screens

References: `FEED_HOME.md`, `FEED_FOLLOWING.md`, `FEED_TRENDING.md`.

### FEED_HOME

- Screen Name / ID: FEED_HOME
- Data Requirements:
  - GET `/feed/home` → `page, limit`; response `{ cached, feedType:'home', posts[], pagination }`
  - Post guarantees: `_id, author, likesCount, commentsCount, repostsCount, savesCount, createdAt, updatedAt`; optional `content, images[], tags[], community, editedAt`; conditional flags when auth: `isLiked?, isSaved?`
- Local State:
  - FeedHomeController: `status`, `page`, `limit`, `items[]`, `inFlightPage?`.
  - PostList (child): receives items; emits interactions.
- Global State:
  - Feed cache: keyed by `{ feedType, page }` with `cached` hint.
  - Auth token: enables flags and interactions.
- Side-effects:
  - API: GET pages; POST/DELETE like/save; POST repost.
  - Optimistic: like/save with rollback; repost without reordering.
- Fetching logic:
  - On mount: load page 1; infinite scroll triggers next pages.
  - Do not reorder on interactions.
- Loading states:
  - Per page loading; disable duplicate loads; show spinner at list tail.
- Error handling:
  - Envelope errors; retry on network; no retry on validation.
- Pagination / cursor:
  - Append on `page>1`; derive `hasNext` from pagination fields.
- WebSocket: N/A for feed ordering; can be used for live counters if app decides, but HTTP remains source.
- Data flow:
  ```
  FeedHomeController(mount) -> GET /feed/home?page,limit
    -> items -> PostList
  PostList(onLikeToggle) -> Controller(optimistic like -> POST/DELETE /posts/:id/like -> reconcile/rollback)
  PostList(onSaveToggle) -> Controller(optimistic save -> POST/DELETE /posts/:id/save)
  PostList(onRepost) -> Controller(POST /posts/:id/repost) (no reorder)
  ```

### FEED_FOLLOWING

- Screen Name / ID: FEED_FOLLOWING
- Data Requirements:
  - GET `/feed/following` (auth) → `page, limit`
- Local/Global/Side-effects:
  - Same as Home; auth required; flags available.
- Pagination/Loading/Error:
  - Same as Home.
- WebSocket: Optional; HTTP source of truth.

### FEED_TRENDING

- Screen Name / ID: FEED_TRENDING
- Data Requirements:
  - GET `/feed/trending` (optional auth) → `page, limit`
- Local/Global/Side-effects/Pagination:
  - Same as Home; interactions behave identically.

---

## POSTS screens

References: `POST_COMPOSER.md`, `POST_DETAIL.md`.

### POST_COMPOSER

- Screen Name / ID: POST_COMPOSER
- Data Requirements:
  - POST `/posts` (multipart)
  - Body: `content?, tags?, community?, images[]?`
  - Success: `{ post }`
- Local State:
  - ComposerController: `form = { content?, tags?, community?, images[] }`, `status`, `error?`, `uploadProgress?`.
  - ComposerForm (child): controlled inputs; client validation per Upload Contract.
- Global State:
  - Auth: required.
  - Feed cache: app may insert new post at top of Home feed after navigation.
- Side-effects:
  - API: multipart POST.
  - On success: emit `onCreatedPost(post)` and `onNavigateHome()`.
- Fetching / Loading / Error:
  - Show progress bars for uploads; handle `UPLOAD_ERROR` and validation.
- Pagination / cursor: N/A.
- WebSocket: N/A.
- Data flow:
  ```
  ComposerForm(onSubmit) -> ComposerController(POST /posts multipart)
    -> success: emit onCreatedPost, onNavigateHome
    -> error: status='error', show upload/validation messages
  ```

### POST_DETAIL

- Screen Name / ID: POST_DETAIL
- Data Requirements:
  - GET `/posts/:id` (optional auth; flags `isLiked`, `isSaved` when auth)
  - GET `/posts/:postId/comments` → `page, limit, parentCommentId?`
  - Comment guarantees: `_id, author, post, content, likesCount, repliesCount, createdAt, updatedAt`; optional `parentComment, editedAt`
- Local State:
  - PostDetailController: `post`, `commentsByThread = { root: { page, items, status }, [parentId]: { page, items, status } }`, `error?`.
  - PostView, CommentsList, CommentItem (children): pure render; emit interactions.
- Global State:
  - Auth token for flags and interactions.
  - Optional cache for post and comment pages.
- Side-effects:
  - API: like/save/repost; comments CRUD; comment like.
  - Optimistic: comment like; post like/save; CRUD for comments waits for server.
  - Blocked: hide content and disable interactions if domain-specific blocked signal received.
- Fetching / Loading / Error:
  - Load post; then load root comments page 1; load replies on demand.
  - Error envelope; retry on network errors.
- Pagination / cursor:
  - Per-thread pagination; append pages.
- WebSocket: Optional for live counts; HTTP source.
- Data flow:
  ```
  PostDetailController(mount) -> GET /posts/:id -> PostView
  CommentsList(load) -> GET /posts/:postId/comments?page,limit,parentCommentId?
  PostView(onLike/Save/Repost) -> Controller(optimistic like/save; POST repost)
  CommentItem(onLike) -> Controller(optimistic; POST/DELETE /comments/:id/like)
  CommentItem(onCreate/Update/Delete) -> Controller(wait for server; POST/PUT/DELETE)
  ```

---

## USERS screens

References: `USER_PROFILE.md`, `USER_FOLLOWERS.md`, `USER_FOLLOWING.md`.

### USER_PROFILE

- Screen Name / ID: USER_PROFILE
- Data Requirements:
  - GET `/users/:username` (optional auth)
  - Flags when auth: `isFollowing`, `followsYou`, `isBlocked`; viewing own profile includes `isOwnProfile: true` and `email`.
  - Posts list: GET `/users/:userId/posts` → `page, limit` (newest-first per spec)
- Local State:
  - UserProfileController: `profile`, `status`, `posts = { page, items, status }`, `error?`.
- Global State:
  - Auth token.
  - Cache profile by username; posts pages by `{ userId, page }`.
- Side-effects:
  - API: follow/unfollow; block/unblock.
  - Optimistic: follow/unfollow with rollback; block removes posts/comments and disables interactions while keeping profile visible.
  - Navigation events allowed (e.g., to conversation/community) as per spec.
- Fetching / Loading / Error:
  - Load profile; then posts page 1; subsequent pages on scroll.
- Pagination / cursor:
  - Append pages; newest-first ordering retained.
- WebSocket: Optional presence/lastSeen; not required.
- Data flow:
  ```
  UserProfileController(mount) -> GET /users/:username -> profile
  -> Posts(load) GET /users/:userId/posts?page,limit
  ProfileView(onFollowToggle) -> Controller(optimistic; POST/DELETE /users/:userId/follow)
  ProfileView(onBlockToggle) -> Controller(POST/DELETE /users/:userId/block) -> remove content
  ```

### USER_FOLLOWERS

- Screen Name / ID: USER_FOLLOWERS
- Data Requirements:
  - GET `/users/:userId/followers` → `page, limit`
  - Item fields: `_id, username, fullName, profilePicture?`; `isFollowing?` when authenticated.
- Local/Global/Side-effects/FETCH/Loading:
  - List controller maintains `page, items, status`; interactions via follow/unfollow with optimistic rollback.
  - Cache pages per `{ userId, page }`.
- Pagination:
  - Append pages.
- WebSocket: N/A.

### USER_FOLLOWING

- Screen Name / ID: USER_FOLLOWING
- Data Requirements:
  - GET `/users/:userId/following` → `page, limit`
  - Same item field guarantees and flags.
- Local/Global/Side-effects:
  - Same as USER_FOLLOWERS.

---

## COMMUNITIES screens

References: `COMMUNITIES_DIRECTORY.md`, `COMMUNITY_DETAIL.md`, `COMMUNITY_CREATE.md`, `COMMUNITY_EDIT.md`, `COMMUNITY_MODERATION.md`.

### COMMUNITIES_DIRECTORY

- Screen Name / ID: COMMUNITIES_DIRECTORY
- Data Requirements:
  - GET `/communities` → `page, limit, search, tags`
  - Item guarantees: `_id, name, description, tags[], profilePicture?, coverImage?, memberCount, postCount, owners[], moderators[], createdAt, updatedAt`
  - Flags when auth: `isJoined?, role?`
- Local State:
  - DirectoryController: `filters = { search?, tags? }`, `page, items, status`, `inFlightAbort?`.
  - FilterBar/List/Item (children): pure; emit changes and joins.
- Global State:
  - Cache pages by `{ search, tagsCSV, page }`.
  - Auth token for flags and join/leave.
- Side-effects:
  - API: GET list; POST `/communities/:id/(join|leave)`.
  - Optimistic: join/leave toggle with rollback.
  - Filters: on apply, reset to page 1 and cancel in-flight loads.
- Fetching / Loading / Error:
  - Serialize `tags[]` to CSV string per contract.
  - Handle errors; retry on network.
- Pagination / cursor:
  - Append pages.
- WebSocket: N/A.
- Data flow:
  ```
  FilterBar(onApply) -> DirectoryController(reset page=1, cancel in-flight) -> GET /communities
  CommunityItem(onJoinToggle) -> Controller(optimistic -> POST join/leave -> reconcile/rollback)
  ```

### COMMUNITY_DETAIL

- Screen Name / ID: COMMUNITY_DETAIL
- Data Requirements:
  - GET `/communities/:id` (optional auth)
  - GET `/communities/:communityId/feed` → `page, limit`
  - Flags: `isJoined?, role?` when auth.
- Local/Global/Side-effects/FETCH/Loading:
  - Controller fetches community then feed page 1; interactions on posts same as feeds.
  - Moderation via post delete when role permits.
- Pagination:
  - Append pages.
- WebSocket: Optional; HTTP source.

### COMMUNITY_CREATE

- Screen Name / ID: COMMUNITY_CREATE
- Data Requirements:
  - POST `/communities` (multipart) → `name, description, tags[]`, optional images.
- Local/Global/Side-effects:
  - Controller manages form, images, progress, status.
  - On success: navigate to detail.
- WebSocket: N/A.

### COMMUNITY_EDIT

- Screen Name / ID: COMMUNITY_EDIT
- Data Requirements:
  - PATCH `/communities/:id` `{ description }`
  - POST `/communities/:id/profile-picture` (image)
  - POST `/communities/:id/cover-image` (image)
- Local/Global/Side-effects:
  - Controller manages description and images upload.
  - On success: cache invalidation for community.

### COMMUNITY_MODERATION

- Screen Name / ID: COMMUNITY_MODERATION
- Data Requirements:
  - POST `/communities/:id/moderators` `{ userId }`
  - DELETE `/communities/:id/moderators/:userId`
- Local/Global/Side-effects:
  - Controller handles add/remove moderator actions; reflect in detail.

---

## MESSAGING screens

References: `MESSAGES_LIST.md`, `CONVERSATION_DETAIL.md`.

### MESSAGES_LIST

- Screen Name / ID: MESSAGES_LIST
- Data Requirements:
  - GET `/conversations` → `page, limit`
  - Conversation guarantees: `_id, type, participants[], name?, image?, admin?, lastMessage?, unreadCount(Map), createdAt, updatedAt`
- Local State:
  - MessagesListController: `page, items, status`; optional polling if socket absent.
- Global State:
  - Auth required; cache by page.
- Side-effects:
  - API: list and open conversation.
  - Optional WS: reconcile unread counts and last message.
- Fetching / Loading / Error:
  - Load pages; retry on network errors.
- Pagination / cursor:
  - Append pages.
- WebSocket subscriptions:
  - `message:new`, `message:seen`, `typing:start/stop` (conversation-scoped)
  - Fallback polling if WS unavailable.
- Data flow:
  ```
  MessagesListController(mount) -> GET /conversations?page,limit
  (optional WS) listen for message:new to refresh list items
  ```

### CONVERSATION_DETAIL

- Screen Name / ID: CONVERSATION_DETAIL
- Data Requirements:
  - GET `/conversations/:conversationId`
  - GET `/conversations/:conversationId/messages` → `cursor, limit`
  - Send: POST `/conversations/:conversationId/messages` (multipart)
  - Seen: PUT `/conversations/:conversationId/seen`
- Local State:
  - ConversationController: `conversation`, `messages = { cursor?, items, status }`, `pendingSend[]`, `typingPeers(Set)`, `error?`.
- Global State:
  - Auth required; cache cursors per conversation.
- Side-effects:
  - API: send/seen.
  - WS optional: realtime `message:new`, `message:seen`, `typing:start/stop`.
  - Throttle typing (~1/sec), auto-stop (~3s).
- Fetching / Loading / Error:
  - Load conversation; load messages (cursor pagination).
  - Send: append local message, then reconcile with server.
- Pagination / cursor:
  - Use last message `_id` as next cursor.
- WebSocket subscriptions:
  - Connect with token; subscribe to events.
- Data flow:
  ```
  ConversationController(mount) -> GET conversation -> GET messages(cursor=null)
  MessageComposer(onSend) -> Controller(append local -> POST send -> reconcile)
  Controller(onSeen) -> PUT seen; WS emits seen
  (WS) on message:new -> append; on typing:start/stop -> update typingPeers
  ```

---

## NOTIFICATIONS

References: `NOTIFICATIONS_CENTER.md`.

### NOTIFICATIONS_CENTER

- Screen Name / ID: NOTIFICATIONS_CENTER
- Data Requirements:
  - GET `/notifications` → `page, limit` (max 50)
  - GET `/notifications/unread/count`
  - PUT `/notifications/read` (all)
  - PUT `/notifications/:id/read` (one)
  - Item guarantees: `_id, recipient, actor, actorCount, type, target?, isRead, createdAt, updatedAt`
- Local State:
  - NotificationsController: `list = { page, items, status }`, `unreadCount`, `error?`.
- Global State:
  - Auth required; share unread count across app; cache pages.
- Side-effects:
  - API: list + mark read (HTTP preferred).
  - WS optional: receive `notification:new/update/count/read`; reconcile to HTTP.
- Fetching / Loading / Error:
  - Load list; poll unread count periodically; mark read updates both list and badge.
- Pagination / cursor:
  - Append pages; sort by `updatedAt` per flows.
- WebSocket subscriptions:
  - Listen and update local/global badge; reconcile discrepancies via HTTP.
- Data flow:
  ```
  NotificationsController(mount) -> GET /notifications -> items
  Badge(poll) -> GET /notifications/unread/count
  Item(onMarkRead) -> Controller(PUT /notifications/:id/read -> update list & badge)
  (WS) notification:* -> reconcile to HTTP
  ```

---

## SEARCH

References: `SEARCH.md`.

### SEARCH

- Screen Name / ID: SEARCH
- Data Requirements:
  - Users: GET `/search/users` → `q(>=2), specialization?, page, limit` (optional auth)
  - Posts: GET `/search/posts` → `q, type?, communityId?, page, limit` (optional auth)
  - Communities: GET `/search/communities` → `q, tags, page, limit` (optional auth; serialize tags to CSV)
  - Sorting (from server): Users and Posts alphabetically; Communities by member count desc.
- Local State:
  - SearchController: `q`, `activeTab`, `statusByTab`, `usersTab = { page, items, status }`, `postsTab = { page, items, status }`, `communitiesTab = { page, items, status }`, `debounceTimer`, `errorByTab?`.
  - SearchInput/Tabs/Results (children): pure controlled components; emit changes and interactions.
- Global State:
  - Auth token for flags and interactions.
  - Cache results per tab keyed by `{ q, filters, page }`.
- Side-effects:
  - API: three GETs based on tab; interactions: follow/unfollow, like/save/repost, join/leave.
  - Optimistic: user follow/unfollow; post like/save; community join/leave with rollback.
  - If unauthenticated, emit `onRequireAuth` and abort interactions.
- Fetching / Loading / Error:
  - Debounce input (~300ms); only search when `q.length >= 2`.
  - Replace on page 1; append on further pages.
  - Handle envelope errors per tab.
- Pagination / cursor:
  - Independent per tab; derive `hasNext` from endpoint-specific pagination shape (e.g., `pages`).
- WebSocket: N/A.
- Data flow:
  ```
  SearchInput(onChange) -> SearchController(set q; debounce)
  (debounced when q>=2) -> GET /search/<activeTab> page 1
  Results(onLoadMore) -> Controller(++page -> GET /search/<tab>)
  UserItem(onFollowToggle) -> Controller(optimistic -> POST/DELETE /users/:id/follow)
  PostItem(onLike/Save/Repost) -> Controller(optimistic -> POST/DELETE /posts/:id/(like|save); POST repost)
  CommunityItem(onJoinToggle) -> Controller(optimistic -> POST /communities/:id/(join|leave))
  ```

---

## Global State Inventory

- Auth Session
  - JWT token (persisted by app; injected into controllers via props)
  - Minimal cached user profile (hydrated post-login/register)
- Caches
  - Feed pages by `{ feedType, page }`
  - Profiles by `username`; posts pages by `{ userId, page }`
  - Communities pages by `{ search, tagsCSV, page }`
  - Conversations list pages; conversation message cursors
  - Notifications pages; `unreadCount`
  - Search results per tab by `{ q, filters, page }`
- Real-time (optional)
  - Socket connection with auth for messaging and notifications
  - Subscriptions: `message:*`, `typing:*`, `notification:*`

## Error & Loading Conventions

- Loading flags per controller (`status`) and per list page.
- Error handling via unified envelope; map `error.code` to UX.
- Network retries with simple backoff are acceptable; no auto-retry on `VALIDATION_ERROR`.
- Rate limits: enforce client cooldown on auth endpoints.

## Pagination Notes

- Respect endpoint caps: feeds (max 100 unless otherwise stated), notifications (max 50), search (max 50).
- Use endpoint-provided pagination fields: some return `{ page, limit, total, pages }`, others `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- Derive `hasNext` using the fields present.

## WebSocket Reconciliation

- Notifications: HTTP is source of truth for marking read; socket events update UI but reconcile to HTTP.
- Messaging: Optimistic send; reconcile with `message:new` and server response; seen via HTTP and socket.

## Notes

- All controllers are logic-first and pass props to pure children; no child fetches or global state mutations.
- Block behavior: When blocking applies, profile remains visible but posts/comments are hidden and interactions disabled (per `USER_PROFILE.md` and flows).
