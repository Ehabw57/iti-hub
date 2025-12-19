# FEED_TRENDING — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
FeedTrendingController
├─ FeedList
│  └─ FeedPostItem (repeated per post)
└─ FeedStatus
```

- FeedTrendingController (parent): Orchestrates fetching `GET /feed/trending` with pagination, optional auth flags, and optimistic interactions (like/save/repost) without reordering.
- FeedList (child): Pure list logic via props; emits abstract list-level events (load more, per-item action) only.
- FeedPostItem (child): Pure post logic via props; emits abstract post actions (like/save/repost); no fetching/global state.
- FeedStatus (child): Pure status relay (idle/loading/error/success); may expose cached flag via props; no fetching/global state.

## Responsibilities

| Component              | Responsibilities                                                                                                                                                                                                                           | Fetching | Local State | Side-Effects |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| FeedTrendingController | - Manage infinite scroll for `GET /feed/trending?page&limit`.
- Attach auth header when `authToken` prop is provided to receive relationship flags (`isLiked`, `isSaved`).
- Maintain pagination and append pages; do not reorder on interactions.
- Implement optimistic like/save with rollback on error; handle repost per flows (no reorder).
- Handle errors using unified envelopes; optional auth behavior. | Yes (GET, POST/DELETE for interactions) | Yes (posts, pagination, inFlight flags) | Yes (network calls only) |
| FeedList               | - Receive items and pagination; render list logic; notify parent when nearing end.
- Emit `onLoadMore()`; forward per-item actions to parent. | No | No | No |
| FeedPostItem           | - Receive a single post and relationship flags; emit `onLikeToggle`, `onSaveToggle`, `onRepost` with payloads.
- Remain controlled by parent. | No | No | No |
| FeedStatus             | - Relay abstract status and surface cached flag if provided; emit `onRetry()` to reload. | No | No | No |

## Props and Emitted Events

### FeedTrendingController (Parent)

Inputs/Props:
- authToken?: `string` — optional; when provided, controller includes `Authorization` header to get `isLiked/isSaved`.
- initialPage?: `number` — default 1.
- pageSize?: `number` — default 20 (contract default).
- onRequireAuth?: `() => void` — emitted when an auth-only interaction is attempted without a token.

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
- cached?: `boolean` — mirrors server field; informational only.

Events:
- onRetry: `void` — parent refetches first page.

## Data Flow

Endpoint: `GET /feed/trending` with `page, limit`. Optional auth.

1) Init
- Controller sets `status='idle'`, `posts=[]`, `page=initialPage||1`, `limit=pageSize||20`, `pagination=null`, `cached=false`.
- Controller triggers initial load (page 1).

2) Load Page
- GET `/feed/trending?page={page}&limit={limit}` (attach `Authorization` if `authToken`).
- On success: merge `{ posts, pagination, cached }`.
  - Append posts when `page>1`; replace when `page===1`.
  - Keep stable order; do not reorder on interactions.
  - `status='success'`.
- On error: `status='error'`; emit `onError`. For auth errors, see Interactions below.

3) Infinite Scroll
- Same as FEED_HOME.

4) Interactions (auth required)
- Same as FEED_HOME; apply token gating.

5) Errors
- Unified envelopes respected. For `INVALID_TOKEN`/`TOKEN_EXPIRED` on optional endpoints, treat as unauthenticated: suppress flags and emit `onRequireAuth` only when user attempts an interaction.

## State Machine (list-level)

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- pageSize default: 20; initialPage default: 1.

## Contracts & References
- Endpoint: `GET /feed/trending`; interactions: `POST|DELETE /posts/:id/like`, `POST|DELETE /posts/:id/save`, `POST /posts/:id/repost`.

## Notes
- Children are pure; they never fetch or access global state.
- For caching, the app can key by `{ feedType:'trending', page }`; `cached` is informational.
