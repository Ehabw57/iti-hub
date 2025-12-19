# Sprint 1: Foundation & Core Auth - Detailed Task Documentation

**Sprint Duration**: 5 days (Days 1-7 in project timeline)  
**Sprint Goal**: Setup project infrastructure and implement complete authentication system  
**Team Size**: 2 developers working in parallel  
**Prerequisites**: All planning documents reviewed and approved

---

## Overview

Sprint 1 establishes the technical foundation and delivers a fully functional authentication system. By the end of this sprint, users can register, login, reset passwords, and the application has reusable UI components, state management, and testing infrastructure in place.

### Sprint Success Criteria
- [ ] All dependencies installed and configured
- [ ] Zustand stores working with persistence
- [ ] React Query configured with error handling
- [ ] Axios interceptors handling auth tokens
- [ ] Intlayer i18n working with EN/AR and RTL support
- [ ] Testing infrastructure operational
- [ ] Complete authentication flows working
- [ ] Protected routing functional
- [ ] Test coverage >80% for auth features
- [ ] All auth pages support RTL layout

---

## Task Breakdown

### SETUP-001: Install Missing Dependencies
**Assignee**: Dev 1  
**Estimated Time**: 1 hour  
**Priority**: Critical - Blocker for all other tasks  
**Day**: Day 1 Morning

#### Description
Install all required npm packages that are not currently in package.json but are specified in the tech stack.

#### Dependencies to Install
```bash
# Core dependencies
npm install react-hook-form

# Testing libraries
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui

# MSW for API mocking
npm install -D msw
```

#### Acceptance Criteria
- [ ] react-hook-form installed (latest stable version)
- [ ] vitest and all testing libraries installed as devDependencies
- [ ] MSW installed for API mocking
- [ ] package.json updated with correct versions
- [ ] No peer dependency warnings
- [ ] `npm install` runs without errors

#### Verification Steps
1. Run `npm install` - should complete without errors
2. Check package.json - all new packages listed
3. Run `npm list react-hook-form` - should show installed version
4. Run `npm list vitest` - should show installed version

#### Potential Issues
- **Peer dependency conflicts**: If React 19 causes issues with testing libraries, check for @testing-library/react compatibility
- **MSW version**: Ensure MSW v2+ for latest API
- **Resolution**: Check library changelogs and use compatible versions

#### References
- React Hook Form: https://react-hook-form.com/
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/
- MSW: https://mswjs.io/

---

### SETUP-002: Configure Build Tools
**Assignee**: Dev 2  
**Estimated Time**: 2 hours  
**Priority**: Critical - Blocker for testing and development  
**Day**: Day 1 Morning

#### Description
Update vite.config.js to include testing configuration, path aliases, and ensure all plugins are properly configured for the tech stack.

#### Configuration Requirements

**1. Vitest Configuration**
- Add test configuration block to vite.config.js
- Set globals: true for describe/it/expect
- Set environment: 'jsdom' for DOM testing
- Configure setupFiles path: './tests/setup.js'
- Enable coverage with v8 provider
- Set coverage reporters: text, json, html
- Exclude node_modules and tests from coverage

**2. Path Aliases**
- Configure @ alias pointing to ./src
- Configure @components alias pointing to ./src/components
- Configure @pages alias pointing to ./src/pages
- Configure @hooks alias pointing to ./src/hooks
- Configure @lib alias pointing to ./src/lib
- Configure @store alias pointing to ./src/store

**3. Environment Variables**
- Ensure VITE_API_BASE_URL is accessible
- Ensure VITE_SOCKET_URL is accessible
- Create .env.example with template values

**4. Plugin Configuration**
- Verify @vitejs/plugin-react-swc is active
- Verify @tailwindcss/vite plugin is active
- Verify vite-intlayer plugin is active with correct config

#### Acceptance Criteria
- [ ] vite.config.js includes complete test configuration
- [ ] Path aliases configured and working
- [ ] .env.example file created with all required variables
- [ ] All three plugins (React, Tailwind, Intlayer) configured
- [ ] Vite dev server starts without errors
- [ ] Vite build completes without errors

#### Verification Steps
1. Run `npm run dev` - should start without errors
2. Run `npm run build` - should build successfully
3. Import using @ alias in a test file - should resolve correctly
4. Check vite.config.js syntax - no errors

#### Potential Issues
- **Plugin conflicts**: Ensure plugin order is correct (React → Tailwind → Intlayer)
- **Path resolution**: Windows vs Linux path separators - use path.resolve()
- **Environment variables**: Ensure VITE_ prefix for client-accessible vars

#### References
- docs/frontEnd/plan/IMPLEMENTATION_PLAN.md (Vite config example)
- docs/frontEnd/components/TECH_STACK_GUIDE.md

---

### SETUP-003: Configure Tailwind CSS with Design System
**Assignee**: Dev 1  
**Estimated Time**: 2-3 hours  
**Priority**: High - Required for all UI components  
**Day**: Day 1 Afternoon

#### Description
Create a comprehensive index.css file that defines all design system colors, typography, and custom utilities as CSS custom properties. Configure Tailwind for RTL support and ensure the design system is accessible via Tailwind classes.

#### Requirements

**1. Create src/styles/index.css**

Based on docs/frontEnd/DESIGN_SYSTEM.md, define all design tokens and Tailwind configuration:

**Import Tailwind Base, Components, and Utilities**
```css
@import 'tailwindcss';
```

**Color Custom Properties (CSS Variables)**
- Define all Primary Red scale (50-900) as CSS variables under `:root`
- Define all Secondary Blue scale (50-900) as CSS variables
- Define all Neutral gray scale (50-900) as CSS variables
- Define status colors: success, error, warning, info
- Create light theme color mappings
- Create dark theme color mappings under `.dark` selector (for future use)

**Tailwind Theme Extension (using @theme directive)**
- Extend colors with design system palette (Primary Red, Secondary Blue, Neutral)
- Map custom CSS variables to Tailwind color names
- Define custom shadow elevations (elevation-1, elevation-2, elevation-3)
- Define custom spacing scale (4px base unit, multiples up to 64px)
- Define border radius tokens (sm: 4px, md: 8px, lg: 12px, xl: 16px, full: 9999px)

**Typography System**
- Set root font family to Inter with full fallback stack
- Define font size tokens for all hierarchy levels (H1-H6, Body1-2, Caption, Button)
- Define line height tokens
- Define font weight tokens (400, 500, 600, 700)
- Create typography utilities using @utility directive

**RTL Support**
- Add `[dir="rtl"]` selectors for directional properties using @utility
- Define logical property utilities (inline-start, inline-end)
- Create RTL-aware spacing utilities

**Global Base Styles (using @layer base)**
- Reset default margins/paddings
- Set box-sizing: border-box
- Apply Inter font to body
- Set default text color (Neutral 900)
- Set default background (white)
- Configure smooth scrolling
- Set focus-visible styles

**Custom Utilities (using @layer utilities)**
- Shadow elevation classes
- Typography hierarchy classes
- RTL directional utilities
- Custom spacing utilities if needed

**2. No separate tailwind.config.js needed**
- All Tailwind configuration now lives in index.css using `@theme`, `@layer`, and `@utility` directives
- Vite Tailwind plugin will process index.css directly

**3. File Structure**
```
src/styles/
    └── index.css (single source of truth for all styles and Tailwind config)
```

#### Acceptance Criteria
- [ ] index.css created with @import 'tailwindcss'
- [ ] All color variables defined under :root
- [ ] @theme directive used to extend Tailwind theme with design system
- [ ] All typography scales defined as CSS custom properties
- [ ] Typography utilities created with @utility directive
- [ ] Spacing and radius tokens defined in @theme
- [ ] Shadow elevations defined in @theme
- [ ] RTL directional utilities created with @utility
- [ ] @layer base used for global styles
- [ ] @layer utilities used for custom utility classes
- [ ] Dark mode structure prepared with .dark selector (not implemented)
- [ ] Inter font loads successfully
- [ ] No tailwind.config.js file exists

