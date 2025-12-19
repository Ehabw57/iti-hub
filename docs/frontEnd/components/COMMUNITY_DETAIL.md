# COMMUNITY_DETAIL — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
CommunityDetailController
├─ CommunityHeader
├─ CommunityActions
├─ CommunityFeed
│  └─ FeedPostItem (repeated per post)
└─ CommunityStatus
```

- CommunityDetailController (parent): Orchestrates `GET /communities/:id` (optional auth flags) and community feed `GET /communities/:communityId/feed`; manages join/leave and moderator/owner actions on posts.
- CommunityHeader (child): Receives community details and membership flags; emits abstract navigation intents; no fetching/global state.
- CommunityActions (child): Receives membership flags/role; emits join/leave and moderator actions; no fetching/global state.
- CommunityFeed (child): Receives posts and emits pagination and per-post interactions; no fetching/global state.
- CommunityStatus (child): Pure status relay; no fetching/global state.

## Responsibilities

| Component                  | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| CommunityDetailController  | - Load `GET /communities/:id` (attach `Authorization` if `authToken`) and expose `isJoined?, role?`.
- Load community feed: `GET /communities/:communityId/feed?page&limit`.
- Join/Leave: optimistic toggle with rollback using `POST /communities/:id/join` and `POST /communities/:id/leave`.
- Moderator/Owner actions: delete posts via `DELETE /posts/:id` (permission enforced server-side).
- Per-post interactions: like/save/repost patterns same as feeds; no reorder.
- Handle unified envelopes; children are pure. | Yes (GET, POST, DELETE) | Yes (community, feed pages, flags) | Yes (network calls only) |
| CommunityHeader            | - Receive community fields: `_id, name, description, tags[], profilePicture?, coverImage?, memberCount, postCount, owners[], moderators[], createdAt, updatedAt` and flags.
- Emit navigation intents to member or owner profiles via parent if desired. | No | No | No |
| CommunityActions           | - Emit `onJoinToggle` and moderator actions (`onDeletePost`). | No | No | No |
| CommunityFeed              | - Receive posts and pagination; emit `onLoadMore()` and per-post actions (`onItemLikeToggle`, `onItemSaveToggle`, `onItemRepost`, `onItemDelete`). | No | No | No |
| CommunityStatus            | - Relay abstract status and errors; emit `onRetry()` to reload header and first feed page. | No | No | No |

## Props and Emitted Events

### CommunityDetailController (Parent)

Inputs/Props:
- communityId: `string` — required.
- authToken?: `string` — optional; include `Authorization` to get membership flags/role and perform interactions.
- feedPageSize?: `number` — default 20.
- onRequireAuth?: `() => void` — emitted when auth-only interaction attempted without token.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onOptimisticRollback(payload): `{ entity: 'community'|'post', id: string, action: string, reason: string }`.
- onActionSuccess?(payload): `{ entity: 'community'|'post', id: string, action: string }`.
- onNavigateToProfile?(payload): `{ userId?: string, username?: string }` — if header emits navigation to owners/moderators.

### Child: CommunityHeader

Props:
- community: `CommunityDetail` with guarantees above.
- flags: `{ isJoined?: boolean, role?: string }`.

Events:
- onMemberNavigate: `{ userId?: string, username?: string }` — parent may emit upstream `onNavigateToProfile`.

### Child: CommunityActions

Props:
- flags: `{ isJoined?: boolean, role?: string }`.
- inFlight?: `{ join?: boolean }`.

Events:
- onJoinToggle: `{ communityId: string, next: boolean }`.
- onDeletePost: `{ postId: string }` — parent calls `DELETE /posts/:id` when role permits; errors handled via envelopes.

### Child: CommunityFeed

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
- onItemDelete: `{ postId: string }`.

### Child: CommunityStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent reloads header and first feed page.

## Data Flow

1) Init
- Controller: `status='idle'`; load header and first feed page concurrently.

2) Load Header
- GET `/communities/:id` (attach `Authorization` if `authToken`).
- On success: set community and flags.
- On error: `status='error'`; emit `onError`.

3) Load Feed
- GET `/communities/:communityId/feed?page=1&limit={feedPageSize}`.
- Append semantics for pagination; do not reorder on interactions.

4) Interactions (auth required)
- Join/Leave: if no `authToken`, emit `onRequireAuth` and abort.
  - Optimistically toggle `isJoined`; call `POST /communities/:id/join` or `POST /communities/:id/leave`; reconcile or rollback.
- Post delete (moderators/owners): call `DELETE /posts/:id`; on success, remove from feed.
- Per-post like/save/repost: patterns same as feeds; token gating applies.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- feedPageSize default: 20.
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoints: `GET /communities/:id`, `GET /communities/:communityId/feed`, `POST /communities/:id/(join|leave)`, `DELETE /posts/:id`.

## Notes
- Children are pure; they never fetch or access global state.
