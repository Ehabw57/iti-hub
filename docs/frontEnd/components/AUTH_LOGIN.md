# AUTH_LOGIN — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Tech Stack Integration

- **Framework**: React 19 with JSX
- **State Management**: Zustand for auth state (write token on success)
- **Routing**: React Router DOM v7
- **UI**: Headless UI + Tailwind CSS v4
- **Forms**: React Hook Form with validation
- **i18n**: Intlayer with full RTL support for AR/EN
- **Date Formatting**: dayjs (for rate limit cooldown display)
- **Notifications**: react-hot-toast
- **HTTP Client**: axios via React Query mutations

## Testing Requirements

- **Unit Tests**: Test AuthLoginForm with various validation states
- **Integration Tests**: Test AuthLoginController with mocked API responses
- **Test Scenarios**:
  - Successful login flow
  - Validation errors (email, password)
  - Invalid credentials error
  - Account blocked error
  - Rate limit handling (TOO_MANY_REQUESTS)
  - Navigation after success
  - Auth state update in Zustand

## Component Tree

```
AuthLoginController (page/container)
├─ AuthLoginForm (presentational)
└─ AuthLoginStatus (presentational)
```

- **AuthLoginController** (parent): Smart container using React Query mutation for `POST /auth/login`. Manages form submission via React Hook Form, writes token to Zustand store on success, handles errors. Never passes Zustand or React Query directly to children.
- **AuthLoginForm** (child): Pure form component using React Hook Form; receives field errors and submitting state via props; emits `onSubmit` event. Styled with Tailwind, supports RTL.
- **AuthLoginStatus** (child): Pure component displaying error messages with Headless UI Dialog, cooldown timer with dayjs; supports i18n via Intlayer.

## Responsibilities

| Component             | Responsibilities                                                                                                                                                                                                                  | Fetching | Local State | Side-Effects |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| AuthLoginController   | - Manage credentials and submission lifecycle for `POST /auth/login`.
- Interpret unified envelopes; handle `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_BLOCKED`, `TOO_MANY_REQUESTS`.
- Enforce client cooldown on rate-limit (`TOO_MANY_REQUESTS`).
- On success: store token in localStorage, emit `onNavigateHome`, and emit `onAuthSuccess({ token })` (user profile is re-fetched later by the app).
- Provide props to children; no child fetches or accesses global state. | Yes (POST) | Yes (credentials, status, errors, cooldown) | Yes (localStorage token, navigation emission) |
| AuthLoginForm         | - Present logic-only form interface via props.
- Accept controlled values and per-field errors.
- Emit `onChange(field, value)` and `onSubmit({ email, password })`.
- No fetching, no storage, no global state. | No       | No          | No           |
| AuthLoginStatus       | - Relay abstract status: idle/loading/success/error/cooldown.
- Show error details and cooldown remaining via props.
- Emit `onRetry()` when parent allows retry. | No       | No          | No           |

## Props and Emitted Events

### AuthLoginController (Parent)

Inputs/Props:
- onAuthSuccess: `(payload: { token: string }) => void` — emitted after successful login; user data is not passed.
- onNavigateHome: `() => void` — emitted after token storage per flows.
- rateLimitCooldownMs?: `number` — optional override for cooldown duration on `TOO_MANY_REQUESTS`.
- storageKey?: `string` — localStorage key for token; default `'token'`.

Emitted Upstream Events:
- onAuthSuccess(payload): `{ token }` — after success and token stored.
- onNavigateHome(): `void` — after `onAuthSuccess`.
- onError(payload): `{ code: string, message: string, fields?: Record<string,string> }` — any error envelope forwarded.

### Child: AuthLoginForm

Props:
- values: `{ email: string, password: string }` — controlled by parent.
- fieldErrors?: `Record<string, string>` — from `VALIDATION_ERROR.fields`.
- submitting: `boolean` — true during active POST.
- disabled: `boolean` — parent-controlled (e.g., cooldown or submitting).

Events (emitted to parent):
- onChange: `{ field: 'email' | 'password', value: string }` — parent updates `values`.
- onSubmit: `{ email: string, password: string }` — triggers parent POST.

### Child: AuthLoginStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error' | 'cooldown'` — abstract state.
- error?: `{ code: string, message: string, fields?: Record<string,string> } | null` — present on `status='error'`.
- cooldownRemainingMs?: `number` — present on `status='cooldown'`.
- lastAttemptAt?: `string | null` — ISO timestamp of last submit (optional).

