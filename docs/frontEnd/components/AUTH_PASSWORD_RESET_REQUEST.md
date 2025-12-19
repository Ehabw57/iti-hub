# AUTH_PASSWORD_RESET_REQUEST — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Component Tree

```
AuthPasswordResetRequestController
├─ PasswordResetRequestForm
└─ PasswordResetRequestStatus
```

- AuthPasswordResetRequestController (parent): Orchestrates local state, API call, cooldown logic, and success message handling (no navigation).
- PasswordResetRequestForm (child): Pure, controlled form logic via props; emits abstract events; no fetching/global state.
- PasswordResetRequestStatus (child): Pure status relay via props; emits abstract retry; no fetching/global state.

## Responsibilities

| Component                         | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| AuthPasswordResetRequestController| - Manage email input and submission lifecycle for `POST /auth/password-reset/request`.
- Interpret unified envelopes; handle `VALIDATION_ERROR` and `TOO_MANY_REQUESTS`.
- Enforce client cooldown on rate-limit; expose remaining time.
- On success: capture and expose generic success message; no navigation.
- Provide props to children; no child fetches or accesses global state. | Yes (POST) | Yes (email value, status, errors, cooldown, successMessage) | No (no token storage or navigation) |
| PasswordResetRequestForm          | - Present logic-only form interface via props.
- Accept controlled values and per-field errors.
- Emit `onChange(field, value)` and `onSubmit({ email })`.
- No fetching, no storage, no global state. | No | No | No |
| PasswordResetRequestStatus        | - Relay abstract status: idle/loading/success/error/cooldown.
- Show error details, success message, and cooldown remaining via props.
- Emit `onRetry()` when parent allows retry. | No | No | No |

## Props and Emitted Events

### AuthPasswordResetRequestController (Parent)

Inputs/Props:
- rateLimitCooldownMs?: `number` — optional override for cooldown duration on `TOO_MANY_REQUESTS` (default 900000 ms = 15 minutes).

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string, fields?: Record<string,string> }` — any error envelope forwarded.
- onSuccess?(payload): `{ message: string }` — optional; emitted when the server returns success (generic message), for app-level observability.

### Child: PasswordResetRequestForm

Props:
- values: `{ email: string }` — controlled by parent.
- fieldErrors?: `Record<string, string>` — from `VALIDATION_ERROR.fields`.
- submitting: `boolean` — true during active POST.
- disabled: `boolean` — parent-controlled (e.g., cooldown or submitting).

Events (emitted to parent):
- onChange: `{ field: 'email', value: string }` — parent updates `values`.
- onSubmit: `{ email: string }` — triggers parent POST.

### Child: PasswordResetRequestStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error' | 'cooldown'` — abstract state.
- error?: `{ code: string, message: string, fields?: Record<string,string> } | null` — present on `status='error'`.
- successMessage?: `string` — generic success message from server on `status='success'`.
- cooldownRemainingMs?: `number` — present on `status='cooldown'`.
- lastAttemptAt?: `string | null` — ISO timestamp of last submit (optional).

Events (emitted to parent):
- onRetry: `void` — parent decides if retry is permitted (e.g., after cooldown elapsed).

## Data Flow

Contract summary for `POST /auth/password-reset/request`:
- Request: `{ email }`.
- Success: `{ success: true, data: {}, message }` where `message` is generic.
- Error: `{ success: false, error: { code, message, fields? } }`.

End-to-end:
1) Init
- Controller: `status='idle'`, `values={ email:'' }`, `fieldErrors={}`, `successMessage=''`.
- Children receive initial props; no fetching in children.

2) Input
- Form emits `onChange`; controller updates `values`.

3) Submit
- Form emits `onSubmit({ email })`.
- Controller: `status='loading'`, `submitting=true`, clears `fieldErrors` and `successMessage`.
- Controller POSTs `/auth/password-reset/request` with `{ email }`.

4) Response Handling
- Success:
  - Retrieve `message` from response.
  - Set `successMessage` and `status='success'`.
  - Optionally emit `onSuccess({ message })`.
  - `submitting=false`.
- Error: read `error.code`.
  - `VALIDATION_ERROR`: set `fieldErrors` from `error.fields`, `status='error'`.
  - `TOO_MANY_REQUESTS`: `status='cooldown'`; start client cooldown timer for `rateLimitCooldownMs` (default 15 min). Disable submit until elapsed; Status receives `cooldownRemainingMs`. After timer, transition to `idle`.
  - Other codes (e.g., network): `status='error'`, allow retry.
- Emit `onError({ code, message, fields? })` for observability.
- `submitting=false` in all error cases.

5) Retry
- Status emits `onRetry()` when user attempts again.
- Controller checks if cooldown elapsed; if yes, move to `idle` and accept new submit.

## State Machine

```
idle -> loading -> success
            └-> error -> idle (on user change/submit)
            └-> cooldown -> idle (after cooldown or onRetry when elapsed)
```

## Defaults & Configuration

- rateLimitCooldownMs (default): 900000 ms (15 minutes). Override via prop if server policy differs.

## Contracts & References
- Endpoint: `POST /auth/password-reset/request` (FRONTEND-CONTRACT.md: Auth → Password reset request).
- Envelope: unified success/error formats.
- Flows: `User-Flows.md` → Password Reset (request step shows success message; client enforces cooldown on rate-limit).
- Screen Map: `Screen-Map.md` → AUTH_PASSWORD_RESET_REQUEST.

## Notes
- Children are pure and do not fetch or access global state.
- No token storage and no navigation in this step; app proceeds when user follows the email link.
