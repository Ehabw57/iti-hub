# SAVED_POSTS — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
SavedPostsController
├─ SavedList
│  └─ FeedPostItem (repeated per post)
└─ SavedStatus
```

- SavedPostsController (parent): Orchestrates `GET /posts/saved` (auth required) with pagination and unsave interactions; treats posts like feed items without reordering.
- SavedList (child): Receives list page(s) and emits pagination and per-post interactions; no fetching/global state.
- FeedPostItem (child): Receives one post; emits like/save/repost; no fetching/global state.
- SavedStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component             | Responsibilities                                                                                                                                                                                                | Fetching | Local State | Side-Effects |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| SavedPostsController  | - Require `authToken`; emit `onRequireAuth` if absent and abort.
- Load `GET /posts/saved?page&limit` and ensure each item has `isSaved=true`.
- Maintain pagination; do not reorder on interactions.
- Implement optimistic like/save toggles with rollback; repost behavior per flows (no reorder).
- Handle unified envelopes; children are pure. | Yes (GET, POST/DELETE for interactions) | Yes (posts, pagination, inFlight flags) | Yes (network calls only) |
| SavedList             | - Receive items and pagination; emit `onLoadMore()` and per-post actions (`onItemLikeToggle`, `onItemSaveToggle`, `onItemRepost`). | No | No | No |
| FeedPostItem          | - Receive one saved post and flags; emit `onLikeToggle`, `onSaveToggle`, `onRepost`. | No | No | No |
| SavedStatus           | - Relay abstract status and errors; emit `onRetry()` to reload first page. | No | No | No |

## Props and Emitted Events

### SavedPostsController (Parent)

Inputs/Props:
- authToken: `string` — required.
- initialPage?: `number` — default 1.
- pageSize?: `number` — default 20.
- onRequireAuth?: `() => void` — emitted when token missing/invalid/expired.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onOptimisticRollback(payload): `{ postId: string, action: 'like'|'save', reason: string }`.
- onActionSuccess?(payload): `{ postId: string, action: 'repost'|'like'|'save' }`.

### Child: SavedList

Props:
- items: `Array<PostListItem>`; same guarantees as feeds; `isSaved` should be true.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemLikeToggle: `{ postId: string, next: boolean }`.
- onItemSaveToggle: `{ postId: string, next: boolean }`.
- onItemRepost: `{ postId: string, comment?: string }`.

### Child: FeedPostItem

Props:
- post: `PostListItem`.
- inFlight?: `{ like?: boolean, save?: boolean, repost?: boolean }`.

Events:
- onLikeToggle: `{ postId: string, next: boolean }`.
- onSaveToggle: `{ postId: string, next: boolean }`.
- onRepost: `{ postId: string, comment?: string }`.

### Child: SavedStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void`.

## Data Flow

1) Init
- Controller: `status='idle'`; load first page.

2) Load Page (auth required)
- GET `/posts/saved?page={page}&limit={limit}` with `Authorization` header.
- On success: append when `page>1`; replace when `page===1`; `status='success'`.
- On error: `status='error'`; emit `onError`.

3) Interactions (auth required)
- Like/Unlike: optimistic toggle and reconcile/rollback.
- Save/Unsave: optimistic toggle and reconcile/rollback. After a successful unsave, remove the post immediately from the list and emit `onActionSuccess({ postId, action: 'save' })`.
- Repost: call endpoint; emit `onActionSuccess` on success; no reorder.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- pageSize default: 20.
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoint: `GET /posts/saved`; interactions per posts.

## Notes
- Children are pure; they never fetch or access global state.
