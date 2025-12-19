# Frontend Implementation Plan - ITI Hub Social Media Platform

**Project**: ITI Hub Frontend  
**Version**: 1.0.0  
**Date**: December 18, 2025  
**Status**: Planning Phase  
**Timeline**: 4 weeks (Sprint-based)

## Executive Summary

This document outlines the complete implementation plan for the ITI Hub social media platform frontend, covering architecture setup, component development, testing, and deployment across 4 sprints.

### Key Objectives
- ✅ Build scalable React frontend with confirmed tech stack
- ✅ Full i18n support (Arabic/English with RTL)
- ✅ Real-time features (messaging, notifications)
- ✅ Comprehensive testing coverage (>80%)
- ✅ Production-ready deployment

### Success Metrics
- Page load time < 3s
- First contentful paint < 1.5s
- Test coverage > 80%
- Lighthouse score > 90
- Support 1000+ concurrent users

## Tech Stack Confirmed

### Core Technologies
```json
{
  "framework": "React 19.2.0",
  "language": "JavaScript (JSX)",
  "stateManagement": {
    "auth": "Zustand 5.0.9",
    "serverState": "@tanstack/react-query 5.90.12",
    "ui": "Zustand 5.0.9"
  },
  "routing": "react-router-dom 7.9.5",
  "ui": {
    "components": "@headlessui/react 2.2.9",
    "styling": "tailwindcss 4.1.17",
    "vitePlugin": "@tailwindcss/vite 4.1.17"
  },
  "forms": "react-hook-form (to be installed)",
  "i18n": {
    "library": "intlayer 7.0.8",
    "react": "react-intlayer 7.0.8",
    "vite": "vite-intlayer 7.0.8"
  },
  "realtime": "socket.io-client 4.8.1",
  "http": "axios 1.13.2",
  "dateTime": "dayjs 1.11.19",
  "notifications": "react-hot-toast 2.6.0",
  "icons": "react-icons 5.5.0"
}
```

### Development Tools
```json
{
  "buildTool": "vite 7.2.2",
  "compiler": "@vitejs/plugin-react-swc 4.2.1",
  "linting": "eslint 9.39.1",
  "testing": "vitest + @testing-library/react (to be installed)"
}
```

## Project Structure

```
client/
├── public/
│   ├── locales/           # i18n translations
│   └── assets/            # Static assets
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/        # Shared UI components
│   │   ├── auth/          # Auth-related components
│   │   ├── feed/          # Feed components
│   │   ├── post/          # Post components
│   │   ├── user/          # User profile components
│   │   ├── community/     # Community components
│   │   ├── messaging/     # Messaging components
│   │   └── notifications/ # Notification components
│   ├── pages/             # Page components (controllers)
│   │   ├── auth/          # Login, Register, etc.
│   │   ├── feed/          # Home, Following, Trending
│   │   ├── post/          # PostDetail, PostComposer
│   │   ├── user/          # Profile, Followers, Following
│   │   ├── community/     # Directory, Detail, Create, Edit
│   │   ├── messaging/     # MessagesList, ConversationDetail
│   │   ├── notifications/ # NotificationsCenter
│   │   └── search/        # Search page
│   ├── hooks/             # Custom React hooks
│   │   ├── queries/       # React Query hooks
│   │   ├── mutations/     # React Query mutations
│   │   └── socket/        # WebSocket hooks
│   ├── store/             # Zustand stores
│   │   ├── authStore.js
│   │   ├── uiStore.js
│   │   └── socketStore.js
│   ├── lib/               # Utilities & configs
│   │   ├── api.js         # Axios instance
│   │   ├── queryClient.js # React Query config
│   │   ├── socket.js      # Socket.io setup
│   │   └── dayjs.js       # dayjs config
│   ├── styles/            # Global styles
│   │   └── index.css
│   ├── routes/            # Route definitions
│   │   ├── index.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── PublicRoute.jsx
│   ├── content/           # Intlayer i18n content
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── post/
│   │   └── ...
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── setup.js           # Test setup
├── package.json
├── vite.config.js
├── tailwind.config.js
├── intlayer.config.ts
└── README.md
```

## Implementation Phases (4 Sprints)

### Sprint 1: Foundation & Core Auth (Week 1)
**Goal**: Setup project infrastructure and implement authentication