Events (emitted to parent):
- onRetry: `void` — parent decides if retry is permitted (e.g., after cooldown elapsed).

## Data Flow

Contract summary for `POST /auth/login`:
- Request: `{ email, password }`.
- Success: `{ success: true, data: { user, token }, message? }`.
- Error: `{ success: false, error: { code, message, fields? } }`.

End-to-end:
1) Init
- Controller: `status='idle'`, `values={ email:'', password:'' }`, `fieldErrors={}`.
- Children receive initial props; no fetching in children.

2) Input
- Form emits `onChange`; controller updates `values`.

3) Submit
- Form emits `onSubmit({ email, password })`.
- Controller: `status='loading'`, `submitting=true`, clears `fieldErrors`.
- Controller POSTs `/auth/login` with `{ email, password }`.

4) Response Handling
- Success: retrieve `{ token }` from `data`.
  - `localStorage.setItem(storageKey || 'token', token)`.
  - Emit `onAuthSuccess({ token })`.
  - Emit `onNavigateHome()`.
  - `status='success'`, `submitting=false`.
- Error: read `error.code`.
  - `VALIDATION_ERROR`: set `fieldErrors` from `error.fields`, `status='error'`.
  - `INVALID_CREDENTIALS` / `ACCOUNT_BLOCKED`: `status='error'`, expose message; allow immediate retry.
  - `TOO_MANY_REQUESTS`: `status='cooldown'`; start client cooldown timer for `cooldownMs` (see Defaults). Disable submit until elapsed; Status receives `cooldownRemainingMs`. After timer, transition to `idle`.
  - Other codes (e.g., `AUTH_ERROR`, network): `status='error'`, allow retry.
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

- rateLimitCooldownMs (default): 900000 ms (15 minutes). Rationale: aligns with documented auth rate-limit window ("10/15min") in Screen Map; override via prop if server policy differs.
- storageKey (default): `'token'`.

## Contracts & References
- Endpoint: `POST /auth/login` (FRONTEND-CONTRACT.md: Auth → Login).
- Envelope: unified success/error formats.
- Flows: `User-Flows.md` → Login (store token, navigate Home; enforce client cooldown on rate-limit).
- Screen Map: `Screen-Map.md` → AUTH_LOGIN (handle listed errors; rate-limit noted).

## Notes
- Children are pure and do not fetch or access global state.
- Session hydration: Consumer should re-fetch the authenticated user profile after login using the token (controller does not emit `user`).

## Tech Stack Implementation Details

### React Query Integration
- **Mutation Hook**: `useMutation` for POST `/auth/login`
  ```javascript
  const loginMutation = useMutation({
    mutationFn: (credentials) => axios.post('/auth/login', credentials),
    onSuccess: (response) => {
      const { token, user } = response.data.data
      useAuthStore.getState().setToken(token)
      useAuthStore.getState().setUser(user)
      toast.success(t('auth.loginSuccess'))
      navigate('/')
    },
    onError: (error) => {
      // Handle error codes
    }
  })
  ```

### Zustand Store Structure
```javascript
// useAuthStore.js
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
)
```

### React Hook Form Integration
```javascript
const {
  register,
  handleSubmit,
  formState: { errors },
  setError
} = useForm({
  defaultValues: { email: '', password: '' }
})

// Map server validation errors to form
if (error?.code === 'VALIDATION_ERROR' && error?.fields) {
  Object.entries(error.fields).forEach(([field, message]) => {
    setError(field, { type: 'server', message })
  })
}
```

### RTL & i18n Implementation
**Intlayer Setup:**
```javascript
// auth.content.ts
export default {
  key: 'auth-login',
  content: {
    title: {
      en: 'Login to Your Account',
      ar: 'تسجيل الدخول إلى حسابك'
    },
    emailLabel: {
      en: 'Email',
      ar: 'البريد الإلكتروني'
    },
    passwordLabel: {
      en: 'Password',
      ar: 'كلمة المرور'
    },
    loginButton: {
      en: 'Login',
      ar: 'تسجيل الدخول'
    },
    emailRequired: {
      en: 'Email is required',
      ar: 'البريد الإلكتروني مطلوب'
    },
    passwordRequired: {
      en: 'Password is required',
      ar: 'كلمة المرور مطلوبة'
    },
    invalidCredentials: {
      en: 'Invalid email or password',
      ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    },
    accountBlocked: {
      en: 'Your account has been blocked',
      ar: 'تم حظر حسابك'
    },
    tooManyRequests: {
      en: 'Too many attempts. Try again in {time}',
      ar: 'محاولات كثيرة جداً. حاول مرة أخرى في {time}'
    },
    forgotPassword: {
      en: 'Forgot password?',
      ar: 'نسيت كلمة المرور؟'
    },
    noAccount: {
      en: "Don't have an account?",
      ar: 'ليس لديك حساب؟'
    },
    signUp: {
      en: 'Sign up',
      ar: 'إنشاء حساب'
    }
  }
}
```

