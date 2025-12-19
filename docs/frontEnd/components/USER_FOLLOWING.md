# USER_FOLLOWING — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
UserFollowingController
├─ FollowingList
│  └─ FollowingItem (repeated)
└─ FollowingStatus
```

- UserFollowingController (parent): Orchestrates `GET /users/:userId/following` with pagination and follow/unfollow interactions.
- FollowingList (child): Receives list page(s) and emits pagination and per-item follow events; no fetching/global state.
- FollowingItem (child): Receives one following item; emits follow/unfollow; no fetching/global state.
- FollowingStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component               | Responsibilities                                                                                                                                                                  | Fetching | Local State | Side-Effects |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| UserFollowingController | - Load `GET /users/:userId/following?page&limit` (attach `Authorization` if `authToken` to receive `isFollowing` flags).
- Follow/Unfollow: optimistic toggle with rollback using `POST|DELETE /users/:userId/follow` (target is the list item’s id).
- Handle unified envelopes; children are pure. | Yes (GET, POST/DELETE) | Yes (list pages, flags, counters) | Yes (network calls only) |
| FollowingList           | - Receive items and pagination; emit `onLoadMore()` and per-item follow toggles. | No | No | No |
| FollowingItem           | - Receive minimal fields and flags; emit `onFollowToggle`. | No | No | No |
| FollowingStatus         | - Relay abstract status and errors; emit `onRetry()` to reload first page. | No | No | No |

## Props and Emitted Events

### UserFollowingController (Parent)

Inputs/Props:
- userId: `string` — required.
- authToken?: `string` — optional; include `Authorization` to get `isFollowing` flags and perform follow/unfollow.
- pageSize?: `number` — default 20.
- onRequireAuth?: `() => void` — emitted when auth-only interaction attempted without token.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onOptimisticRollback(payload): `{ entity: 'connection', id: string, action: 'follow', reason: string }`.
- onActionSuccess?(payload): `{ entity: 'connection', id: string, action: 'follow'|'unfollow' }`.

### Child: FollowingList

Props:
- items: `Array<UserListItem>` minimal fields: `_id, username, fullName, profilePicture?`; conditional `isFollowing?` when authenticated.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemFollowToggle: `{ targetUserId: string, next: boolean }`.

### Child: FollowingItem

Props:
- user: `UserListItem` minimal fields as above.
- flags: `{ isFollowing?: boolean }`.
- inFlight?: `{ follow?: boolean }`.

Events:
- onFollowToggle: `{ targetUserId: string, next: boolean }`.

### Child: FollowingStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent refetches first page.

## Data Flow

1) Init
- Controller: `status='idle'`; load first page.

2) Load Page
- GET `/users/:userId/following?page={page}&limit={limit}` (attach `Authorization` if `authToken`).
- On success: append when `page>1`; replace when `page===1`; `status='success'`.
- On error: `status='error'`; emit `onError`.

3) Interactions (auth required)
- Follow/Unfollow: if no `authToken`, emit `onRequireAuth` and abort.
  - Optimistically toggle `isFollowing`; call `POST|DELETE /users/:targetUserId/follow`; reconcile or rollback.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- pageSize default: 20.
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoint: `GET /users/:userId/following`; follow/unfollow via `POST|DELETE /users/:userId/follow`.

## Notes
- Children are pure; they never fetch or access global state.
