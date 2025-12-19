# NOTIFICATIONS_CENTER — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
NotificationsController
├─ NotificationsList
│  └─ NotificationItem (repeated)
├─ NotificationsToolbar
└─ NotificationsStatus
```

- NotificationsController (parent): Orchestrates `GET /notifications` (auth, paginated, limit max 50), `GET /notifications/unread/count`, and marking read via `PUT /notifications/read` and `PUT /notifications/:id/read`.
- NotificationsList (child): Receives list page(s) and emits pagination and per-item mark-as-read; no fetching/global state.
- NotificationItem (child): Receives one notification; emits mark-as-read; no fetching/global state.
- NotificationsToolbar (child): Receives unread count and exposes actions (mark all read, manual refresh); no fetching/global state.
- NotificationsStatus (child): Pure status relay; no fetching/global state.

## Responsibilities

| Component                  | Responsibilities                                                                                                                                                                                  | Fetching | Local State | Side-Effects |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| NotificationsController    | - Require `authToken`; emit `onRequireAuth` and abort without it.
- Load `GET /notifications?page&limit` sorted by `updatedAt`.
- Load unread badge via `GET /notifications/unread/count` periodically and/or reconcile via socket events when provided.
- Mark single/all as read via HTTP (preferred by contract); optionally emit socket events for real-time echo if `socket` provided.
- Handle unified envelopes; children are pure. | Yes (GET, PUT) | Yes (list pages, unread count, inFlight flags) | Yes (network calls; optional socket IO via props) |
| NotificationsList          | - Receive items and pagination; emit `onLoadMore()` and `onItemMarkRead({ notificationId })`. | No | No | No |
| NotificationItem           | - Receive minimal fields and `isRead`; emit `onMarkRead({ notificationId })`. | No | No | No |
| NotificationsToolbar       | - Receive `unreadCount`; emit `onMarkAllRead()` and `onRefresh()`; display-only logic via props. | No | No | No |
| NotificationsStatus        | - Relay abstract status and errors; emit `onRetry()` to reload first page. | No | No | No |

## Props and Emitted Events

### NotificationsController (Parent)

Inputs/Props:
- authToken: `string` — required.
- initialPage?: `number` — default 1.
- pageSize?: `number` — default 20 (capped at 50 per contract).
- pollingIntervalMs?: `number` — optional, for periodic unread count fetches (default 60000 ms).
- socket?: `Socket` — optional, already-authenticated socket instance.
- onRequireAuth?: `() => void` — when token invalid/expired.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onCountChange?(payload): `{ unreadCount: number }` — emitted whenever unread count changes.
- onActionSuccess?(payload): `{ entity: 'notification', id?: string, action: 'markRead'|'markAllRead' }`.

### Child: NotificationsList

Props:
- items: `Array<NotificationListItem>` guaranteed fields: `_id, recipient, actor, actorCount, type, target?, isRead, createdAt, updatedAt`.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onItemMarkRead: `{ notificationId: string }`.

### Child: NotificationItem

Props:
- notification: `NotificationListItem` with guarantees above.
- inFlight?: `{ markRead?: boolean }`.

Events:
- onMarkRead: `{ notificationId: string }`.

### Child: NotificationsToolbar

Props:
- unreadCount: `number`.
- disabled: `boolean`.

Events:
- onMarkAllRead: `void`.
- onRefresh: `void`.

### Child: NotificationsStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent refetches first page and count.

## Data Flow

1) Init
- Controller: `status='idle'`; load first page sorted by `updatedAt` and fetch unread count.
- If `socket` provided, subscribe to: `notification:new`, `notification:update`, `notification:count`, `notification:read`.

2) Load Page
- GET `/notifications?page={page}&limit={min(pageSize,50)}` with `Authorization`.
- On success: append when `page>1`; replace when `page===1`; set `status='success'`.
- On error: `status='error'`; emit `onError`.

3) Unread Count
- GET `/notifications/unread/count` at init and periodically (if `pollingIntervalMs` provided; default 60s).
- On success: update `unreadCount` and emit `onCountChange`.
- Socket events may update counts too; reconcile to HTTP on next poll.

4) Mark as Read (HTTP preferred)
- Single: PUT `/notifications/:id/read`; on success: update item `isRead=true`, decrement `unreadCount`, emit `onActionSuccess`.
- All: PUT `/notifications/read`; on success: set all `isRead=true`, set `unreadCount=0`, emit `onActionSuccess`.
- Optionally emit socket events `notification:markAsRead` / `notification:markAllAsRead` if `socket` provided.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- pageSize default: 20; cap at 50.
- pollingIntervalMs default: 60000 ms (1 min) for unread count.
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoints: `GET /notifications`, `GET /notifications/unread/count`, `PUT /notifications/read`, `PUT /notifications/:id/read`.
- Socket events: `notification:new`, `notification:update`, `notification:count`, `notification:read`.

## Notes
- Children are pure; they never fetch or access global state.
- Server does grouping; controller does not regroup client-side.
