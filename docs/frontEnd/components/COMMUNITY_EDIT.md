# COMMUNITY_EDIT — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
CommunityEditController
├─ CommunityEditForm
└─ CommunityEditStatus
```

- CommunityEditController (parent): Orchestrates `PATCH /communities/:id` and image uploads `POST /communities/:id/profile-picture` and `/cover-image`.
- CommunityEditForm (child): Controlled form logic via props; emits abstract events; no fetching/global state.
- CommunityEditStatus (child): Pure status relay (idle/loading/success/error); no fetching/global state.

## Responsibilities

| Component                 | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| CommunityEditController   | - Require `authToken`; emit `onRequireAuth` and abort without it.
- Manage description update via `PATCH /communities/:id`.
- Manage profile/cover image uploads via `POST /communities/:id/profile-picture` and `/cover-image` with `image` field.
- Interpret envelopes; handle `VALIDATION_ERROR` and `UPLOAD_ERROR` for images.
- On success: emit `onUpdatedCommunity({ community })` and optionally `onNavigateToCommunity({ communityId })`.
- Children are pure. | Yes (PATCH, POST multipart) | Yes (values, image files, status, errors) | Yes (navigation emission) |
| CommunityEditForm         | - Controlled inputs via props; emit `onChange(field, value)`, `onUploadImage(field, file)`, `onSubmit(payload)`. | No | No | No |
| CommunityEditStatus       | - Relay abstract status; emit `onRetry()` when allowed. | No | No | No |

## Props and Emitted Events

### CommunityEditController (Parent)

Inputs/Props:
- authToken: `string` — required.
- communityId: `string` — required.
- onNavigateToCommunity?: `(payload: { communityId: string }) => void` — optional; emitted after updates.
- onUpdatedCommunity: `(payload: { community: Community }) => void` — emitted with server entity.
- onRequireAuth: `() => void` — when token missing.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string, fields?: Record<string,string> }`.

### Child: CommunityEditForm

Props:
- values: `{ description: string }`.
- images: `{ profilePicture?: File, coverImage?: File }`.
- fieldErrors?: `Record<string, string>`.
- submitting: `boolean`.
- disabled: `boolean`.

Events:
- onChange: `{ field: 'description', value: string }`.
- onUploadImage: `{ field: 'profilePicture'|'coverImage', file: File }`.
- onSubmit: `{ description: string }`.
- onUploadProfilePicture: `{ file: File }`.
- onUploadCoverImage: `{ file: File }`.

### Child: CommunityEditStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string, fields?: Record<string,string> } | null`.

Events:
- onRetry: `void`.

## Data Flow

1) Description Update
- PATCH `/communities/:id` with `{ description }` using `Authorization`.
- On success: emit `onUpdatedCommunity({ community })`.

2) Image Uploads
- POST `/communities/:id/profile-picture` with `image`.
- POST `/communities/:id/cover-image` with `image`.
- On success: emit `onUpdatedCommunity({ community })` with updated image URLs.

3) Errors
- Map `VALIDATION_ERROR` and `UPLOAD_ERROR`; emit `onError`.

## State Machine

```
idle -> loading -> success
            └-> error -> idle (after corrections/retry)
```

## Defaults & Configuration
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoints: `PATCH /communities/:id`, `POST /communities/:id/(profile-picture|cover-image)`.

## Notes
- Children are pure; they never fetch or access global state.
