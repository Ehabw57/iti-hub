# COMMUNITY_MODERATION — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
CommunityModerationController
├─ ModeratorsList
│  └─ ModeratorItem (repeated)
├─ ModeratorActions
└─ ModerationStatus
```

- CommunityModerationController (parent): Orchestrates moderator add/remove via `POST /communities/:id/moderators` and `DELETE /communities/:id/moderators/:userId`; optionally handles post deletion via existing endpoint.
- ModeratorsList (child): Receives current moderators and emits add/remove events; no fetching/global state.
- ModeratorActions (child): Receives form inputs for adding a moderator; no fetching/global state.
- ModerationStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component                       | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| CommunityModerationController   | - Require `authToken`; emit `onRequireAuth` and abort without it.
- Add moderator: `POST /communities/:id/moderators` with `{ userId }`.
- Remove moderator: `DELETE /communities/:id/moderators/:userId`.
- Optionally handle post deletion via `DELETE /posts/:id` (permission server-side).
- Handle unified envelopes; children are pure. | Yes (POST, DELETE) | Yes (list, inFlight flags) | Yes (network calls only) |
| ModeratorsList                  | - Receive list and emit `onRemoveModerator({ userId })`. | No | No | No |
| ModeratorItem                   | - Emit `onRemoveModerator({ userId })`. | No | No | No |
| ModeratorActions                | - Emit `onAddModerator({ userId })`. | No | No | No |
| ModerationStatus                | - Relay abstract status and errors; emit `onRetry()` to reload current list if available. | No | No | No |

## Props and Emitted Events

### CommunityModerationController (Parent)

Inputs/Props:
- communityId: `string` — required.
- authToken: `string` — required.
- onRequireAuth: `() => void` — when token missing.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }`.
- onActionSuccess?(payload): `{ entity: 'community', id: string, action: 'addModerator'|'removeModerator'|'deletePost' }`.

### Child: ModeratorsList

Props:
- items: `Array<UserListItem>` minimal fields: `_id, username, fullName, profilePicture?`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onRemoveModerator: `{ userId: string }`.

### Child: ModeratorActions

Props:
- values: `{ userId?: string }`.
- fieldErrors?: `Record<string, string>`.
- submitting: `boolean`.
- disabled: `boolean`.

Events:
- onAddModerator: `{ userId: string }`.

### Child: ModerationStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent reloads if list is available.

## Data Flow

1) Init
- Controller: `status='idle'`; if current list endpoint exists, load it (not specified); otherwise operate statelessly and rely on app-provided list.

2) Add Moderator
- POST `/communities/:id/moderators` with `{ userId }`.
- On success: emit `onActionSuccess`; optionally update local list if provided.

3) Remove Moderator
- DELETE `/communities/:id/moderators/:userId`.
- On success: emit `onActionSuccess`; optionally update local list if provided.

4) Post Deletion (optional)
- DELETE `/posts/:id` by moderators/owners; on success: emit `onActionSuccess` and remove from any local feed if present.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoints: `POST /communities/:id/moderators`, `DELETE /communities/:id/moderators/:userId`, `DELETE /posts/:id`.

## Notes
- Children are pure; they never fetch or access global state.
- Member removal endpoint not defined; controller does not implement it.
