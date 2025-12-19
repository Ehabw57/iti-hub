# COMMUNITIES_DIRECTORY — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
CommunitiesDirectoryController
├─ CommunitiesFilterBar
├─ CommunitiesList
│  └─ CommunityItem (repeated)
└─ CommunitiesStatus
```

- CommunitiesDirectoryController (parent): Orchestrates `GET /communities` with `page, limit, search, tags`; manages join/leave interactions and optional auth flags.
- CommunitiesFilterBar (child): Receives filter values and emits abstract changes; does not fetch allowed tags (endpoint not implemented).
- CommunitiesList (child): Receives list page(s) and emits pagination and per-item join/leave; no fetching/global state.
- CommunityItem (child): Receives one community; emits join/leave; no fetching/global state.
- CommunitiesStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component                        | Responsibilities                                                                                                                                                                                               | Fetching | Local State | Side-Effects |
|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| CommunitiesDirectoryController   | - Load `GET /communities?page&limit&search&tags` (attach `Authorization` if `authToken`) and expose `isJoined?, role?` flags when authenticated.
- Manage filters (search, tags) controlled by parent; no tag fetching.
- Join/Leave: optimistic toggle with rollback using `POST /communities/:id/join` and `POST /communities/:id/leave`.
- Handle unified envelopes; children are pure. | Yes (GET, POST) | Yes (filters, list pages, flags) | Yes (network calls only) |
| CommunitiesFilterBar             | - Controlled filters via props; emit `onChange` and `onApplyFilters`. | No | No | No |
| CommunitiesList                  | - Receive items and pagination; emit `onLoadMore()` and per-item membership toggles. | No | No | No |
| CommunityItem                    | - Receive fields and flags; emit `onJoinToggle`. | No | No | No |
| CommunitiesStatus                | - Relay abstract status and errors; emit `onRetry()` to reload first page with current filters. | No | No | No |

## Props and Emitted Events

### CommunitiesDirectoryController (Parent)

Inputs/Props:
- authToken?: `string` — optional; include `Authorization` to get membership flags and perform join/leave.
- initialPage?: `number` — default 1.
- pageSize?: `number` — default 20.
- filters: `{ search?: string, tags?: string[] }` — controlled by app.
- onRequireAuth?: `() => void` — emitted when auth-only interaction attempted without token.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onOptimisticRollback(payload): `{ entity: 'community', id: string, action: 'join', reason: string }`.
- onActionSuccess?(payload): `{ entity: 'community', id: string, action: 'join'|'leave' }`.

### Child: CommunitiesFilterBar

Props:
- values: `{ search?: string, tags?: string[] }`.
- disabled: `boolean` — parent-controlled.

Events:
- onChange: `{ field: 'search'|'tags', value: any }`.
- onApplyFilters: `void` — parent triggers reload (page 1).

### Child: CommunitiesList

Props:
- items: `Array<CommunityListItem>` guaranteed fields: `_id, name, description, tags[], profilePicture?, coverImage?, memberCount, postCount, owners[], moderators[], createdAt, updatedAt`.
- flags: `{ isJoined?: boolean, role?: string }` when authenticated.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemJoinToggle: `{ communityId: string, next: boolean }`.

### Child: CommunityItem

Props:
- community: `CommunityListItem` with guarantees above.
- flags: `{ isJoined?: boolean, role?: string }`.
- inFlight?: `{ join?: boolean }`.

Events:
- onJoinToggle: `{ communityId: string, next: boolean }`.

### Child: CommunitiesStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent reloads first page with current filters.

## Data Flow

1) Init
- Controller: `status='idle'`; load first page with current filters.

2) Load Page
- GET `/communities?page={page}&limit={limit}&search={search}&tags={tags}` (attach `Authorization` if `authToken`).
- On success: append when `page>1`; replace when `page===1`; expose membership flags when present; `status='success'`.
- On error: `status='error'`; emit `onError`.

3) Interactions (auth required)
- Join/Leave: if no `authToken`, emit `onRequireAuth` and abort.
  - Optimistically toggle `isJoined`; call `POST /communities/:id/join` or `POST /communities/:id/leave`; reconcile or rollback.

4) Filters Application
- When `onApplyFilters` is emitted, reset pagination to page 1, cancel any in-flight page loads, and reload with the latest filters.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- pageSize default: 20; initialPage default: 1.
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoint: `GET /communities`; join/leave via `POST /communities/:id/(join|leave)`.

## Notes
- Children are pure; they never fetch or access global state.
- Allowed tags endpoint not implemented; app supplies tags filter values.
