# MESSAGES_LIST — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
MessagesListController
├─ ConversationsList
│  └─ ConversationItem (repeated)
└─ MessagesListStatus
```

- MessagesListController (parent): Orchestrates `GET /conversations` (auth, paginated), optional socket reconciliation for lastMessage/unread counts, and navigation to conversation detail.
- ConversationsList (child): Receives list page(s) and emits pagination and per-conversation actions; no fetching/global state.
- ConversationItem (child): Receives one conversation; emits open/navigation; no fetching/global state.
- MessagesListStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component                | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| MessagesListController   | - Require `authToken`; emit `onRequireAuth` and abort without it.
- Load `GET /conversations?page&limit` with `Authorization`.
- Maintain pagination; update lastMessage/unread counts via socket events when provided.
- Create conversations (1:1 and group) per flows; navigate/open on success.
- Handle unified envelopes; children are pure. | Yes (GET, POST) | Yes (list pages, unread map) | Yes (network calls; optional socket IO via props) |
| ConversationsList        | - Receive items and pagination; emit `onLoadMore()` and per-item open/create events. | No | No | No |
| ConversationItem         | - Receive conversation fields; emit `onOpen({ conversationId })`. | No | No | No |
| MessagesListStatus       | - Relay abstract status and errors; emit `onRetry()` to reload first page. | No | No | No |

## Props and Emitted Events

### MessagesListController (Parent)

Inputs/Props:
- authToken: `string` — required.
- initialPage?: `number` — default 1.
- pageSize?: `number` — default 20.
- socket?: `Socket` — optional, already-authenticated socket instance; controller subscribes to relevant events.
- onRequireAuth?: `() => void` — when token missing/invalid.
- onNavigateToConversation: `(payload: { conversationId: string }) => void` — emitted to open a conversation.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onActionSuccess?(payload): `{ entity: 'conversation', id: string, action: 'open'|'create' }`.

### Child: ConversationsList

Props:
- items: `Array<ConversationListItem>` guaranteed fields: `_id, type, participants[], name?, image?, admin?, lastMessage{ content, senderId, timestamp }?, unreadCount(Map)?, createdAt, updatedAt`.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `void`.
- onOpen: `{ conversationId: string }`.
- onCreateDirect: `{ participantId: string }`.
- onCreateGroup: `{ name: string, participantIds: string[], image?: File }`.

### Child: ConversationItem

Props:
- conversation: `ConversationListItem` with guarantees above.
- inFlight?: `{ open?: boolean }`.

Events:
- onOpen: `{ conversationId: string }`.

### Child: MessagesListStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent refetches first page.

## Data Flow

1) Init
- Controller: `status='idle'`; load first page.
- If `socket` provided, subscribe to: `message:new`, `message:seen`, and optionally `typing:start/stop` (list may ignore typing but can update presence if desired).

2) Load Page
- GET `/conversations?page={page}&limit={limit}` with `Authorization`.
- On success: append when `page>1`; replace when `page===1`; `status='success'`.
- On error: `status='error'`; emit `onError`.

3) Open Conversation
- On `onOpen({ conversationId })`: emit `onNavigateToConversation({ conversationId })` and `onActionSuccess({ entity:'conversation', id: conversationId, action:'open' })`.

4) Create Conversation
- Direct: POST `/conversations` with `{ participantId }`; on success (200 existing or 201 new), emit `onNavigateToConversation({ conversationId })`.
- Group: POST `/conversations/group` with `{ name, participantIds[], image? }`; on success (201), emit `onNavigateToConversation({ conversationId })`.

5) Socket Reconciliation (optional)
- `message:new`: update list item `lastMessage` and increment unread count for that conversation (unless it’s currently open elsewhere per app state; controller doesn’t track focus).
- `message:seen`: update unread counts accordingly.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- pageSize default: 20; initialPage default: 1.
- Controller never reads localStorage; receives token via `authToken` prop.
- Socket is optional and must be provided by the app; controller does not create connections.

## Contracts & References
- Endpoints: `GET /conversations`, `POST /conversations`, `POST /conversations/group`.
- Socket events: `message:new`, `message:seen`, `typing:start`, `typing:stop` per contract.

## Notes
- Children are pure; they never fetch or access global state.