#### Sprint 1 Tasks

**Day 1-2: Project Setup**
- [ ] Install missing dependencies (react-hook-form, vitest, testing-library)
- [ ] Configure Tailwind CSS for RTL support
- [ ] Setup Zustand stores (auth, UI)
- [ ] Configure React Query with default options
- [ ] Setup axios interceptors
- [ ] Configure Intlayer for i18n
- [ ] Setup dayjs with locales
- [ ] Create folder structure
- [ ] Setup testing infrastructure

**Day 3-4: Core Components & Auth Pages**
- [ ] Create reusable UI components (Button, Input, Card, etc.)
- [ ] Implement AUTH_LOGIN page
  - LoginController (React Query mutation)
  - LoginForm (React Hook Form)
  - Rate limit handling
  - i18n translations (EN/AR)
- [ ] Implement AUTH_REGISTER page
  - RegisterController
  - RegisterForm with password policy
  - Field validation
  - i18n translations
- [ ] Implement AUTH_PASSWORD_RESET_REQUEST
- [ ] Implement AUTH_PASSWORD_RESET_CONFIRM

**Day 5: Auth Integration & Testing**
- [ ] Setup protected routes
- [ ] Implement token refresh logic
- [ ] Auth state persistence
- [ ] Write unit tests for auth components
- [ ] Write integration tests for auth flows
- [ ] Test RTL layouts

**Sprint 1 Deliverables**:
- ✅ Working authentication system
- ✅ Protected routing
- ✅ UI component library foundation
- ✅ Test infrastructure
- ✅ i18n working for auth pages

---

### Sprint 2: Feed & Posts (Week 2)
**Goal**: Implement core feed functionality and post creation

#### Sprint 2 Tasks

**Day 1-2: Feed Implementation**
- [ ] Implement FEED_HOME page
  - FeedHomeController (infinite scroll)
  - FeedList component
  - FeedPostItem component
  - Optimistic like/save mutations
  - Repost functionality
- [ ] Implement FEED_FOLLOWING page
- [ ] Implement FEED_TRENDING page
- [ ] Implement SAVED_POSTS page

**Day 3-4: Post Features**
- [ ] Implement POST_COMPOSER page
  - PostComposerController
  - PostComposerForm with file upload
  - Image preview & validation
  - Community selector
  - Tag selector
- [ ] Implement POST_DETAIL page
  - PostDetailController
  - PostContent component
  - Comment system (CRUD)
  - Comment likes
  - Nested replies

**Day 5: Testing & Optimization**
- [ ] Write unit tests for feed components
- [ ] Write integration tests for post flows
- [ ] Optimize image loading
- [ ] Implement intersection observer for infinite scroll
- [ ] Test RTL layouts for feed

**Sprint 2 Deliverables**:
- ✅ Working home feed with infinite scroll
- ✅ Post creation with images
- ✅ Post detail with comments
- ✅ Like/save/repost functionality
- ✅ Optimistic UI updates

---

### Sprint 3: Social Features & Real-time (Week 3)
**Goal**: Implement user profiles, messaging, and notifications

#### Sprint 3 Tasks

**Day 1-2: User Profiles**
- [ ] Implement USER_PROFILE page
  - ProfileController
  - Profile header
  - Posts tab
  - Follow/unfollow functionality
  - Block/unblock functionality
- [ ] Implement USER_FOLLOWERS page
- [ ] Implement USER_FOLLOWING page
- [ ] Implement profile editing

**Day 3-4: Messaging System**
- [ ] Setup WebSocket connection
- [ ] Implement MESSAGES_LIST page
  - ConversationsController
  - ConversationItem component
  - Real-time updates
  - Unread count badges
- [ ] Implement CONVERSATION_DETAIL page
  - ConversationDetailController
  - Message list with cursor pagination
  - Message input with React Hook Form
  - Image upload in messages
  - Typing indicators
  - Mark as seen functionality
  - Group management (add/remove members)

**Day 5: Notifications & Search**
- [ ] Implement NOTIFICATIONS_CENTER
  - NotificationsController
  - Notification items with grouping
  - Real-time WebSocket updates
  - Mark as read functionality
  - Unread count badge
- [ ] Implement SEARCH page
  - SearchController with tabs
  - User search
  - Post search
  - Community search
  - Debounced input

