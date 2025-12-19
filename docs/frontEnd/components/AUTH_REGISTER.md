# AUTH_REGISTER — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Tech Stack Integration

- **Framework**: React 19 with JSX
- **State Management**: Zustand for auth state (write token on success)
- **Routing**: React Router DOM v7
- **UI**: Headless UI + Tailwind CSS v4
- **Forms**: React Hook Form with validation (including password policy)
- **i18n**: Intlayer with full RTL support for AR/EN
- **Date Formatting**: dayjs (for rate limit cooldown display)
- **Notifications**: react-hot-toast
- **HTTP Client**: axios via React Query mutations

## Testing Requirements

- **Unit Tests**: Test AuthRegisterForm with various validation states
- **Integration Tests**: Test AuthRegisterController with mocked API responses
- **Test Scenarios**:
  - Successful registration flow
  - Password policy validation (min 8 chars, special char, letters + numbers)
  - Validation errors (email format, username taken, etc.)
  - Duplicate email/username errors
  - Rate limit handling (TOO_MANY_REQUESTS)
  - Navigation after success
  - Auth state update in Zustand

## Component Tree

```
AuthRegisterController
├─ AuthRegisterForm
└─ AuthRegisterStatus
```

- AuthRegisterController (parent): Orchestrates local state, client-side password policy validation, API calls, cooldown, token storage, and navigation events.
- AuthRegisterForm (child): Pure, controlled form logic via props; emits abstract events; no fetching/global state.
- AuthRegisterStatus (child): Pure status relay via props; emits abstract retry; no fetching/global state.

## Responsibilities

| Component               | Responsibilities                                                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| AuthRegisterController  | - Manage registration fields and submission lifecycle for `POST /auth/register`.
- Enforce client-side password policy per flows (min 8, includes special char, mix of letters/numbers); block submit with field errors if invalid.
- Interpret unified envelopes; handle `VALIDATION_ERROR`, `TOO_MANY_REQUESTS`, and duplicates via `DUPLICATE_ENTRY`.
- On success: store token in localStorage, emit `onNavigateHome`, and emit `onAuthSuccess({ token })` (user profile is re-fetched later by the app).
- Provide props to children; no child fetches or accesses global state. | Yes (POST) | Yes (form values, status, errors, cooldown) | Yes (localStorage token, navigation emission) |
| AuthRegisterForm        | - Present logic-only form interface via props.
- Accept controlled values and per-field errors.
- Emit `onChange(field, value)` and `onSubmit({ email, password, username, fullName })`.
- No fetching, no storage, no global state. | No       | No          | No           |
| AuthRegisterStatus      | - Relay abstract status: idle/loading/success/error/cooldown.
- Show error details and cooldown remaining via props.
- Emit `onRetry()` when parent allows retry. | No       | No          | No           |

## Props and Emitted Events

### AuthRegisterController (Parent)

Inputs/Props:
- onAuthSuccess: `(payload: { token: string }) => void` — emitted after successful register; user data is not passed.
- onNavigateHome: `() => void` — emitted after token storage per flows.
- rateLimitCooldownMs?: `number` — optional override for cooldown duration on `TOO_MANY_REQUESTS`.
- storageKey?: `string` — localStorage key for token; default `'token'`.

Emitted Upstream Events:
- onAuthSuccess(payload): `{ token }` — after success and token stored.
- onNavigateHome(): `void` — after `onAuthSuccess`.
- onError(payload): `{ code: string, message: string, fields?: Record<string,string> }` — any error envelope forwarded.

### Child: AuthRegisterForm

Props:
- values: `{ email: string, password: string, username: string, fullName: string }` — controlled by parent.
- fieldErrors?: `Record<string, string>` — includes client-side validations and server `VALIDATION_ERROR.fields`.
- submitting: `boolean` — true during active POST.
- disabled: `boolean` — parent-controlled (e.g., cooldown or submitting).

Events (emitted to parent):
- onChange: `{ field: 'email' | 'password' | 'username' | 'fullName', value: string }` — parent updates `values`.
- onSubmit: `{ email: string, password: string, username: string, fullName: string }` — triggers parent POST.

### Child: AuthRegisterStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error' | 'cooldown'` — abstract state.
- error?: `{ code: string, message: string, fields?: Record<string,string> } | null` — present on `status='error'`.
- cooldownRemainingMs?: `number` — present on `status='cooldown'`.
- lastAttemptAt?: `string | null` — ISO timestamp of last submit (optional).

Events (emitted to parent):
- onRetry: `void` — parent decides if retry is permitted (e.g., after cooldown elapsed).

## Data Flow

Contract summary for `POST /auth/register`:
- Request: `{ email, password, username, fullName }`.
- Success: `{ success: true, data: { user, token }, message? }`.
- Error: `{ success: false, error: { code, message, fields? } }`.

End-to-end:
1) Init
- Controller: `status='idle'`, `values={ email:'', password:'', username:'', fullName:'' }`, `fieldErrors={}`.
- Children receive initial props; no fetching in children.

2) Input & Client Validation
- Form emits `onChange`; controller updates `values`.
- On submit, controller applies password policy (min 8, includes special char, mix letters/numbers). If invalid:
  - Do not call API; populate `fieldErrors.password` with policy messages; set `status='error'`.
  - Allow correction and resubmission.

3) Submit
- If client validation passes, controller: `status='loading'`, `submitting=true`, clears `fieldErrors`.
- Controller POSTs `/auth/register` with `{ email, password, username, fullName }`.

4) Response Handling
- Success: retrieve `{ token }` from `data`.
  - `localStorage.setItem(storageKey || 'token', token)`.
  - Emit `onAuthSuccess({ token })`.
  - Emit `onNavigateHome()`.
  - `status='success'`, `submitting=false`.
- Error: read `error.code`.
  - `VALIDATION_ERROR`: set `fieldErrors` from `error.fields`, `status='error'`.
  - `DUPLICATE_ENTRY`: set `status='error'`, provide message (e.g., duplicate email/username), allow correction.
  - `TOO_MANY_REQUESTS`: `status='cooldown'`; start client cooldown timer for `cooldownMs` (see Defaults). Disable submit until elapsed; Status receives `cooldownRemainingMs`. After timer, transition to `idle`.
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

- rateLimitCooldownMs (default): 900000 ms (15 minutes). Matches AUTH_LOGIN default and is overrideable via prop.
- storageKey (default): `'token'`.

## Contracts & References
- Endpoint: `POST /auth/register` (FRONTEND-CONTRACT.md: Auth → Register).
- Envelope: unified success/error formats.
- Flows: `User-Flows.md` → Register (store token, navigate Home; enforce client cooldown on rate-limit; client-side password policy required).
- Screen Map: `Screen-Map.md` → AUTH_REGISTER (handle `VALIDATION_ERROR`, duplicates, and `TOO_MANY_REQUESTS`).

## Notes
- Children are pure and do not fetch or access global state.
- Session hydration: Consumer should re-fetch the authenticated user profile after register using the token (controller does not emit `user`).
