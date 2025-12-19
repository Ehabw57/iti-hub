# CONVERSATION_DETAIL — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
ConversationDetailController
├─ ConversationHeader
├─ MessageList
│  └─ MessageItem (repeated)
├─ MessageComposer
├─ GroupParticipants (group only)
└─ ConversationStatus
```

- ConversationDetailController (parent): Orchestrates `GET /conversations/:conversationId`, message pagination via `GET /conversations/:conversationId/messages` (cursor), sending messages (multipart), marking seen, and optional socket integration (send/seen/typing).
- ConversationHeader (child): Receives conversation meta; emits group admin actions; no fetching/global state.
- MessageList (child): Receives messages and pagination cursor; emits load-older and seen events; no fetching/global state.
- MessageComposer (child): Controlled compose logic; emits abstract send, typing start/stop; no fetching/global state.
- GroupParticipants (child): Receives participants list and emits add/remove/leave; no fetching/global state.
- ConversationStatus (child): Pure status relay; no fetching/global state.

## Responsibilities

| Component                      | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| ConversationDetailController   | - Require `authToken`; emit `onRequireAuth` and abort without it.
- Load `GET /conversations/:conversationId` (participant required).
- Load messages via `GET /conversations/:conversationId/messages?cursor&limit`; prepend older messages on pagination.
- Send messages `POST /conversations/:conversationId/messages` (multipart) with optional `content` and optional `image`; if both present, send text first, then image.
- Mark seen via `PUT /conversations/:conversationId/seen` on view/focus/when new messages become visible.
- Optional socket: emit/handle `message:send`, `message:new`, `message:seen`, `typing:start`, `typing:stop` with throttling for typing.
- Handle unified envelopes; children are pure. | Yes (GET, POST, PUT) | Yes (messages, cursor, inFlight flags) | Yes (network + optional socket IO via props) |
| ConversationHeader             | - Receive meta and role; emit admin actions: add/remove member, leave group, update name/image. | No | No | No |
| MessageList                    | - Receive messages and cursor; emit `onLoadOlder({ cursor })` and `onSeenVisible({ lastMessageId })`. | No | No | No |
| MessageItem                    | - Receive a single message; emit no network actions directly. | No | No | No |
| MessageComposer                | - Controlled inputs; emit `onTypingStart`, `onTypingStop`, and `onSend({ content?, image? })`. | No | No | No |
| GroupParticipants              | - Receive participants; emit `onAddMember({ userId })`, `onRemoveMember({ userId })`, `onLeaveGroup()`; admin only enforced by parent. | No | No | No |
| ConversationStatus             | - Relay abstract status and errors; emit `onRetry()` to reload header and latest page. | No | No | No |

## Props and Emitted Events

### ConversationDetailController (Parent)

Inputs/Props:
- conversationId: `string` — required.
- authToken: `string` — required.
- pageSize?: `number` — default 20.
- socket?: `Socket` — optional, already-authenticated socket instance.
- onRequireAuth?: `() => void` — when token invalid/expired.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onActionSuccess?(payload): `{ entity: 'message'|'conversation', id?: string, action: string }`.

### Child: ConversationHeader

Props:
- meta: `Conversation` guaranteed fields: `_id, type, participants[], name?, image?, admin?, createdAt, updatedAt`.

Events:
- onAddMember: `{ userId: string }`.
- onRemoveMember: `{ userId: string }`.
- onLeaveGroup: `void`.
- onUpdateGroup: `{ name?: string, image?: File }`.

### Child: MessageList

Props:
- items: `Array<MessageItem>` guaranteed fields: `_id, conversation, sender, content?, image?, status, seenBy[], createdAt`.
- cursor?: `string | null` — last message id from previous page for pagination.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadOlder: `{ cursor: string | null }` — parent loads older messages with provided cursor.
- onSeenVisible: `{ lastMessageId: string }` — parent marks seen via HTTP and/or socket.

### Child: MessageComposer

Props:
- values: `{ content?: string, image?: File }`.
- submitting: `boolean`.
- disabled: `boolean`.

Events:
- onTypingStart: `void`.
- onTypingStop: `void`.
- onSend: `{ content?: string, image?: File }` — controller enforces sending text first, then image when both present.

### Child: GroupParticipants

Props:
- participants: `Array<UserListItem>` minimal fields: `_id, username, fullName, profilePicture?`.
- admin?: `string | string[]` — derived from conversation meta.
- inFlight?: `{ add?: boolean, remove?: boolean, leave?: boolean, update?: boolean }`.

Events:
- onAddMember: `{ userId: string }`.
- onRemoveMember: `{ userId: string }`.
- onLeaveGroup: `void`.
- onUpdateGroup: `{ name?: string, image?: File }`.

### Child: ConversationStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent refetches header and latest page.

## Data Flow

1) Init
- Controller: `status='idle'`; load header and latest messages concurrently.
- If `socket` provided, subscribe to `message:new`, `message:seen`, `typing:start`, `typing:stop`.

2) Load Header
- GET `/conversations/:conversationId` with `Authorization`.

3) Load Messages (cursor pagination)
- GET `/conversations/:conversationId/messages?cursor={cursor}&limit={limit}`.
- Append older messages at the top when loading more.

4) Send Message (multipart)
- If both `content` and `image` provided, send text first (`POST`), then image (`POST`).
- Optionally emit socket `message:send` for immediate local echo; reconcile with `message:new`.

5) Mark Seen
- PUT `/conversations/:conversationId/seen` on view/focus/visibility changes; also emit socket `message:seen` when provided.

6) Group Admin Actions (admin only)
- Add: `POST /conversations/:conversationId/members` with `{ userId }`.
- Remove: `DELETE /conversations/:conversationId/members/:userId`.
- Leave: `POST /conversations/:conversationId/leave`.
- Update: `PATCH /conversations/:conversationId` with `{ name? }` or multipart image.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- pageSize default: 20.
- Controller never reads localStorage; receives token via `authToken` prop.
- Socket is optional and must be provided by the app; controller does not create connections.

## Contracts & References
- Endpoints: `GET /conversations`, `GET /conversations/:conversationId`, `GET /conversations/:conversationId/messages`, `POST /conversations`, `POST /conversations/group`, `POST /conversations/:conversationId/messages`, `PUT /conversations/:conversationId/seen`, `POST /conversations/:conversationId/members`, `DELETE /conversations/:conversationId/members/:userId`, `POST /conversations/:conversationId/leave`, `PATCH /conversations/:conversationId`.
- Socket events: `message:new`, `message:seen`, `typing:start`, `typing:stop` per contract.

## Notes
- Children are pure; they never fetch or access global state.
