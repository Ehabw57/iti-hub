# COMMUNITY_CREATE — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
CommunityCreateController
├─ CommunityCreateForm
└─ CommunityCreateStatus
```

- CommunityCreateController (parent): Orchestrates client-side validation and multipart upload to `POST /communities`; navigates to community detail on success.
- CommunityCreateForm (child): Controlled form logic via props; emits abstract events; no fetching/global state.
- CommunityCreateStatus (child): Pure status relay (idle/uploading/success/error); no fetching/global state.

## Responsibilities

| Component                   | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| CommunityCreateController   | - Require `authToken`; emit `onRequireAuth` and abort without it.
- Manage values and submission lifecycle for `POST /communities` (multipart).
- Client-side validation: images MIME/size per Upload Contract; `name`, `description`, `tags[]` required.
- Interpret envelopes; handle `VALIDATION_ERROR` and `UPLOAD_ERROR`.
- On success: emit `onCreatedCommunity({ community })` and `onNavigateToCommunity({ communityId })`.
- Children are pure. | Yes (POST multipart) | Yes (values, selected files, status, errors) | Yes (navigation emission) |
| CommunityCreateForm         | - Controlled inputs via props; emit `onChange(field, value)`, `onAddImage(file)`, `onRemoveImage(index)`, and `onSubmit(payload)`. | No | No | No |
| CommunityCreateStatus       | - Relay abstract status and expose upload progress if provided; emit `onRetry()` when allowed. | No | No | No |

## Props and Emitted Events

### CommunityCreateController (Parent)

Inputs/Props:
- authToken: `string` — required.
- constraints?: `{ allowedMime?: string[], maxImageSizeMB?: number }` — optional override; defaults from Upload Contract.
- onNavigateToCommunity: `(payload: { communityId: string }) => void` — emitted on success.
- onCreatedCommunity: `(payload: { community: Community }) => void` — emitted with server entity.
- onRequireAuth: `() => void` — emitted when token missing.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string, fields?: Record<string,string> }`.

### Child: CommunityCreateForm

Props:
- values: `{ name: string, description: string, tags: string[] }`.
- images: `{ profilePicture?: File, coverImage?: File }`.
- fieldErrors?: `Record<string, string>`.
- submitting: `boolean`.
- disabled: `boolean`.

Events:
- onChange: `{ field: 'name'|'description'|'tags', value: any }`.
- onAddImage: `{ field: 'profilePicture'|'coverImage', file: File }`.
- onRemoveImage: `{ field: 'profilePicture'|'coverImage' }`.
- onSubmit: `{ name: string, description: string, tags: string[] }`.

### Child: CommunityCreateStatus

Props:
- status: `'idle' | 'uploading' | 'success' | 'error'`.
- error?: `{ code: string, message: string, fields?: Record<string,string> } | null`.
- uploadProgress?: `{ totalFiles: number, completed: number }`.

Events:
- onRetry: `void`.

## Data Flow

Endpoint: `POST /communities` (multipart) with fields: `name, description, tags[]`; optional images under `image` per Upload Contract.

1) Init
- Controller: `status='idle'`, initialize values and images.

2) Input & Validation
- Form emits changes and image add/remove; controller validates MIME/size.
- Block submit on invalid inputs; populate `fieldErrors`.

3) Submit
- Build FormData: `name`, `description`, `tags` (as appropriate), `image` (profile/cover when provided).
- POST with `Authorization` header.

4) Response Handling
- Success: emit `onCreatedCommunity({ community })`; emit `onNavigateToCommunity({ communityId: community._id })`; `status='success'`.
- Error: map `VALIDATION_ERROR`/`UPLOAD_ERROR` and others to `status='error'`; emit `onError`.

## State Machine

```
idle -> uploading -> success
            └-> error -> idle (after corrections/retry)
```

## Defaults & Configuration
- Controller never reads localStorage; receives token via `authToken` prop.
- Tag list is app-provided; no tag fetch.

## Contracts & References
- Endpoint: `POST /communities` (multipart).

## Notes
- Children are pure; they never fetch or access global state.
