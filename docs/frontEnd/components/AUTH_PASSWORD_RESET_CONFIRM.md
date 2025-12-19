# AUTH_PASSWORD_RESET_CONFIRM — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
AuthPasswordResetConfirmController
├─ PasswordResetConfirmForm
└─ PasswordResetConfirmStatus
```

- AuthPasswordResetConfirmController (parent): Orchestrates local state, API call, and navigation to Login on success.
- PasswordResetConfirmForm (child): Pure, controlled form logic via props; emits abstract events; no fetching/global state.
- PasswordResetConfirmStatus (child): Pure status relay via props; no cooldown for this step; no fetching/global state.

## Responsibilities

| Component                        | Responsibilities                                                                                                                                                                       | Fetching | Local State | Side-Effects |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| AuthPasswordResetConfirmController | - Manage new password input and submission lifecycle for `POST /auth/password-reset/confirm` with `{ token, newPassword }`.
- Interpret unified envelopes; handle `INVALID_TOKEN`, `TOKEN_EXPIRED`, and `VALIDATION_ERROR`.
- On success: emit `onNavigateLogin` per flows (redirect to Login).
- Provide props to children; no child fetches or accesses global state. | Yes (POST) | Yes (newPassword value, status, errors) | Yes (navigation emission to Login) |
| PasswordResetConfirmForm         | - Present logic-only form interface via props.
- Accept controlled values and per-field errors.
- Emit `onChange(field, value)` and `onSubmit({ newPassword })`.
- No fetching, no storage, no global state. | No | No | No |
| PasswordResetConfirmStatus       | - Relay abstract status: idle/loading/success/error.
- Show error details via props.
- No cooldown state for this step. | No | No | No |

## Props and Emitted Events

### AuthPasswordResetConfirmController (Parent)

Inputs/Props:
- token: `string` — required token obtained from the email link.
- onNavigateLogin: `() => void` — emitted after successful password reset per flows.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string, fields?: Record<string,string> }` — any error envelope forwarded.
- onSuccess?(payload): `{ message?: string }` — optional; emitted when the server returns success; app may use this for toast/logging before navigation.

### Child: PasswordResetConfirmForm

Props:
- values: `{ newPassword: string }` — controlled by parent.
- fieldErrors?: `Record<string, string>` — from `VALIDATION_ERROR.fields`.
- submitting: `boolean` — true during active POST.
- disabled: `boolean` — parent-controlled (e.g., submitting).

Events (emitted to parent):
- onChange: `{ field: 'newPassword', value: string }` — parent updates `values`.
- onSubmit: `{ newPassword: string }` — triggers parent POST; controller supplies `token`.

### Child: PasswordResetConfirmStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'` — abstract state.
- error?: `{ code: string, message: string, fields?: Record<string,string> } | null` — present on `status='error'`.
- lastAttemptAt?: `string | null` — ISO timestamp of last submit (optional).

Events: none required for this step.

## Data Flow

Contract summary for `POST /auth/password-reset/confirm`:
- Request: `{ token, newPassword }`.
- Success: `{ success: true, data: {}, message }`.
- Error: `{ success: false, error: { code, message, fields? } }`.

End-to-end:
1) Init
- Controller: `status='idle'`, `values={ newPassword:'' }`, `fieldErrors={}`.
- Children receive initial props; no fetching in children.

2) Input
- Form emits `onChange`; controller updates `values`.

3) Submit
- Form emits `onSubmit({ newPassword })`.
- Controller: `status='loading'`, `submitting=true`, clears `fieldErrors`.
- Controller POSTs `/auth/password-reset/confirm` with `{ token, newPassword }`.

4) Response Handling
- Success:
  - Optionally emit `onSuccess({ message })`.
  - Emit `onNavigateLogin()` per flows.
  - `status='success'`, `submitting=false`.
- Error: read `error.code`.
  - `INVALID_TOKEN` / `TOKEN_EXPIRED`: set `status='error'`, provide message; user must restart request step.
  - `VALIDATION_ERROR`: set `fieldErrors` from `error.fields`, `status='error'`.
  - Other codes (e.g., network): `status='error'`, allow retry.
- Emit `onError({ code, message, fields? })` for observability.
- `submitting=false` in all error cases.

## State Machine

```
idle -> loading -> success
            └-> error -> idle (on user change/submit)
```

## Defaults & Configuration

- No cooldown handling for confirm step (not specified in contracts/flows).

## Contracts & References
- Endpoint: `POST /auth/password-reset/confirm` (FRONTEND-CONTRACT.md: Auth → Password reset confirm).
- Envelope: unified success/error formats.
- Flows: `User-Flows.md` → Password Reset (confirm step redirects to Login).
- Screen Map: `Screen-Map.md` → AUTH_PASSWORD_RESET_CONFIRM.

## Notes
- Children are pure and do not fetch or access global state.
- `token` is provided to the controller via props; children never access it.