**RTL Styling with Tailwind:**
```jsx
<div className="ltr:ml-4 rtl:mr-4">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    {t('emailLabel')}
  </label>
  <input
    type="email"
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
               focus:border-primary-500 focus:ring-primary-500
               rtl:text-right"
    {...register('email')}
  />
</div>
```

### Styling with Tailwind & Headless UI

**Form Layout:**
```jsx
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
  <div className="max-w-md w-full space-y-8">
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        {t('title')}
      </h2>
    </div>
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  </div>
</div>
```

**Error Display with Headless UI:**
```jsx
<Transition show={!!error} as={Fragment}>
  <Dialog onClose={() => setError(null)}>
    <Dialog.Panel className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden 
                                 rounded-2xl bg-white p-6 text-left align-middle 
                                 shadow-xl transition-all">
          <Dialog.Title className="text-lg font-medium text-gray-900">
            {t('errorTitle')}
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog.Panel>
  </Dialog>
</Transition>
```

**Loading State:**
```jsx
<button
  type="submit"
  disabled={isSubmitting || cooldownSeconds > 0}
  className="group relative w-full flex justify-center py-2 px-4 border 
             border-transparent text-sm font-medium rounded-md text-white 
             bg-primary-600 hover:bg-primary-700 focus:outline-none 
             focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting && (
    <FiLoader className="animate-spin ltr:mr-2 rtl:ml-2 h-4 w-4" />
  )}
  {t('loginButton')}
</button>
```

### Rate Limit Cooldown Display
```jsx
{cooldownSeconds > 0 && (
  <div className="rounded-md bg-yellow-50 p-4">
    <div className="flex">
      <FiAlertCircle className="h-5 w-5 text-yellow-400" />
      <div className="ltr:ml-3 rtl:mr-3">
        <p className="text-sm text-yellow-700">
          {t('tooManyRequests', {
            time: dayjs.duration(cooldownSeconds, 'seconds').format('mm:ss')
          })}
        </p>
      </div>
    </div>
  </div>
)}
```

### React Router Integration
```javascript
import { useNavigate, Link } from 'react-router-dom'

const AuthLoginController = () => {
  const navigate = useNavigate()
  
  const onSuccess = () => {
    // After token stored
    navigate('/')
  }
  
  return (
    // ...
    <div className="text-center">
      <Link to="/auth/password-reset/request" className="text-primary-600">
        {t('forgotPassword')}
      </Link>
      <p className="mt-2">
        {t('noAccount')}{' '}
        <Link to="/auth/register" className="text-primary-600">
          {t('signUp')}
        </Link>
      </p>
    </div>
  )
}
```

### Icons Usage (react-icons)
- `FiMail` for email field icon
- `FiLock` for password field icon
- `FiEye`/`FiEyeOff` for password visibility toggle
- `FiLoader` for loading spinner (with `animate-spin` class)
- `FiAlertCircle` for error/warning icons

### Toast Notifications
```javascript
import toast from 'react-hot-toast'

// Success
toast.success(t('auth.loginSuccess'), {
  duration: 3000,
  position: 'top-center',
  style: {
    background: '#10b981',
    color: '#fff'
  }
})

// Error
toast.error(t('auth.loginError'), {
  duration: 4000,
  position: 'top-center'
})
```

### localStorage Cooldown Persistence
```javascript
// Store cooldown end time
const cooldownEndTime = Date.now() + 900000 // 15 minutes
localStorage.setItem('login-cooldown', cooldownEndTime.toString())

// Check on mount
useEffect(() => {
  const stored = localStorage.getItem('login-cooldown')
  if (stored) {
    const endTime = parseInt(stored)
    const remaining = endTime - Date.now()
    if (remaining > 0) {
      setCooldownSeconds(Math.ceil(remaining / 1000))
    } else {
      localStorage.removeItem('login-cooldown')
    }
  }
}, [])
```