**Sprint 3 Deliverables**:
- ✅ Working user profiles with social actions
- ✅ Real-time messaging system
- ✅ Real-time notifications
- ✅ Search functionality
- ✅ WebSocket integration

---

### Sprint 4: Communities & Polish (Week 4)
**Goal**: Implement communities and finalize application

#### Sprint 4 Tasks

**Day 1-2: Community Features**
- [ ] Implement COMMUNITIES_DIRECTORY page
  - CommunitiesController
  - Search and filter
  - Tag filtering
  - Join/leave functionality
- [ ] Implement COMMUNITY_DETAIL page
  - CommunityDetailController
  - Community feed
  - Member actions
- [ ] Implement COMMUNITY_CREATE page
  - CommunityCreateController
  - Form with image uploads
  - Tag selection
- [ ] Implement COMMUNITY_EDIT page (owner only)
- [ ] Implement COMMUNITY_MODERATION page
  - Add/remove moderators
  - Remove posts
  - Member management

**Day 3: Performance Optimization**
- [ ] Implement code splitting
- [ ] Optimize bundle size
- [ ] Add service worker for caching
- [ ] Optimize images (lazy loading, WebP)
- [ ] Implement error boundaries
- [ ] Add loading skeletons
- [ ] Optimize React Query cache

**Day 4: Testing & Documentation**
- [ ] Complete unit test coverage (>80%)
- [ ] Complete integration test coverage
- [ ] E2E tests for critical flows
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Update README documentation
- [ ] Create deployment guide

**Day 5: Deployment & Final Polish**
- [ ] Setup CI/CD pipeline
- [ ] Configure production build
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Fix bugs
- [ ] Deploy to production
- [ ] Monitor performance

**Sprint 4 Deliverables**:
- ✅ Complete community features
- ✅ Optimized production build
- ✅ Comprehensive test coverage
- ✅ Production deployment
- ✅ Documentation

---

## Detailed Task Breakdown

### Setup Tasks (Pre-Sprint 1)

#### 1. Install Missing Dependencies
```bash
npm install react-hook-form
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @vitest/ui
```

#### 2. Configure Vite for Testing
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { intlayerPlugin } from 'vite-intlayer'

export default defineConfig({
  plugins: [react(), tailwindcss(), intlayerPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
})
```

#### 3. Create Zustand Stores
```javascript
// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

// src/store/uiStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'en',
      dir: 'ltr',
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ 
        locale, 
        dir: locale === 'ar' ? 'rtl' : 'ltr' 
      })
    }),
    {
      name: 'ui-storage'
    }
  )
)
```

#### 4. Configure React Query
```javascript
// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        if (error.response?.data?.error?.code === 'TOKEN_EXPIRED') {
          useAuthStore.getState().logout()
        }
      }
    },
    mutations: {
      onError: (error) => {
        if (error.response?.data?.error?.code === 'TOKEN_EXPIRED') {
          useAuthStore.getState().logout()
        }
      }
    }
  }
})
```

#### 5. Configure Axios
```javascript
// src/lib/api.js
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030'
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.error?.code
    if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

## Component Development Guidelines

### 1. Component Structure
Every feature follows this pattern:
```
PageController (Smart)
├─ Uses React Query hooks
├─ Reads from Zustand stores
├─ Handles business logic
└─ Renders presentational children
    │
    └─ PresentationalComponent (Dumb)
        ├─ Receives props
        ├─ Emits events
        ├─ Styled with Tailwind
        └─ Uses Intlayer for i18n
```

### 2. Naming Conventions
- **Controllers**: `ComponentNameController.jsx`
- **Presentational**: `ComponentName.jsx`
- **Hooks**: `use[Feature][Action].js` (e.g., `useFeedHome.js`)
- **Stores**: `[feature]Store.js`
- **Content**: `[component].content.ts`

### 3. Code Quality Standards
- ESLint: No warnings in production
- Test Coverage: >80% for critical paths
- Bundle Size: Keep under 500KB gzipped
- Lighthouse Score: >90
- Accessibility: WCAG 2.1 Level AA

### 4. Git Workflow
```
main
├─ dev (development branch)
│  ├─ feature/auth-login
│  ├─ feature/feed-home
│  ├─ feature/messaging
│  └─ ...
└─ staging (pre-production)
```

