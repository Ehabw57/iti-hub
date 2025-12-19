# USER_PROFILE — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
UserProfileController
├─ ProfileHeader
├─ ProfileActions
├─ ProfilePosts
│  └─ FeedPostItem (repeated per post)
└─ ProfileStatus
```

- UserProfileController (parent): Orchestrates `GET /users/:username` (optional auth flags) and `GET /users/:userId/posts` with pagination; manages follow/unfollow and block/unblock.
- ProfileHeader (child): Receives profile details; emits abstract navigation intents (including conversation start); no fetching/global state.
- ProfileActions (child): Receives relationship flags and counters; emits follow/block events; no fetching/global state.
- ProfilePosts (child): Receives posts page(s) and emits pagination and per-post interactions; no fetching/global state.
- ProfileStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component              | Responsibilities                                                                                                                                                                                                                   | Fetching | Local State | Side-Effects |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| UserProfileController  | - Load `GET /users/:username` (attach `Authorization` if `authToken`) and expose flags: `isFollowing`, `followsYou`, `isBlocked`. When viewing own profile: include `isOwnProfile: true` and `email` from server.
- Load posts: `GET /users/:userId/posts?page&limit` with pagination; fixed sort newest-first; do not reorder on interactions.
- Follow/Unfollow: optimistic toggle with rollback; uses `POST|DELETE /users/:userId/follow`.
- Block/Unblock: non-optimistic (confirm, call server, then update visibility and flags) via `POST|DELETE /users/:userId/block`.
- Manage per-post interactions (like/save/repost) in ProfilePosts similarly to feeds; do not reorder.
- Handle unified envelopes; children are pure. | Yes (GET, POST/DELETE) | Yes (profile, posts pages, flags, counters) | Yes (network calls only) |
| ProfileHeader          | - Receive profile: `_id, username, fullName, bio?, profilePicture?, coverImage?, specialization?, location?, role, followersCount, followingCount, postsCount, isBlocked?, createdAt, updatedAt` and relationship flags.
- Emit navigation intents to author-related views (e.g., conversations) via parent if desired. | No | No | No |
| ProfileActions         | - Receive flags/counters; emit `onFollowToggle`, `onBlockToggle` (with confirmation upstream). | No | No | No |
| ProfilePosts           | - Receive posts and pagination; emit `onLoadMore()` and per-post actions (`onItemLikeToggle`, `onItemSaveToggle`, `onItemRepost`). | No | No | No |
| ProfileStatus          | - Relay abstract status and errors; emit `onRetry()` to reload profile and first posts page. | No | No | No |

## Props and Emitted Events

### UserProfileController (Parent)

Inputs/Props:
- username: `string` — required.
- authToken?: `string` — optional; include `Authorization` to get relationship flags and perform interactions.
- postsPageSize?: `number` — default 20.
- onRequireAuth?: `() => void` — emitted when auth-only interaction attempted without token.

Upstream Navigation Emissions:
- onStartConversation(payload): `{ userId: string }` — emitted neutrally when child requests starting a conversation; controller does not execute logic.
- onNavigateToProfile?(payload): `{ userId?: string, username?: string }` — if header emits author navigation.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onOptimisticRollback(payload): `{ entity: 'post'|'profile', id?: string, action: string, reason: string }`.
- onActionSuccess?(payload): `{ entity: 'post'|'profile', id?: string, action: string }`.
- onNavigateToProfile?(payload): `{ userId?: string, username?: string }` — if header emits author navigation.

### Child: ProfileHeader

Props:
- profile: `UserProfile` with guarantees above.
- flags: `{ isFollowing?: boolean, followsYou?: boolean, isBlocked?: boolean, isOwnProfile?: boolean }`.

Events:
- onAuthorNavigate: `{ userId?: string, username?: string }` — parent may emit upstream `onNavigateToProfile`.
- onStartConversation: `{ userId: string }` — parent emits upstream `onStartConversation` without executing logic.

### Child: ProfileActions

Props:
- counters: `{ followersCount: number, followingCount: number, postsCount: number }`.
- flags: `{ isFollowing?: boolean, isBlocked?: boolean, isOwnProfile?: boolean }`.
- inFlight?: `{ follow?: boolean, block?: boolean }`.

Events:
- onFollowToggle: `{ userId: string, next: boolean }`.
- onBlockToggle: `{ userId: string, next: boolean }` — parent handles confirmation and non-optimistic server call.

### Child: ProfilePosts

Props:
- items: `Array<PostListItem>`; same guarantees as feeds.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemLikeToggle: `{ postId: string, next: boolean }`.
- onItemSaveToggle: `{ postId: string, next: boolean }`.
- onItemRepost: `{ postId: string, comment?: string }`.

### Child: ProfileStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent reloads profile and first posts page.

## Data Flow

1) Init
- Controller: `status='idle'`; load profile and first posts page concurrently.

2) Load Profile
- GET `/users/:username` (attach `Authorization` if `authToken`).
- On success: set profile and flags; detect `isOwnProfile` and include `email` when provided by server.
- On error: `status='error'`; emit `onError`.

3) Load Posts
- GET `/users/:userId/posts?page=1&limit={postsPageSize}`.
- Append semantics for pagination with fixed newest-first (server-side sort assumed); do not reorder on interactions.

4) Interactions (auth required)
- Follow/Unfollow: if no `authToken`, emit `onRequireAuth` and abort.
  - Optimistically toggle `isFollowing` and adjust counters; call `POST|DELETE /users/:userId/follow`; reconcile or rollback.
- Block/Unblock: if no `authToken`, emit `onRequireAuth` and abort.
  - Non-optimistic: call `POST|DELETE /users/:userId/block`; on success, remove all posts/comments from view and disable interactions while keeping profile visible; update flags. On error, no state change.
- Per-post like/save/repost: apply same patterns as feeds (optimistic toggle for like/save, non-reordering for repost).

5) Blocked Content
- If server indicates blocked relationship via domain-specific error code, controller hides content and disables interactions.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- postsPageSize default: 20.
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoints: `GET /users/:username`, `GET /users/:userId/posts`, `POST|DELETE /users/:userId/follow`, `POST|DELETE /users/:userId/block`.

## Notes
- Children are pure; they never fetch or access global state.
