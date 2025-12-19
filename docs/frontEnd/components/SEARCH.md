# SEARCH — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
SearchController
├─ SearchInput
├─ SearchTabs
├─ SearchResults
│  ├─ UsersResultsList
│  ├─ PostsResultsList
│  └─ CommunitiesResultsList
└─ SearchStatus
```

- SearchController (parent): Orchestrates tab-scoped searches for users, posts, and communities; manages independent pagination per tab and debounced queries (q >= 2).
- SearchInput (child): Controlled input; emits abstract change/submit; no fetching/global state.
- SearchTabs (child): Controlled tab state; emits abstract tab change; no fetching/global state.
- UsersResultsList / PostsResultsList / CommunitiesResultsList (children): Receive results and emit pagination and per-item interactions; no fetching/global state.
- SearchStatus (child): Displays aggregate or per-tab status via props; no fetching/global state.

## Responsibilities

| Component              | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| SearchController       | - Manage query state and debounce (default 300ms). Only search when `q.length >= 2`.
- Per tab: maintain `page, limit` (default 20), `items`, and `status` independently.
- Users: GET `/search/users` with `q, specialization?, page, limit` (optional auth for flags); follow/unfollow optimistic with rollback.
- Posts: GET `/search/posts` with `q, type?, communityId?, page, limit` (optional auth for flags); like/save optimistic with rollback; repost non-reordering.
- Communities: GET `/search/communities` with `q, tags, page, limit` (optional auth for flags); join/leave optimistic with rollback.
- Handle unified envelopes; children are pure. | Yes (GET + post actions) | Yes (per-tab state, debounce timers) | Yes (network calls only) |
| SearchInput            | - Controlled `q`; emit `onChange` and `onSubmit`. | No | No | No |
| SearchTabs             | - Controlled `activeTab`; emit `onTabChange(tabId)`. | No | No | No |
| UsersResultsList       | - Receive user results; emit `onLoadMore()` and `onItemFollowToggle`. | No | No | No |
| PostsResultsList       | - Receive post results; emit `onLoadMore()`, `onItemLikeToggle`, `onItemSaveToggle`, `onItemRepost`. | No | No | No |
| CommunitiesResultsList | - Receive community results; emit `onLoadMore()` and `onItemJoinToggle`. | No | No | No |
| SearchStatus           | - Relay per-tab or aggregate status; emit `onRetry()` to refetch current tab. | No | No | No |

## Props and Emitted Events

### SearchController (Parent)

Inputs/Props:
- authToken?: `string` — optional; include `Authorization` to get flags and perform interactions.
- debounceMs?: `number` — default 300 ms.
- pageSizeUsers?: `number` — default 20 (cap 50 per contract for search).
- pageSizePosts?: `number` — default 20 (cap 50 for search).
- pageSizeCommunities?: `number` — default 20 (cap 50 for search).
- onRequireAuth?: `() => void` — when auth-required interaction attempted without token.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onOptimisticRollback(payload): `{ entity: 'post'|'user'|'community', id: string, action: string, reason: string }`.
- onActionSuccess?(payload): `{ entity: 'post'|'user'|'community', id: string, action: string }`.

### Child: SearchInput

Props:
- value: `string`.
- disabled: `boolean` — e.g., during fetch or when q is too short.

Events:
- onChange: `{ q: string }` — parent updates query.
- onSubmit: `void` — parent triggers immediate fetch for active tab if `q.length >= 2`.

### Child: SearchTabs

Props:
- activeTab: `'users' | 'posts' | 'communities'`.
- counts?: `{ users?: number, posts?: number, communities?: number }` — optional total counts per tab if server provides.

Events:
- onTabChange: `{ tab: 'users'|'posts'|'communities' }` — parent switches active tab and loads first page for that tab if not loaded.

### Child: UsersResultsList

Props:
- items: `Array<UserListItem>` minimal fields: `_id, username, fullName, profilePicture?`; conditional `isFollowing?` when authenticated.
- pagination?: `{ page, limit, total, pages }` — pass through from API; controller may derive `hasNext = page < pages`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemFollowToggle: `{ targetUserId: string, next: boolean }`.

### Child: PostsResultsList

Props:
- items: `Array<PostListItem>` guarantees as per feeds; conditional `hasLiked?/hasSaved?` from API-ROUTES (treat as `isLiked/isSaved` for client flags).
- pagination?: `{ page, limit, total, pages }` — pass through from API; controller may derive `hasNext = page < pages`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemLikeToggle: `{ postId: string, next: boolean }`.
- onItemSaveToggle: `{ postId: string, next: boolean }`.
- onItemRepost: `{ postId: string, comment?: string }`.

### Child: CommunitiesResultsList

Props:
- items: `Array<CommunityListItem>` guarantees as per directory; conditional `isMember?` (treat as `isJoined`).
- pagination?: `{ page, limit, total, pages }` — pass through from API; controller may derive `hasNext = page < pages`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemJoinToggle: `{ communityId: string, next: boolean }`.

### Child: SearchStatus

Props:
- statusByTab: `{ users: Status, posts: Status, communities: Status }` where `Status = 'idle'|'loading'|'success'|'error'`.
- activeTab: `'users' | 'posts' | 'communities'`.
- errorByTab?: `{ users?: Error, posts?: Error, communities?: Error }`.

Events:
- onRetry: `void` — parent refetches current tab’s first page.

## Data Flow

1) Init
- Controller: `q=''`, per-tab state initialized: `page=1`, `items=[]`, `status='idle'`.

2) Query Changes (debounced)
- When `q.length < 2`, do not call APIs; optionally clear lists or keep last results (app decision). Default: clear and reset `status='idle'`.
- When `q.length >= 2` and after `debounceMs`, fetch active tab page 1.

3) Per-Tab Fetch
- Users: GET `/search/users?q={q}&specialization={?}&page={page}&limit={min(pageSizeUsers,50)}` (attach `Authorization` if `authToken`).
- Posts: GET `/search/posts?q={q}&type={?}&communityId={?}&page={page}&limit={min(pageSizePosts,50)}` (attach `Authorization` if `authToken`).
- Communities: GET `/search/communities?q={q}&tags={?}&page={page}&limit={min(pageSizeCommunities,50)}` (attach `Authorization` if `authToken`). When receiving `tags` as an array from UI, controller serializes to a comma-separated string per contract.
- On success: append when `page>1`; replace when `page===1`; set tab `status='success'`.
- On error: set tab `status='error'`; emit `onError`.

4) Pagination
- Each list emits `onLoadMore()`; controller increments that tab’s `page` and refetches.

5) Interactions (auth required)
- Users: follow/unfollow optimistic with rollback; `POST|DELETE /users/:userId/follow`.
- Posts: like/save optimistic with rollback; repost non-reordering; endpoints per posts contract.
- Communities: join/leave optimistic with rollback; endpoints per communities contract.
- If no `authToken`, emit `onRequireAuth` and abort the action.

## State Machine

```
Per tab:
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- debounceMs default: 300 ms.
- per-tab page sizes default: 20 (cap 50).
- Controller never reads localStorage; receives token via `authToken` prop.
- Suggestions/top matches are not implemented.

## Sorting (as defined by API)
- Users: alphabetical by username/fullName.
- Posts: alphabetical by content.
- Communities: by member count (descending).

## Contracts & References
- Endpoints: `/search/users`, `/search/posts`, `/search/communities`.
- Query rules: `q.length >= 2`; independent pagination per tab.

## Notes
- Children are pure; they never fetch or access global state.