**Branch Naming**:
- Feature: `feature/[feature-name]`
- Bug: `fix/[bug-description]`
- Hotfix: `hotfix/[issue]`

**Commit Convention**:
```
type(scope): description

feat(auth): implement login page
fix(feed): resolve infinite scroll issue
test(post): add unit tests for composer
docs(readme): update setup instructions
```

---

## Testing Strategy

### Unit Tests
**Target**: >80% coverage for utilities and presentational components

```javascript
// Example: Button.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await userEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('disables when loading', () => {
    render(<Button loading>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Integration Tests
**Target**: Cover critical user flows

```javascript
// Example: AuthLogin.integration.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import AuthLoginController from './AuthLoginController'
import { queryClient } from '../lib/queryClient'

const server = setupServer(
  rest.post('/auth/login', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: { token: 'fake-token', user: { id: '1' } }
    }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Login Flow', () => {
  it('logs in successfully', async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthLoginController />
        </QueryClientProvider>
      </BrowserRouter>
    )

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })
  })
})
```

### E2E Tests (Optional, Cypress/Playwright)
**Target**: Critical flows only

- User registration → Login → Create post → Logout
- User login → Browse feed → Like post → Comment
- User login → Send message → Receive reply

---

## Performance Optimization

### Code Splitting
```javascript
// Lazy load routes
const FeedHome = lazy(() => import('./pages/feed/FeedHome'))
const PostDetail = lazy(() => import('./pages/post/PostDetail'))

<Route path="/" element={<Suspense fallback={<Loading />}><FeedHome /></Suspense>} />
```

### Image Optimization
- Use WebP format
- Implement lazy loading
- Add loading skeletons
- Compress images <500KB

### Bundle Optimization
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@headlessui/react'],
        }
      }
    }
  }
})
```

---

## Deployment Strategy

### Environments
1. **Development**: Local (localhost:3000)
2. **Staging**: Pre-production testing
3. **Production**: Live application

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - # Deploy to hosting (Vercel/Netlify/AWS)
```

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3030
VITE_SOCKET_URL=http://localhost:3030
VITE_ENV=development
```

---

## Risk Management

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| WebSocket connection issues | High | Implement fallback polling |
| Large bundle size | Medium | Code splitting, lazy loading |
| Browser compatibility | Medium | Polyfills, testing on multiple browsers |
| i18n performance | Low | Lazy load translations |

### Timeline Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Feature scope creep | High | Strict sprint boundaries |
| Dependency issues | Medium | Lock versions, test thoroughly |
| Team availability | Medium | Cross-training, documentation |

---

## Success Criteria

### Sprint 1 (Auth)
- [ ] User can register and login
- [ ] Token persists across sessions
- [ ] Rate limiting works
- [ ] RTL works for Arabic
- [ ] Tests pass with >80% coverage

### Sprint 2 (Feed & Posts)
- [ ] Feed loads with infinite scroll
- [ ] Posts can be created with images
- [ ] Like/save works optimistically
- [ ] Comments work on posts
- [ ] Performance <3s load time

### Sprint 3 (Social & Real-time)
- [ ] Real-time messaging works
- [ ] Notifications arrive in real-time
- [ ] User profiles are fully functional
- [ ] Search works across all types
- [ ] WebSocket reconnects automatically

### Sprint 4 (Communities & Polish)
- [ ] Communities can be created/edited
- [ ] Moderation features work
- [ ] Lighthouse score >90
- [ ] All tests pass
- [ ] Production deployed successfully

---

## Next Steps

1. **Immediate** (Today):
   - [ ] Review and approve this plan
   - [ ] Setup development environment
   - [ ] Install missing dependencies
   - [ ] Create project structure

2. **Week 1** (Sprint 1):
   - [ ] Start authentication implementation
   - [ ] Daily standup meetings
   - [ ] Track progress in project board

3. **Ongoing**:
   - [ ] Weekly sprint reviews
   - [ ] Continuous integration
   - [ ] Performance monitoring
   - [ ] User feedback collection

---

**Document Version**: 1.0  
**Last Updated**: December 18, 2025  
**Owner**: Frontend Team  
**Stakeholders**: Product, Design, Backend, QA
