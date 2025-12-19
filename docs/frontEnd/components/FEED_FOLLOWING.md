# FEED_FOLLOWING — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
FeedFollowingController
├─ FeedList
│  └─ FeedPostItem (repeated per post)
└─ FeedStatus
```

- FeedFollowingController (parent): Orchestrates fetching `GET /feed/following` (auth required) with pagination and optimistic interactions (like/save/repost) without reordering.
- FeedList (child): Pure list logic via props; emits abstract list-level events (load more, per-item action) only.
- FeedPostItem (child): Pure post logic via props; emits abstract post actions (like/save/repost); no fetching/global state.
- FeedStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component              | Responsibilities                                                                                                                                                                                                                            | Fetching | Local State | Side-Effects |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| FeedFollowingController| - Require auth token; reject loads without it and emit `onRequireAuth`.
- Manage infinite scroll for `GET /feed/following?page&limit` with `Authorization` header.
- Maintain pagination and append pages; do not reorder on interactions.
- Implement optimistic like/save with rollback on error; handle repost per flows (no reorder).
- Handle unified envelope errors, including auth errors. | Yes (GET, POST/DELETE for interactions) | Yes (posts, pagination, inFlight flags) | Yes (network calls only) |
| FeedList               | - Receive items and pagination; render list logic; notify parent when nearing end.
- Emit `onLoadMore()`; forward per-item actions to parent. | No | No | No |
| FeedPostItem           | - Receive a single post and relationship flags; emit `onLikeToggle`, `onSaveToggle`, `onRepost` with payloads.
- Remain controlled by parent. | No | No | No |
| FeedStatus             | - Relay abstract status and errors; emit `onRetry()` to reload. | No | No | No |

## Props and Emitted Events

### FeedFollowingController (Parent)

Inputs/Props:
- authToken: `string` — required; controller includes `Authorization` header.
- initialPage?: `number` — default 1.
- pageSize?: `number` — default 20.
- onRequireAuth?: `() => void` — emitted when token is missing/invalid/expired.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }` — envelope error summary.
- onOptimisticRollback(payload): `{ postId: string, action: 'like'|'save', reason: string }` — fired when an interaction fails and state is rolled back.
- onActionSuccess?(payload): `{ postId: string, action: 'repost'|'like'|'save' }` — optional; for app-level toasts.

### Child: FeedList

Props:
- items: `Array<PostListItem>`; guaranteed/optional fields as per feeds.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }` — from server when present.
- loading: `boolean` — list-level loading indicator.
- disabled: `boolean` — prevent duplicate `onLoadMore` during fetch.

Events:
- onLoadMore: `void` — emitted when list reaches near end.
- onItemLikeToggle: `{ postId: string, next: boolean }`.
- onItemSaveToggle: `{ postId: string, next: boolean }`.
- onItemRepost: `{ postId: string, comment?: string }`.

### Child: FeedPostItem

Props:
- post: `PostListItem` (same guarantees as above).
- inFlight?: `{ like?: boolean, save?: boolean, repost?: boolean }` — to disable repeated actions on the same item.

Events:
- onLikeToggle: `{ postId: string, next: boolean }`.
- onSaveToggle: `{ postId: string, next: boolean }`.
- onRepost: `{ postId: string, comment?: string }`.

### Child: FeedStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent refetches first page.

## Data Flow

Endpoint: `GET /feed/following` with `page, limit`. Auth required.

1) Init
- If no `authToken`, set `status='error'` (or remain idle) and emit `onRequireAuth`.
- With token: `status='idle'`, trigger initial load (page 1).

2) Load Page
- GET `/feed/following?page={page}&limit={limit}` with `Authorization` header.
- On success: merge `{ posts, pagination }`.
  - Append posts when `page>1`; replace when `page===1`.
  - Keep stable order; do not reorder on interactions.
  - `status='success'`.
- On error:
  - For `NO_TOKEN` / `INVALID_TOKEN` / `TOKEN_EXPIRED` / `NOT_AUTHENTICATED`: emit `onRequireAuth` and set `status='error'`.
  - Otherwise: `status='error'`; emit `onError`.

3) Infinite Scroll
- Same as FEED_HOME.

4) Interactions (auth required)
- Same as FEED_HOME; token is required and present.

5) Errors
- Unified envelopes respected; auth failures route through `onRequireAuth`.

## State Machine (list-level)

```
idle -> loading -> success
            └-> error --onRetry--> loading (when auth is valid)
```

## Defaults & Configuration
- pageSize default: 20; initialPage default: 1.

## Contracts & References
- Endpoint: `GET /feed/following`; interactions: `POST|DELETE /posts/:id/like`, `POST|DELETE /posts/:id/save`, `POST /posts/:id/repost`.

## Notes
- Children are pure; they never fetch or access global state.