#### Verification Steps
1. Start dev server - no CSS errors in console
2. Inspect root element - CSS variables present
3. Apply Tailwind class `bg-red-600` - should match Primary 600 (#DC2626)
4. Apply Tailwind class `text-blue-600` - should match Secondary 600 (#2563EB)
5. Test custom typography utility classes (e.g., `.text-heading-1`)
6. Test custom shadow classes (e.g., `.shadow-elevation-1`)
7. Test RTL by setting `<html dir="rtl">` - layout should flip correctly
8. Check font - should be Inter
9. Verify no tailwind.config.js in project root

#### Potential Issues
- **New Tailwind syntax**: Ensure using Tailwind v4+ syntax with @theme, @layer, @utility directives
- **Color naming**: Use `@theme` to properly extend colors without conflicts
- **RTL testing**: Use browser dev tools to set dir="rtl" on html element
- **Font loading**: Ensure Inter is loaded via Google Fonts or local files
- **Build compatibility**: Ensure Vite Tailwind plugin supports v4+ CSS-based config

#### Testing Scenarios
- Visual regression: Create simple component with all color variants
- RTL test: Create component with padding/margin, test in both LTR and RTL
- Typography test: Render all heading levels and verify sizes/weights match design system
- Theme extension test: Verify custom colors accessible via standard Tailwind classes
- Shadow test: Apply elevation classes and verify shadows render correctly


#### References
- docs/frontEnd/DESIGN_SYSTEM.md (complete specification)
- Tailwind RTL: https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support

---

### SETUP-004: Create Zustand Stores
**Assignee**: Dev 2  
**Estimated Time**: 3 hours  
**Priority**: Critical - Required for auth and UI state  
**Day**: Day 1 Afternoon

#### Description
Create three Zustand stores with persistence middleware for auth state, UI preferences, and socket connection state. No code examples - implement based on patterns in TECH_STACK_GUIDE.md.

#### Stores to Create

**1. src/store/authStore.js**

State:
- token: string | null
- user: object | null
- isAuthenticated: boolean

Actions:
- setToken(token): Update token and isAuthenticated flag
- setUser(user): Update user object
- logout(): Clear all auth state, clear React Query cache

Persistence:
- Use zustand persist middleware
- Storage key: 'auth-storage'
- Partialize: Only persist token (not user object)
- OnRehydrateStorage: Log rehydration for debugging

**2. src/store/uiStore.js**

State:
- theme: 'light' | 'dark'
- locale: 'en' | 'ar'
- dir: 'ltr' | 'rtl'

Actions:
- setTheme(theme): Update theme, apply to document
- setLocale(locale): Update locale and dir, update html dir attribute

Persistence:
- Use zustand persist middleware
- Storage key: 'ui-storage'
- Persist all state

**3. src/store/socketStore.js**

State:
- socket: SocketIO instance | null
- connected: boolean
- reconnecting: boolean

Actions:
- setSocket(socket): Store socket instance
- setConnected(connected): Update connection status
- setReconnecting(reconnecting): Update reconnection status
- disconnect(): Close socket and clear state

Persistence:
- NO persistence (socket connections cannot be persisted)

#### Acceptance Criteria
- [ ] authStore.js created with correct state and actions
- [ ] authStore persists token to localStorage
- [ ] authStore logout clears queryClient cache
- [ ] uiStore.js created with theme and locale state
- [ ] uiStore persists preferences to localStorage
- [ ] uiStore setLocale updates html dir attribute
- [ ] socketStore.js created without persistence
- [ ] All stores follow Zustand best practices
- [ ] Stores are typed correctly (if using TypeScript) or have JSDoc
- [ ] Each store exports a single hook (useAuthStore, useUIStore, useSocketStore)

#### Verification Steps
1. Import useAuthStore in a test component - should work
2. Call setToken() - should update state and localStorage
3. Refresh page - token should be rehydrated from localStorage
4. Call logout() - should clear state and localStorage
5. Import useUIStore - test setLocale('ar') - html should have dir="rtl"
6. Refresh page - locale preference should persist

#### Potential Issues
- **Persist middleware import**: Ensure correct import from 'zustand/middleware'
- **QueryClient access in logout**: Import queryClient, don't recreate it
- **HTML dir attribute**: Use document.documentElement.setAttribute('dir', dir)
- **Store initialization**: Stores initialize on first import, ensure proper order

#### Testing Scenarios
- **Unit test authStore**: 
  - Test setToken updates isAuthenticated
  - Test logout clears all state
  - Test persistence by mocking localStorage
- **Unit test uiStore**:
  - Test setLocale updates both locale and dir
  - Test setTheme updates theme
  - Test persistence
- **Integration test**:
  - Test auth flow sets token in store
  - Test logout clears token from store
  - Test locale change updates components

#### References
- docs/frontEnd/components/TECH_STACK_GUIDE.md (Zustand store patterns)
- docs/frontEnd/plan/IMPLEMENTATION_PLAN.md (store structure)
- Zustand docs: https://github.com/pmndrs/zustand

---

### SETUP-005: Configure React Query
**Assignee**: Dev 1  
**Estimated Time**: 2 hours  
**Priority**: Critical - Required for all API calls  
**Day**: Day 2 Morning

#### Description
Create and configure React Query client with default options, error handling for token expiration, and dev tools setup.

#### Requirements

**1. Create src/lib/queryClient.js**

Configuration:
- Create QueryClient instance with defaultOptions
- Set staleTime: 5 minutes (5 * 60 * 1000)
- Set cacheTime: 10 minutes (10 * 60 * 1000)
- Set retry: 1 (only retry once)
- Set refetchOnWindowFocus: false
- Configure global onError handler for queries
- Configure global onError handler for mutations
- Both handlers should check for TOKEN_EXPIRED error code
- On TOKEN_EXPIRED: call useAuthStore.getState().logout()

**2. Update src/main.jsx**

- Import QueryClientProvider from @tanstack/react-query
- Import ReactQueryDevtools from @tanstack/react-query-devtools
- Wrap App with QueryClientProvider
- Add ReactQueryDevtools as sibling to App (only in dev mode)

#### Acceptance Criteria
- [ ] queryClient.js created and exports queryClient
- [ ] Default options configured correctly
- [ ] Global error handler catches TOKEN_EXPIRED
- [ ] Error handler calls authStore logout
- [ ] QueryClientProvider wraps App in main.jsx
- [ ] DevTools added (visible in dev mode only)
- [ ] queryClient instance is singleton (single import)

#### Verification Steps
1. Start dev server - React Query DevTools should appear
2. Open DevTools - should show empty queries
3. Make a test query - should appear in DevTools
4. Simulate TOKEN_EXPIRED error - should logout and clear token
5. Check console - no errors related to React Query

#### Potential Issues
- **Multiple QueryClient instances**: Always import from lib/queryClient.js, never create new instances
- **Circular dependency**: authStore imports queryClient for logout, queryClient imports authStore for logout handler - this is OK
- **DevTools in production**: Use `import.meta.env.DEV` to conditionally render DevTools

#### Testing Scenarios
- **Integration test**:
  - Mock API with TOKEN_EXPIRED error
  - Trigger query
  - Verify logout is called
  - Verify token cleared from store
- **DevTools visibility**:
  - In dev mode: DevTools should render
  - In build mode: DevTools should not render

#### References
- docs/frontEnd/components/TECH_STACK_GUIDE.md (React Query configuration)
- docs/frontEnd/plan/IMPLEMENTATION_PLAN.md (queryClient setup)
- React Query docs: https://tanstack.com/query/latest

---

### SETUP-006: Configure Axios & API Client
**Assignee**: Dev 2  
**Estimated Time**: 2-3 hours  
**Priority**: Critical - Required for all HTTP requests  
**Day**: Day 2 Morning

#### Description
Create axios instance with base URL configuration, request/response interceptors for authentication, and error response normalization.

#### Requirements

**1. Create src/lib/api.js**

- Create axios instance with baseURL from environment variable
- Default baseURL: 'http://localhost:3030' (no /api prefix per contract)
- Set timeout: 10000 (10 seconds)
- Set headers: { 'Content-Type': 'application/json' }

**Request Interceptor**:
- Get token from useAuthStore.getState().token
- If token exists, add Authorization header: `Bearer ${token}`
- Return modified config
- Log request details in dev mode (optional)

**Response Interceptor Success**:
- Return response as-is (don't unwrap response.data)
- Components using React Query will handle data extraction

**Response Interceptor Error**:
- Check if error.response exists
- Extract error code: error.response?.data?.error?.code
- If code is TOKEN_EXPIRED or INVALID_TOKEN:
  - Call useAuthStore.getState().logout()
  - Redirect to /login (window.location.href)
- Return Promise.reject(error) to propagate error

**2. Export Convenience Methods** (optional but recommended)

- Export api instance as default
- Optionally export typed methods: api.get, api.post, api.put, api.delete, api.patch

#### Acceptance Criteria
- [ ] api.js created with axios instance
- [ ] baseURL configured from environment variable
- [ ] Request interceptor adds Authorization header when token exists
- [ ] Response interceptor handles TOKEN_EXPIRED
- [ ] Response interceptor redirects to login on auth errors
- [ ] Error responses properly propagated
- [ ] axios instance exported as default
- [ ] No hardcoded URLs or tokens

#### Verification Steps
1. Import api in test file - should import successfully
2. Make test GET request - should include Authorization header if logged in
3. Make test GET request without token - should not include Authorization header
4. Mock TOKEN_EXPIRED response - should logout and redirect
5. Check network tab - Authorization header present on authenticated requests

#### Potential Issues
- **Circular dependency**: Similar to queryClient, api imports authStore - this is OK
- **Redirect timing**: Use window.location.href for hard redirect (clears React state)
- **Environment variable**: Must use VITE_ prefix for Vite to expose it
- **Base URL trailing slash**: Backend has no trailing slash, don't add one

#### Testing Scenarios
- **Unit test interceptors**:
  - Test request interceptor adds token
  - Test request interceptor skips token when not present
  - Test response interceptor handles TOKEN_EXPIRED
  - Test response interceptor calls logout
- **Integration test**:
  - Make authenticated request with valid token
  - Make request with expired token
  - Verify logout triggered
  - Verify redirect occurred

#### References
- docs/frontEnd/FRONTEND-CONTRACT.md (Base URL and auth header format)
- docs/frontEnd/components/TECH_STACK_GUIDE.md (Axios configuration)
- docs/frontEnd/plan/IMPLEMENTATION_PLAN.md (API setup)

---

### SETUP-007: Configure Intlayer for i18n
**Assignee**: Dev 1  
**Estimated Time**: 3 hours  
**Priority**: High - Required for all UI text  
**Day**: Day 2 Afternoon

#### Description
Configure Intlayer for internationalization with English and Arabic support, full RTL capability, and create language switcher component.

#### Requirements

**1. Update intlayer.config.ts**

- Ensure locales include 'en' and 'ar'
- Set defaultLocale: 'en'
- Configure content directory paths
- Enable middleware if needed
- Set editor mode for development

**2. Create Language Switcher Component**

File: src/components/common/LanguageSwitcher.jsx

Requirements:
- Read current locale from useUIStore
- Render dropdown or toggle (use Headless UI Menu)
- Options: English, Arabic (with native names)
- On change: call useUIStore setLocale(locale)
- Should update document dir attribute
- Should persist preference
- Icon: Globe icon from react-icons

**3. Update src/main.jsx**

- Wrap App with IntlayerProvider
- Pass locale from useUIStore
- Ensure provider is inside QueryClientProvider but outside Router

**4. Create Test Content File**

File: src/content/common/test.content.ts

- Create simple test content with EN and AR translations
- Use to verify i18n working
- Example: { greeting: { en: "Hello", ar: "مرحبا" } }

**5. Update HTML Element**

File: src/App.jsx or layout component

- Create effect that syncs useUIStore dir to document.documentElement
- Watch for locale changes
- Update dir attribute: 'ltr' or 'rtl'

#### Acceptance Criteria
- [ ] intlayer.config.ts configured correctly
- [ ] LanguageSwitcher component created
- [ ] Language switcher uses Headless UI Menu
- [ ] Switching language updates locale in store
- [ ] Switching language updates document dir attribute
- [ ] Locale preference persists across page reloads
- [ ] IntlayerProvider wraps App in main.jsx
- [ ] Test content file created and working
- [ ] HTML dir attribute syncs with locale

#### Verification Steps
1. Start dev server - no i18n errors
2. Render LanguageSwitcher - should show current language
3. Click switcher - should show EN/AR options
4. Select Arabic - should update to Arabic and set dir="rtl"
5. Refresh page - locale should persist (Arabic, RTL)
6. Select English - should update to English and set dir="ltr"
7. Test with test content file - translations should work

#### Potential Issues
- **Provider order**: IntlayerProvider must wrap all components using translations
- **RTL layout shift**: Entire layout should flip in RTL, test thoroughly
- **Locale persistence**: Already handled by uiStore, ensure LanguageSwitcher reads from store
- **Font support**: Ensure Inter font supports Arabic characters (it does)

#### Testing Scenarios
- **Unit test LanguageSwitcher**:
  - Renders with current locale
  - Clicking option calls setLocale
  - Menu opens and closes correctly
- **Integration test locale switching**:
  - Switch to Arabic
  - Verify dir="rtl" on html element
  - Verify locale in store updated
  - Verify persistence
- **Visual test**:
  - Create simple component with text
  - Switch language
  - Verify text changes
  - Verify layout flips in RTL

#### References
- docs/frontEnd/components/TECH_STACK_GUIDE.md (i18n setup)
- client/intlayer.config.ts (existing config)
- Intlayer docs: https://intlayer.org/
- Headless UI Menu: https://headlessui.com/react/menu

---

### SETUP-008: Setup Testing Infrastructure
**Assignee**: Dev 2  
**Estimated Time**: 3 hours  
**Priority**: High - Required before writing tests  
**Day**: Day 2 Afternoon

#### Description
Create testing setup file, configure MSW for API mocking, create test utilities for rendering with providers, and write example tests to verify setup.

#### Requirements

**1. Create tests/setup.js**

- Import @testing-library/jest-dom for matchers
- Configure global test environment
- Setup beforeAll/afterAll hooks if needed
- Configure MSW server setup (import and configure)

**2. Create tests/mocks/handlers.js**

- Import { http, HttpResponse } from 'msw'
- Define base URL: http://localhost:3030
- Create mock handlers for auth endpoints:
  - POST /auth/login (success and error scenarios)
  - POST /auth/register (success and error scenarios)
  - POST /auth/password-reset/request
  - POST /auth/password-reset/confirm
- Use response format from FRONTEND-CONTRACT.md (unified envelope)

**3. Create tests/mocks/server.js**

- Import { setupServer } from 'msw/node'
- Import handlers
- Create and export server instance
- Configure server.listen(), server.resetHandlers(), server.close()

**4. Create tests/utils/test-utils.jsx**

Purpose: Render components with all necessary providers

Requirements:
- Create custom render function that wraps component with:
  - QueryClientProvider (create fresh queryClient for each test)
  - IntlayerProvider (with 'en' locale)
  - BrowserRouter (from react-router-dom)
- Export custom render function
- Export all of @testing-library/react for convenience
- Create helper: renderWithAuth (renders with token in authStore)

**5. Create Example Test**

File: tests/unit/stores/authStore.test.js

- Test setToken action
- Test logout action
- Test isAuthenticated computed value
- Test persistence (mock localStorage)

Purpose: Verify testing infrastructure works

#### Acceptance Criteria
- [ ] tests/setup.js created with jest-dom matchers
- [ ] MSW handlers created for auth endpoints
- [ ] MSW server configured and exported
- [ ] test-utils.jsx created with custom render
- [ ] Custom render wraps all providers correctly
- [ ] renderWithAuth helper created
- [ ] Example test written and passing
- [ ] `npm test` command runs tests
- [ ] Coverage report can be generated

#### Verification Steps
1. Run `npm test` - should discover and run tests
2. Run example test - should pass
3. Check coverage report - should generate without errors
4. Import test-utils in new test - should work
5. Use MSW handlers - should intercept requests

#### Potential Issues
- **MSW v2 API changes**: Use http.post not rest.post (MSW v2 syntax)
- **Provider nesting**: Correct order: QueryClient → Intlayer → Router → Component
- **localStorage mocking**: Use vi.stubGlobal or Object.defineProperty for localStorage
- **Test isolation**: Create fresh queryClient for each test to avoid state leakage

#### Testing Scenarios
- **Verify MSW intercepts requests**:
  - Make axios request to /auth/login in test
  - Verify MSW handler responds
  - Verify response matches expected format
- **Verify custom render works**:
  - Render component using custom render
  - Component should have access to all providers
  - No provider errors in console
- **Verify renderWithAuth**:
  - Render protected component with renderWithAuth
  - Should have token in authStore
  - Should be able to make authenticated requests

#### References
- docs/frontEnd/plan/IMPLEMENTATION_PLAN.md (testing setup examples)
- Vitest docs: https://vitest.dev/
- Testing Library: https://testing-library.com/docs/react-testing-library/setup
- MSW docs: https://mswjs.io/docs/getting-started

---

### AUTH-001: Create Reusable UI Components
**Assignee**: Dev 1 (lead), Dev 2 (support)  
**Estimated Time**: 8-12 hours  
**Priority**: Critical - Blocker for all auth pages  
**Day**: Day 3 (Full day, pair programming recommended)

#### Description
Create foundational presentational UI components that will be used across all auth pages and eventually the entire application. Components should be pure, receive all data via props, and follow design system specifications.

#### Components to Create

**1. src/components/common/Button.jsx**

Variants:
- primary (red background)
- secondary (blue background)
- text (transparent, link-style)

Props:
- variant: 'primary' | 'secondary' | 'text'
- type: 'button' | 'submit' | 'reset'
- loading: boolean
- disabled: boolean
- children: ReactNode
- onClick: function
- className: string (for additional styles)
- Other native button props via ...props

Behavior:
- Show loading spinner when loading=true
- Disable interaction when disabled or loading
- Apply design system styles from DESIGN_SYSTEM.md
- Support RTL layout
- Apply focus ring on keyboard focus
- Use react-icons for loading spinner (AiOutlineLoading with spin animation)

**2. src/components/common/Input.jsx**

Types:
- text
- email
- password (with show/hide toggle)
- search

Props:
- type: string
- label: string
- name: string
- value: string
- onChange: function
- error: string | undefined
- placeholder: string
- disabled: boolean
- required: boolean
- Other native input props via ...props

Behavior:
- Render label above input (left-aligned)
- Show error message below input when error prop present
- Apply error border when error exists
- Show required indicator (*) if required=true
- Password type: include toggle button to show/hide (use react-icons: AiOutlineEye/AiOutlineEyeInvisible)
- Apply design system styles from DESIGN_SYSTEM.md
- Support RTL layout
- Apply focus ring on focus

**3. src/components/common/Card.jsx**

Props:
- children: ReactNode
- className: string
- padding: 'sm' | 'md' | 'lg' (default 'md')

Behavior:
- Container with white background
- Border and shadow per design system
- Radius: 12px
- Padding based on padding prop: sm=16px, md=20px, lg=24px
- Support RTL layout

**4. src/components/common/Loading.jsx**

Variants:
- spinner (centered spinning icon)
- skeleton (placeholder bars for content)

Props:
- variant: 'spinner' | 'skeleton'
- size: 'sm' | 'md' | 'lg' (for spinner)
- className: string

Behavior:
- Spinner: Use react-icons AiOutlineLoading with spin animation
- Skeleton: Gray animated bars (use Tailwind animate-pulse)
- Center spinner by default
- Sizes: sm=24px, md=32px, lg=48px

**5. src/components/common/ErrorDisplay.jsx**

Props:
- error: { code: string, message: string, fields?: object } | null
- onRetry: function | undefined
- className: string

Behavior:
- Display error message with red accent (per design system)
- Show error code in lighter text
- If onRetry provided, show "Try Again" button
- Use design system error colors
- Support i18n for common error codes (translate code to user-friendly message)
- Use Headless UI Dialog for critical errors (optional, for blocking errors)

#### Acceptance Criteria
- [ ] Button component created with all variants
- [ ] Button supports loading and disabled states
- [ ] Input component created with all types
- [ ] Input shows/hides password correctly
- [ ] Input displays error messages
- [ ] Card component created
- [ ] Loading component created with spinner and skeleton
- [ ] ErrorDisplay component created
- [ ] All components use design system colors/styles (reference DESIGN_SYSTEM.md)
- [ ] All components support RTL layout
- [ ] All components are pure (no side effects)
- [ ] All components have PropTypes or TypeScript types
- [ ] Each component has unit test file created
- [ ] Tests verify all variants and states
- [ ] Components exported from src/components/common/index.js

#### Verification Steps
1. Create test page rendering all components
2. Test each variant of Button - should match design system
3. Test Input with error - should show error message
4. Test Input password toggle - should show/hide password
5. Test Loading spinner - should spin
6. Test ErrorDisplay with error object - should display message
7. Switch to RTL - all components should flip correctly
8. Run unit tests - all should pass

#### Potential Issues
- **Design system adherence**: Reference DESIGN_SYSTEM.md frequently, don't invent styles
- **Tailwind classes**: Use Tailwind utilities, not custom CSS
- **RTL layout**: Use logical properties (ps/pe instead of pl/pr)
- **Component coupling**: Keep components pure, no Zustand/React Query inside

#### Testing Scenarios

**Button Tests**:
- Renders with text
- Calls onClick when clicked
- Shows loading spinner when loading=true
- Disables when disabled=true
- Applies correct variant styles
- Supports keyboard interaction (Enter/Space)

**Input Tests**:
- Renders with label
- Calls onChange on input
- Shows error message when error prop present
- Toggles password visibility
- Applies error styles when error exists
- Shows required indicator
- Supports RTL (label position)

**Card Tests**:
- Renders children
- Applies correct padding variant
- Has correct border and shadow

**Loading Tests**:
- Renders spinner variant
- Renders skeleton variant
- Applies correct size

**ErrorDisplay Tests**:
- Displays error message
- Displays error code
- Shows retry button when onRetry provided
- Calls onRetry when button clicked
- Hides when error is null

#### References
- docs/frontEnd/DESIGN_SYSTEM.md (complete styles specification)
- docs/frontEnd/components/TECH_STACK_GUIDE.md (component patterns)
- Headless UI components: https://headlessui.com/react/menu
- React Icons: https://react-icons.github.io/react-icons/

---

### AUTH-002: Implement Login Page
**Assignee**: Dev 1  
**Estimated Time**: 8-10 hours  
**Priority**: Critical  
**Days**: Day 4-5

#### Description
Implement complete login functionality following the AUTH_LOGIN.md specification. This includes the smart controller, presentational form component, and status display component with rate limiting.

#### Component Structure

**Smart Container**: AuthLoginController (src/pages/auth/AuthLoginController.jsx)
- Uses React Query mutation for POST /auth/login
- Uses React Hook Form for form state
- Manages rate limit cooldown with localStorage
- Writes token to Zustand authStore on success
- Navigates to home feed on success
- Never passes Zustand or React Query directly to children

**Presentational Form**: AuthLoginForm (src/components/auth/AuthLoginForm.jsx)
- Pure component receiving all data via props
- Renders two inputs: email, password
- Emits onSubmit event
- Uses common Input and Button components
- Supports i18n with Intlayer

**Status Display**: AuthLoginStatus (src/components/auth/AuthLoginStatus.jsx)
- Pure component displaying error/success/cooldown states
- Shows cooldown timer using dayjs
- Emits onRetry event
- Uses ErrorDisplay component

#### Implementation Requirements

**1. Create React Query Mutation Hook**

File: src/hooks/mutations/useLogin.js

- Create mutation for POST /auth/login
- Use axios api instance from src/lib/api.js
- Request body: { email, password }
- On success: return { token, user }
- On error: handle all error codes per FRONTEND-CONTRACT.md

**2. Create Login Controller**

File: src/pages/auth/AuthLoginController.jsx

- Use React Hook Form with validation
- Email validation: required, email format
- Password validation: required, min 6 characters
- Use useLogin mutation hook
- Implement rate limit cooldown:
  - On TOO_MANY_REQUESTS: store timestamp in localStorage
  - Default cooldown: 15 minutes (900000 ms)
  - Check cooldown on component mount
  - Disable submit during cooldown
  - Calculate remaining time
- On success:
  - Call authStore.setToken(token)
  - Call authStore.setUser(user)
  - Navigate to '/' using react-router navigate
- Map server errors to field errors
- Pass all necessary props to children

**3. Create Login Form Component**

File: src/components/auth/AuthLoginForm.jsx

- Receive values, errors, submitting, disabled via props
- Render email Input (type="email")
- Render password Input (type="password" with toggle)
- Render submit Button (variant="primary", loading state)
- Render link to password reset (Text variant Button or Link)
- Render link to register page
- Use Intlayer for all text (create content file)
- Support RTL layout

**4. Create Login Status Component**

File: src/components/auth/AuthLoginStatus.jsx

- Receive status, error, cooldownRemainingMs via props
- Use dayjs to format cooldown time (e.g., "Try again in 14:32")
- Display error message using ErrorDisplay component
- Show retry button if not in cooldown
- Support i18n for status messages

**5. Create i18n Content Files**

File: src/content/auth/login.content.ts

- Create translations for:
  - Page title
  - Email label, placeholder
  - Password label, placeholder
  - Submit button text
  - "Forgot password?" link
  - "Don't have an account? Register" text
  - Error messages for common codes
  - Cooldown message template
- Include both EN and AR translations

**6. Create Login Page Route**

- Update src/routes/index.jsx
- Add route: /login → AuthLoginController
- Ensure route is public (no auth required)

#### Acceptance Criteria
- [ ] useLogin mutation hook created
- [ ] AuthLoginController created with all logic
- [ ] AuthLoginForm presentational component created
- [ ] AuthLoginStatus component created
- [ ] Form validation working (required, email format)
- [ ] Rate limiting implemented with localStorage
- [ ] Cooldown timer displays correctly
- [ ] On success: token stored in authStore
- [ ] On success: navigation to home feed
- [ ] Error handling for all error codes
- [ ] i18n content file created with EN/AR translations
- [ ] Login route added
- [ ] All components support RTL
- [ ] Unit tests for all components
- [ ] Integration test for login flow

#### Verification Steps
1. Navigate to /login - page should render
2. Submit empty form - should show validation errors
3. Submit invalid email - should show email format error
4. Submit valid credentials - should login and navigate to home
5. Check authStore - token should be set
6. Submit invalid credentials - should show error
7. Trigger rate limit (5 failed attempts) - should show cooldown
8. Check localStorage - cooldown timestamp should be stored
9. Refresh page - cooldown should persist
10. Switch to Arabic - all text should be in Arabic, layout RTL

#### Potential Issues
- **Rate limit tracking**: Use localStorage key 'login-cooldown' with timestamp
- **Cooldown calculation**: Compare current time with stored timestamp, calculate difference
- **Navigation timing**: Navigate after token is set in store
- **Error code mapping**: Map INVALID_CREDENTIALS to user-friendly message
- **Form state**: React Hook Form manages local form state, not Zustand

#### Testing Scenarios

**Unit Tests**:
- useLogin hook: Test mutation success and error
- AuthLoginForm: Test rendering, onChange, onSubmit events
- AuthLoginStatus: Test error display, cooldown timer formatting
- Rate limit logic: Test cooldown start, duration, expiry

**Integration Tests**:
- Successful login flow:
  - Fill form with valid credentials
  - Submit form
  - Verify API called with correct data
  - Verify token stored in authStore
  - Verify navigation to home
- Invalid credentials:
  - Submit with invalid credentials
  - Verify error displayed
  - Verify form not cleared
- Rate limiting:
  - Trigger 5 failed attempts
  - Verify cooldown activated
  - Verify submit disabled
  - Verify cooldown timer displays
- Form validation:
  - Submit empty form
  - Verify validation errors shown
- i18n:
  - Switch to Arabic
  - Verify all text translated
  - Verify RTL layout

#### References
- docs/frontEnd/components/AUTH_LOGIN.md (complete specification)
- docs/frontEnd/FRONTEND-CONTRACT.md (API endpoint details)
- docs/frontEnd/User-Flows.md (login flow)
- docs/frontEnd/components/TECH_STACK_GUIDE.md (React Query mutation patterns)

---

### AUTH-003: Implement Register Page (Multi-Step)
**Assignee**: Dev 2  
**Estimated Time**: 14-16 hours  
**Priority**: Critical  
**Days**: Day 4-5

#### Description
Implement complete registration functionality as a multi-step wizard following the AUTH_REGISTER.md specification. Includes email availability check, username availability check with suggestions, client-side password policy validation, and rate limiting.

#### Component Structure

**Smart Container**: AuthRegisterController (src/pages/auth/AuthRegisterController.jsx)
- Manages multi-step state (currentStep: 1-3)
- Step 1: Email submission and availability check
- Step 2: Username (with availability check + suggestions) and password
- Step 3: Full name
- Uses React Query mutations for API calls
- Uses React Hook Form for each step's form state
- Manages rate limiting with localStorage
- Writes token to Zustand authStore on final success
- Navigates to home feed on success

**Presentational Components**:
- AuthRegisterStepEmail (Step 1 form)
- AuthRegisterStepCredentials (Step 2 form with username suggestions)
- AuthRegisterStepProfile (Step 3 form)
- AuthRegisterStatus (error/success/cooldown display)
- AuthRegisterProgress (step indicator: 1/3, 2/3, 3/3)

#### Implementation Requirements

**1. Create React Query Mutation Hooks**

File: src/hooks/mutations/useRegister.js

- **useCheckEmailAvailability**: POST /auth/check-availability
    - Request body: { field: "email", value: email }
    - Returns: { available: boolean }
- **useCheckUsernameAvailability**: POST /auth/check-availability
    - Request body: { field: "username", value: username }
    - Returns: { available: boolean }
    - Use with debounce (500ms delay)
- **useRegister**: POST /auth/register
    - Request body: { email, password, username, fullName }
    - Handle all error codes including DUPLICATE_ENTRY

**2. Create Username Suggestion Generator**

File: src/utils/generateUsernameSuggestions.js

- Export function: generateUsernameSuggestions(email)
- Extract username from email (before @)
- Generate 3-5 static suggestions:
    - Base username
    - Base username + random 2-digit number
    - Base username + random 3-digit number
    - Base username with underscore + random number
    - Base username + year (e.g., 2025)
- Return array of suggestion strings
- Note: Later will be replaced with server-fetched suggestions

**3. Create Register Controller**

File: src/pages/auth/AuthRegisterController.jsx

**State Management**:
- currentStep: 1 | 2 | 3
- formData: { email, username, password, fullName }
- emailChecked: boolean
- usernameChecked: boolean

**Step 1: Email**:
- Single field: email
- Validation: required, email format
- On submit: call useCheckEmailAvailability
- If available: save email, move to step 2
- If not available: show error, stay on step 1
- Show loading during availability check

**Step 2: Username & Password**:
- Two fields: username, password
- Username validation: required, min 3 chars, alphanumeric + underscore only
- Password validation: required, min 8 chars, custom policy validation
- **Username Availability Check**:
    - Debounced check as user types (500ms delay)
    - Show loading indicator while checking
    - Show availability status (available/taken) with icon
- **Username Suggestions**:
    - Generate suggestions using email from step 1
    - Display 3-5 suggestions as clickable chips/buttons
    - On click: populate username field, trigger availability check
- **Client-Side Password Policy** (per User-Flows.md):
    - Minimum 8 characters
    - Must include at least one special character
    - Must include mix of letters AND numbers
    - Block submit if policy not met
- On submit: verify username available, save data, move to step 3
- "Back" button returns to step 1

**Step 3: Full Name**:
- Single field: fullName
- Validation: required, min 2 chars
- On submit: call useRegister with all collected data
- Implement rate limiting (15 min cooldown)
- On success: store token, navigate to home
- "Back" button returns to step 2

**Rate Limiting**:
- Track failed registration attempts
- Default cooldown: 15 minutes (900000 ms)
- Store in localStorage: 'register-cooldown'
- Disable submit during cooldown

**4. Create Step 1 Component**

File: src/components/auth/AuthRegisterStepEmail.jsx

Props:
- email: string
- onChange: function
- onSubmit: function
- error: string | undefined
- checking: boolean
- submitting: boolean

Behavior:
- Render email Input
- Show "Checking availability..." when checking=true
- Show submit Button "Continue" (disabled during check)
- Use Intlayer for all text

**5. Create Step 2 Component**

File: src/components/auth/AuthRegisterStepCredentials.jsx

Props:
- username: string
- password: string
- onChange: function
- onSubmit: function
- onBack: function
- errors: object
- usernameAvailable: boolean | null
- checkingUsername: boolean
- suggestions: string[]
- onSelectSuggestion: function
- submitting: boolean

Behavior:
- Render username Input with availability indicator
- Show loading spinner when checkingUsername=true
- Show green checkmark when usernameAvailable=true
- Show red X when usernameAvailable=false
- Render username suggestions as clickable chips below input
- Render password Input (with show/hide toggle)
- Show password requirements checklist (live validation):
    - ✓ At least 8 characters
    - ✓ Includes special character
    - ✓ Mix of letters and numbers
- Submit button "Continue" (disabled if policy not met or username not available)
- Back button
- Support i18n and RTL

**6. Create Step 3 Component**

File: src/components/auth/AuthRegisterStepProfile.jsx

Props:
- fullName: string
- onChange: function
- onSubmit: function
- onBack: function
- error: string | undefined
- submitting: boolean

Behavior:
- Render fullName Input
- Submit button "Create Account" (loading state)
- Back button
- Use Intlayer for all text

**7. Create Progress Indicator Component**

File: src/components/auth/AuthRegisterProgress.jsx

Props:
- currentStep: 1 | 2 | 3
- totalSteps: 3

Behavior:
- Visual step indicator (e.g., dots or progress bar)
- Show current step: "Step 1 of 3", "Step 2 of 3", "Step 3 of 3"
- Highlight completed steps
- Support RTL layout

**8. Create Status Component**

File: src/components/auth/AuthRegisterStatus.jsx

Props:
- status: string
- error: object
- cooldownRemainingMs: number
- onRetry: function

Behavior:
- Display error messages using ErrorDisplay component
- Show cooldown timer using dayjs
- Handle duplicate errors (email/username already exists)
- Show retry button if not in cooldown

**9. Create Password Policy Validation Helper**

File: src/utils/passwordPolicy.js

- Export function: validatePasswordPolicy(password)
- Returns object: 
    ```javascript
    { 
        valid: boolean, 
        requirements: { 
            minLength: boolean, 
            hasSpecialChar: boolean, 
            hasMix: boolean 
        } 
    }
    ```
- Use in form validation
- Use in form to show requirement checklist

**10. Create Debounce Hook**

File: src/hooks/useDebounce.js

- Custom hook for debouncing username availability check
- Delay: 500ms
- Returns debounced value

**11. Create i18n Content Files**

File: src/content/auth/register.content.ts

Translations for:
- Step 1: Email input label, placeholder, "Continue" button, "Email already in use" error
- Step 2: Username/password labels, placeholders, availability messages, suggestions header, password requirements, "Continue" button
- Step 3: Full name label, placeholder, "Create Account" button
- Progress indicator: "Step X of 3"
- Back button text
- General errors and success messages
- Cooldown message template
- EN and AR translations

**12. Create Register Page Route**

- Add route: /register → AuthRegisterController

#### Acceptance Criteria
- [ ] useCheckEmailAvailability mutation hook created
- [ ] useCheckUsernameAvailability mutation hook created
- [ ] useRegister mutation hook created
- [ ] generateUsernameSuggestions utility created
- [ ] useDebounce hook created
- [ ] passwordPolicy validator created
- [ ] AuthRegisterController with multi-step logic created
- [ ] AuthRegisterStepEmail component created
- [ ] AuthRegisterStepCredentials component created
- [ ] AuthRegisterStepProfile component created
- [ ] AuthRegisterProgress component created
- [ ] AuthRegisterStatus component created
- [ ] Step 1: Email availability check working
- [ ] Step 2: Username availability check with debounce working
- [ ] Step 2: Username suggestions displayed and clickable
- [ ] Step 2: Password policy validation with live checklist
- [ ] Step 3: Full name submission working
- [ ] Navigation between steps (forward/back) working
- [ ] Form data persists across steps
- [ ] Rate limiting implemented
- [ ] On success: token stored and navigation
- [ ] i18n content file created with EN/AR translations
- [ ] Register route added
- [ ] All components support RTL
- [ ] Unit tests for all components and utilities
- [ ] Integration test for complete registration flow

#### Verification Steps
1. Navigate to /register
2. **Step 1**: 
     - Enter existing email - should show "Email already in use"
     - Enter new email - should pass check and move to step 2
3. **Step 2**:
     - Type username slowly - should trigger debounced availability check
     - See loading indicator during check
     - Try taken username - should show red X
     - Try available username - should show green checkmark
     - Click a username suggestion - should populate field and check availability
     - Enter weak password - requirements checklist should show unmet items, submit disabled
     - Enter strong password - all checks green, submit enabled
     - Click "Back" - should return to step 1 with email preserved
4. **Step 3**:
     - Enter full name
     - Click "Create Account" - should register and navigate to home
     - Check authStore - token should be set
5. **Rate Limiting**:
     - Trigger rate limit (5 failed attempts on final submit)
     - Should show cooldown timer
     - Cooldown should persist across page refresh
6. **Multi-language**:
     - Switch to Arabic during registration
     - All text should be in Arabic
     - Layout should be RTL
     - Complete registration in Arabic

#### Potential Issues
- **Step state management**: Ensure form data doesn't reset when moving between steps
- **Availability check timing**: Debounce must work correctly to avoid excessive API calls
- **Username suggestions**: Static generation for now, plan for server-fetched suggestions in future
- **Back button behavior**: Preserve form data when going back
- **Rate limiting**: Track attempts across all steps, not just final submission
- **Validation consistency**: Username/email validation must match server-side rules

#### Testing Scenarios

**Unit Tests**:
- **generateUsernameSuggestions**:
    - Test with various emails
    - Verify 3-5 unique suggestions generated
    - Verify suggestions follow username rules
- **passwordPolicy validator**:
    - Test weak, medium, strong passwords
    - Verify each requirement checked correctly
- **useDebounce hook**:
    - Test debounce delay
    - Verify only last value emitted after delay
- **Step components**:
    - Test rendering with various props
    - Test onChange/onSubmit callbacks
    - Test disabled states

**Integration Tests**:
- **Happy path**:
    - Complete all 3 steps with valid data
    - Verify API calls made in correct order
    - Verify token stored
    - Verify navigation to home
- **Email availability**:
    - Enter existing email
    - Verify error shown
    - Cannot proceed to step 2
- **Username availability**:
    - Type username
    - Verify debounced check triggered
    - Try taken username - verify error
    - Select suggestion - verify field populated and checked
- **Username suggestions**:
    - Verify suggestions generated from email
    - Click suggestion - verify username set
    - Verify availability check triggered after selection
- **Password policy**:
    - Enter weak password
    - Verify submit disabled
    - Verify checklist shows unmet requirements
    - Enter strong password
    - Verify submit enabled
- **Navigation**:
    - Move from step 1 to step 2
    - Click back
    - Verify step 1 data preserved
    - Move forward again
    - Verify step 2 data preserved
- **Rate limiting**:
    - Trigger rate limit on final submit
    - Verify cooldown activated
    - Verify timer displays
    - Refresh page
    - Verify cooldown persists
- **i18n & RTL**:
    - Switch to Arabic at step 1
    - Complete registration in Arabic
    - Verify all text translated
    - Verify RTL layout correct
    - Verify suggestions displayed correctly in RTL

#### References
- docs/frontEnd/components/AUTH_REGISTER.md (complete specification)
- docs/frontEnd/FRONTEND-CONTRACT.md (API endpoints)
- docs/frontEnd/User-Flows.md (password policy requirements)
- docs/frontEnd/components/TECH_STACK_GUIDE.md (React Query patterns)

---

**6. Create Register Page Route**

- Add route: /register → AuthRegisterController


#### Testing Scenarios

**Unit Tests**:
- passwordPolicy validator:
  - Test various passwords (weak, medium, strong)
  - Verify each requirement checked correctly
- AuthRegisterForm:
  - Test password checklist updates as user types
  - Test submit disabled when policy not met
- useRegister hook: Test mutation success and errors

**Integration Tests**:
- Successful registration:
  - Fill all fields with valid data
  - Verify password policy met
  - Submit form
  - Verify API called
  - Verify token stored
  - Verify navigation
- Password policy enforcement:
  - Enter weak password
  - Verify submit disabled
  - Enter strong password
  - Verify submit enabled
- Duplicate errors:
  - Submit with existing email
  - Verify field error displayed
  - Submit with existing username
  - Verify field error displayed
- Validation errors:
  - Submit empty form
  - Verify all field errors shown
- Rate limiting: Same as login

---

### AUTH-004: Implement Password Reset Flow
**Assignee**: Dev 1  
**Estimated Time**: 6-8 hours  
**Priority**: High  
**Day**: Day 6

#### Description
Implement two-step password reset flow: request reset (email submission) and confirm reset (new password with token from email).

#### Component Structure

**Step 1: Request Reset**
- AuthPasswordResetRequestController
- PasswordResetRequestForm
- PasswordResetRequestStatus

**Step 2: Confirm Reset**
- AuthPasswordResetConfirmController
- PasswordResetConfirmForm
- PasswordResetConfirmStatus

#### Implementation Requirements

**1. Create Mutation Hooks**

File: src/hooks/mutations/usePasswordReset.js

- usePasswordResetRequest: POST /auth/password-reset/request
- usePasswordResetConfirm: POST /auth/password-reset/confirm

**2. Request Reset Page**

File: src/pages/auth/AuthPasswordResetRequestController.jsx

- Single field: email
- Use React Hook Form
- Implement rate limiting (15 min cooldown)
- On success: show generic success message (per contract, don't reveal if email exists)
- Don't navigate, show success on same page

File: src/components/auth/PasswordResetRequestForm.jsx

- Email input
- Submit button
- Link back to login

**3. Confirm Reset Page**

File: src/pages/auth/AuthPasswordResetConfirmController.jsx

- Read token from URL query params (use useSearchParams from react-router)
- Single field: newPassword
- Apply same password policy validation as registration
- On success: navigate to /login
- Handle INVALID_TOKEN and TOKEN_EXPIRED errors

File: src/components/auth/PasswordResetConfirmForm.jsx

- New password input (with show/hide)
- Password requirements checklist (same as register)
- Submit button

**4. Create i18n Content Files**

Files:
- src/content/auth/passwordResetRequest.content.ts
- src/content/auth/passwordResetConfirm.content.ts

**5. Create Routes**

- /password-reset/request → AuthPasswordResetRequestController
- /password-reset/confirm → AuthPasswordResetConfirmController (reads ?token=xxx)

#### Acceptance Criteria
- [ ] Request reset page created
- [ ] Request form with email field
- [ ] Rate limiting on request page
- [ ] Success message shown (generic, doesn't reveal email exists)
- [ ] Confirm reset page created
- [ ] Confirm form with password field and policy validation
- [ ] Token read from URL query params
- [ ] On success: navigate to login
- [ ] INVALID_TOKEN error handled
- [ ] i18n content files created
- [ ] Routes added
- [ ] Unit tests for both pages
- [ ] Integration tests for both flows

#### Verification Steps
1. Navigate to /password-reset/request
2. Submit valid email - should show success message
3. Submit invalid email - should still show success (security)
4. Trigger rate limit - should show cooldown
5. Navigate to /password-reset/confirm?token=abc123
6. Enter weak password - submit should be disabled
7. Enter strong password - should submit and navigate to login
8. Try invalid token - should show error

#### Potential Issues
- **Generic success message**: Don't reveal whether email exists (per contract)
- **Token from URL**: Use useSearchParams, handle missing token gracefully
- **Token expiry**: Show clear message when token expired, tell user to request new reset
- **No navigation on request**: Stay on page, show success message

#### Testing Scenarios

**Request Reset Tests**:
- Submit valid email
- Verify success message shown
- Verify no navigation
- Test rate limiting
- Test validation errors

**Confirm Reset Tests**:
- Submit valid password
- Verify navigation to login
- Test with invalid token
- Test with expired token
- Test password policy validation
- Verify token read from URL

#### References
- docs/frontEnd/components/AUTH_PASSWORD_RESET_REQUEST.md
- docs/frontEnd/components/AUTH_PASSWORD_RESET_CONFIRM.md
- docs/frontEnd/FRONTEND-CONTRACT.md
- docs/frontEnd/User-Flows.md (password reset flow)

---

### AUTH-005: Implement Protected Routes
**Assignee**: Dev 2  
**Estimated Time**: 4-6 hours  
**Priority**: High  
**Day**: Day 6

#### Description
Create route guards that protect authenticated-only pages and redirect unauthenticated users to login. Also create public-only routes (login/register) that redirect authenticated users to home.

#### Implementation Requirements

**1. Create ProtectedRoute Component**

File: src/components/routes/ProtectedRoute.jsx

Requirements:
- Check if user authenticated (read from authStore)
- If authenticated: render children (Outlet from react-router)
- If not authenticated: redirect to /login
- Use Navigate component from react-router-dom
- Add loading state while checking auth

**2. Create PublicRoute Component**

File: src/components/routes/PublicRoute.jsx

Requirements:
- Check if user authenticated
- If authenticated: redirect to / (home)
- If not authenticated: render children (Outlet)
- Prevents authenticated users from accessing login/register

**3. Update Route Configuration**

File: src/routes/index.jsx

- Wrap protected routes with ProtectedRoute
- Wrap public routes (login, register, password reset) with PublicRoute
- Create route structure:
  ```
  - / (home) - protected later, public for now
  - /login - public only
  - /register - public only
  - /password-reset/request - public only
  - /password-reset/confirm - public only
  ```

**4. Create AuthLayout Component** (optional but recommended)

File: src/layouts/AuthLayout.jsx

- Layout for auth pages (login, register, password reset)
- Centered card design
- Logo/branding
- Background styling
- Language switcher in header
- Used by all auth pages

#### Acceptance Criteria
- [ ] ProtectedRoute component created
- [ ] ProtectedRoute redirects to /login when not authenticated
- [ ] PublicRoute component created
- [ ] PublicRoute redirects to / when authenticated
- [ ] Routes configured with guards
- [ ] AuthLayout created (optional)
- [ ] Loading state shown while checking auth
- [ ] No flash of wrong content (FOUC)
- [ ] Unit tests for ProtectedRoute
- [ ] Unit tests for PublicRoute
- [ ] Integration tests for routing behavior

#### Verification Steps
1. Not logged in: Navigate to /login - should render
2. Not logged in: Navigate to / - should allow (or redirect to login if protected)
3. Not logged in: Try to access protected route - should redirect to /login
4. Logged in: Navigate to /login - should redirect to /
5. Logged in: Navigate to / - should render
6. Logged in: Navigate to protected route - should render
7. Logout, refresh page - should stay logged out

#### Potential Issues
- **Auth check timing**: authStore rehydrates from localStorage asynchronously, show loading state
- **Redirect loops**: Ensure ProtectedRoute redirects to /login, PublicRoute redirects to /
- **Initial route preservation**: If user tries to access protected route, redirect to login, after login should go to home (not back to attempted route per User-Flows.md)

#### Testing Scenarios

**ProtectedRoute Tests**:
- Authenticated user: renders children
- Unauthenticated user: redirects to /login
- Loading state: shows loading while checking auth

**PublicRoute Tests**:
- Authenticated user: redirects to /
- Unauthenticated user: renders children

**Integration Tests**:
- Attempt to access protected route without auth
- Verify redirect to login
- Login successfully
- Verify redirect to home
- Navigate to login while authenticated
- Verify redirect to home
- Logout
- Verify can access login again

#### References
- docs/frontEnd/User-Flows.md (navigation and routing guards section)
- React Router Protected Routes: https://reactrouter.com/en/main/start/tutorial#protected-routes

---

### AUTH-006: Integration Testing & Bug Fixes
**Assignee**: All Developers  
**Estimated Time**: Full day (8 hours)  
**Priority**: Critical  
**Day**: Day 7

#### Description
Comprehensive integration testing of all authentication features, bug fixing, code review, and sprint demo preparation.

#### Activities

**1. Integration Testing (Morning)**

Test all authentication flows end-to-end:
- Complete registration flow
- Complete login flow
- Complete password reset flow
- Route protection
- Token persistence across page refreshes
- Logout flow
- Rate limiting across all auth endpoints
- Error handling for all scenarios
- i18n switching during auth flows
- RTL layout for all auth pages

**2. Bug Fixing (Afternoon)**

- Fix any bugs discovered during testing
- Address edge cases
- Improve error messages
- Refine user experience

**3. Code Review**

- Review all auth code
- Ensure adherence to patterns in TECH_STACK_GUIDE.md
- Check for security issues
- Verify no sensitive data logged
- Ensure proper error handling

**4. Test Coverage Analysis**

- Run coverage report
- Ensure >80% coverage for auth features
- Write missing tests
- Focus on critical paths

**5. Documentation**

- Update README if needed
- Document any deviations from plan
- Create known issues list
- Update sprint tracking document

**6. Demo Preparation**

- Prepare demo script
- Test demo flow
- Prepare screenshots/recordings
- Document completed features

#### Acceptance Criteria
- [ ] All auth flows tested end-to-end
- [ ] No critical bugs remaining
- [ ] Test coverage >80% for auth
- [ ] Code reviewed by at least one other developer
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Demo prepared
- [ ] Sprint 1 success criteria all met (from sprint overview)

#### Testing Scenarios (Integration)

**Happy Path**:
1. Register new account
2. Verify token stored
3. Logout
4. Login with same account
5. Verify token updated
6. Refresh page
7. Verify still logged in
8. Navigate to password reset
9. Request reset
10. Confirm reset (with mock token)
11. Login with new password
12. Success

**Error Paths**:
1. Register with duplicate email - verify error
2. Login with wrong password - verify error
3. Trigger rate limit - verify cooldown
4. Try protected route without auth - verify redirect
5. Try login while logged in - verify redirect to home
6. Invalid token on password confirm - verify error
7. Network error - verify error handling

**i18n & RTL**:
1. Complete registration in Arabic
2. Verify all text in Arabic
3. Verify RTL layout correct
4. Switch to English
5. Verify layout flips to LTR
6. Complete login in English
7. Verify persistence across language switches

**Security**:
1. Verify passwords never logged
2. Verify tokens never logged
3. Verify password reset doesn't reveal if email exists
4. Verify rate limiting works
5. Verify expired tokens handled correctly

#### References
- docs/frontEnd/plan/SPRINT_TRACKING.md (Day 7 success criteria)
- All AUTH component specifications
- docs/frontEnd/User-Flows.md (auth flows)

---

## Sprint 1 Completion Checklist

### Setup Complete
- [ ] All dependencies installed
- [ ] Vite configured for testing
- [ ] Tailwind CSS configured with design system
- [ ] Zustand stores created and working
- [ ] React Query configured
- [ ] Axios interceptors configured
- [ ] Intlayer i18n configured
- [ ] Testing infrastructure setup

### Components Complete
- [ ] Button component created and tested
- [ ] Input component created and tested
- [ ] Card component created and tested
- [ ] Loading component created and tested
- [ ] ErrorDisplay component created and tested
- [ ] LanguageSwitcher component created and tested

### Auth Features Complete
- [ ] Login page fully functional
- [ ] Register page fully functional
- [ ] Password reset request page functional
- [ ] Password reset confirm page functional
- [ ] Protected routes working
- [ ] Public routes working
- [ ] Rate limiting working on all auth endpoints

### Quality Assurance
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Test coverage >80%
- [ ] No linting errors
- [ ] Code reviewed
- [ ] RTL support verified
- [ ] i18n working in EN and AR

### Documentation
- [ ] README updated with setup instructions
- [ ] Known issues documented
- [ ] Sprint tracking updated
- [ ] Demo prepared

---

## Known Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Testing library React 19 compatibility | High | Medium | Check compatibility matrix, use beta versions if needed |
| Rate limiting localStorage conflicts | Medium | Low | Use unique keys per endpoint |
| Token expiry handling complexity | Medium | Medium | Thoroughly test with mocked expired tokens |
| RTL layout bugs | Medium | High | Test early and often with dir="rtl" |
| Password policy regex edge cases | Medium | Medium | Write comprehensive tests for policy validation |
| MSW API mocking issues | Low | Low | Use MSW v2 syntax, check documentation |

---

## Sprint Retrospective Questions

To be answered at end of Sprint 1:

1. Did setup tasks take longer than estimated?
2. Were there any blocker issues with dependencies?
3. How well did the component architecture work?
4. Were the specifications detailed enough?
6. How is test coverage quality?
7. Are we on track for Sprint 2?
8. What should we improve for next sprint?
9. Any adjustments needed to the plan?

---

**Document Status**: Ready for Implementation  
**Last Updated**: December 18, 2025  
**Sprint Start Date**: TBD  
**Sprint End Date**: TBD
