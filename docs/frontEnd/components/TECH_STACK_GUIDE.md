# Frontend Tech Stack Implementation Guide

This document provides a comprehensive guide for implementing all frontend components using the confirmed tech stack.

## Tech Stack Overview

### Core Technologies
- **Framework**: React 19 with JSX
- **State Management**: 
  - Zustand (auth, user preferences, UI state)
  - React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM v7
- **UI Framework**: Headless UI (@headlessui/react) + Tailwind CSS v4
- **Forms**: React Hook Form with validation
- **i18n**: Intlayer with full RTL support (AR/EN)
- **Real-time**: Socket.io Client v4
- **Date Formatting**: dayjs with locales
- **HTTP Client**: axios
- **Notifications**: react-hot-toast
- **Icons**: react-icons

### Development Tools
- **Build Tool**: Vite
- **Compiler**: SWC (@vitejs/plugin-react-swc)
- **Linting**: ESLint

## Architecture Patterns

### Component Structure
All components follow this pattern:

```
ComponentController (Smart Container)
├─ PresentationalChild1
├─ PresentationalChild2
└─ PresentationalChild3
```

**Rules:**
1. **Controllers** (smart components):
   - Use React Query hooks for server state
   - Read from Zustand stores (never write in render)
   - Handle all business logic
   - Pass plain data as props to children
   - Never expose Zustand or React Query to children

2. **Presentational Components** (dumb components):
   - Receive all data via props
   - Emit events to parent
   - No fetching, no global state access
   - Pure functions of props
   - Styled with Tailwind
   - Use Intlayer for i18n

### State Management Strategy

**Zustand Stores:**
```javascript
// useAuthStore.js
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setUser: (user) => set({ user }),
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        // Clear React Query cache
        queryClient.clear()
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
)

// useUIStore.js
export const useUIStore = create((set) => ({
  theme: 'light',
  locale: 'en',
  dir: 'ltr',
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ 
    locale, 
    dir: locale === 'ar' ? 'rtl' : 'ltr' 
  })
}))

// useNotificationStore.js (optional, can use React Query)
export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count })
}))
```

**React Query Configuration:**
```javascript
// queryClient.js
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
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

## React Query Patterns

### Query Hooks
```javascript
// Feed queries
export const useFeedHome = () => {
  const { token } = useAuthStore()
  
  return useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: ({ pageParam = 1 }) => 
      axios.get('/feed/home', {
        params: { page: pageParam, limit: 20 },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).then(res => res.data.data),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNextPage 
        ? lastPage.pagination.page + 1 
        : undefined
  })
}

// Post detail query
export const usePost = (postId) => {
  const { token } = useAuthStore()
  
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () =>
      axios.get(`/posts/${postId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).then(res => res.data.data),
    enabled: !!postId
  })
}
```

### Mutation Hooks with Optimistic Updates
```javascript
// Like post mutation
export const useLikePost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, isLiked }) => 
      isLiked
        ? axios.post(`/posts/${postId}/like`)
        : axios.delete(`/posts/${postId}/like`),
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['feed'])
      await queryClient.cancelQueries(['post', postId])
      
      // Snapshot previous value
      const previousFeed = queryClient.getQueryData(['feed', 'home'])
      const previousPost = queryClient.getQueryData(['post', postId])
      
      // Optimistically update
      queryClient.setQueryData(['feed', 'home'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            posts: page.posts.map(post =>
              post._id === postId
                ? {
                    ...post,
                    isLiked: isLiked,
                    likesCount: post.likesCount + (isLiked ? 1 : -1)
                  }
                : post
            )
          }))
        }
      })
      
      queryClient.setQueryData(['post', postId], (old) => {
        if (!old) return old
        return {
          ...old,
          isLiked: isLiked,
          likesCount: old.likesCount + (isLiked ? 1 : -1)
        }
      })
      
      return { previousFeed, previousPost }
    },
    onError: (err, variables, context) => {
      // Rollback
      queryClient.setQueryData(['feed', 'home'], context.previousFeed)
      queryClient.setQueryData(['post', variables.postId], context.previousPost)
      toast.error('Failed to like post')
    },
    onSettled: () => {
      queryClient.invalidateQueries(['feed'])
    }
  })
}
```

## Form Handling with React Hook Form

### Basic Form Pattern
```javascript
import { useForm } from 'react-hook-form'

const MyFormController = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })
  
  const onSubmit = async (data) => {
    try {
      await mutation.mutateAsync(data)
      reset()
    } catch (error) {
      // Map server errors to form fields
      if (error.response?.data?.error?.fields) {
        Object.entries(error.response.data.error.fields).forEach(
          ([field, message]) => {
            setError(field, { type: 'server', message })
          }
        )
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email'
          }
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  )
}
```

### File Upload Pattern
```javascript
const {
  register,
  handleSubmit,
  watch,
  setValue
} = useForm()

const images = watch('images')

return (
  <div>
    <input
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      onChange={(e) => {
        const files = Array.from(e.target.files)
        // Validate size/type client-side
        const valid = files.every(
          f => f.size <= 5 * 1024 * 1024 && // 5MB
               ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
        )
        if (valid) {
          setValue('images', files)
        } else {
          toast.error('Invalid image file')
        }
      }}
    />
  </div>
)
```

## i18n with Intlayer

### Content Files Structure
```
src/
  components/
    Feed/
      FeedHome.jsx
      feedHome.content.ts  // <-- Intlayer content
```

### Content File Example
```typescript
// feedHome.content.ts
import { t, type DeclarationContent } from 'intlayer'

const feedHomeContent = {
  key: 'feed-home',
  content: {
    title: t({
      en: 'Home Feed',
      ar: 'الصفحة الرئيسية'
    }),
    loadMore: t({
      en: 'Load More',
      ar: 'تحميل المزيد'
    }),
    noPostsYet: t({
      en: 'No posts yet. Follow some users or join communities!',
      ar: 'لا توجد منشورات بعد. تابع بعض المستخدمين أو انضم إلى المجتمعات!'
    }),
    likeError: t({
      en: 'Failed to like post',
      ar: 'فشل الإعجاب بالمنشور'
    }),
    repostSuccess: t({
      en: 'Post reposted successfully',
      ar: 'تمت مشاركة المنشور بنجاح'
    })
  }
} satisfies DeclarationContent

export default feedHomeContent
```

### Using i18n in Components
```javascript
import { useIntlayer } from 'react-intlayer'

const FeedHome = () => {
  const { title, loadMore, noPostsYet } = useIntlayer('feed-home')
  
  return (
    <div>
      <h1>{title}</h1>
      {posts.length === 0 && <p>{noPostsYet}</p>}
      <button>{loadMore}</button>
    </div>
  )
}
```

### Language Switching
```javascript
import { setLocale } from 'intlayer'

const LanguageSwitcher = () => {
  const { locale, setLocale: setUILocale } = useUIStore()
  
  const handleChange = (newLocale) => {
    setLocale(newLocale) // Intlayer
    setUILocale(newLocale) // Zustand
    dayjs.locale(newLocale) // dayjs
  }
  
  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  )
}
```

## RTL Support with Tailwind

### App-Level RTL Setup
```javascript
// App.jsx
import { useUIStore } from './store/useUIStore'

const App = () => {
  const { dir, locale } = useUIStore()
  
  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = locale
  }, [dir, locale])
  
  return (
    <div dir={dir}>
      {/* App content */}
    </div>
  )
}
```

### Tailwind RTL Utilities
```jsx
// Margins
<div className="ltr:ml-4 rtl:mr-4">Content</div>

// Padding
<div className="ltr:pl-4 rtl:pr-4">Content</div>

// Text Alignment
<p className="ltr:text-left rtl:text-right">Text</p>

// Borders
<div className="ltr:border-l rtl:border-r">Content</div>

// Flex Direction
<div className="flex ltr:flex-row rtl:flex-row-reverse">
  <div>First</div>
  <div>Second</div>
</div>
```

### Icon Flipping for RTL
```javascript
const ChevronIcon = ({ dir }) => {
  return dir === 'rtl' ? <FiChevronLeft /> : <FiChevronRight />
}

// Usage
const { dir } = useUIStore()
<ChevronIcon dir={dir} />
```

## Styling Patterns with Tailwind & Headless UI

### Card Component Pattern
```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                transition-shadow duration-200 p-4">
  {/* Card content */}
</div>
```

### Button Variants
```jsx
// Primary button
<button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 
                   text-white font-medium rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 
                   focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-200">
  {label}
</button>

// Secondary button
<button className="px-4 py-2 bg-white dark:bg-gray-700 
                   border border-gray-300 dark:border-gray-600
                   hover:bg-gray-50 dark:hover:bg-gray-600
                   text-gray-700 dark:text-gray-200 font-medium rounded-md">
  {label}
</button>

// Icon button
<button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                   transition-colors duration-200">
  <FiHeart className="w-5 h-5" />
</button>
```

### Form Input Pattern
```jsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    {label}
  </label>
  <input
    type="text"
    className="block w-full rounded-md border-gray-300 dark:border-gray-600
               bg-white dark:bg-gray-700
               text-gray-900 dark:text-gray-100
               shadow-sm focus:border-primary-500 focus:ring-primary-500
               rtl:text-right"
  />
  {error && (
    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
  )}
</div>
```

### Loading Skeleton Pattern
```jsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
</div>
```

### Headless UI Dialog Pattern
```jsx
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

<Transition appear show={isOpen} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={onClose}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-black bg-opacity-25" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden 
                                   rounded-2xl bg-white dark:bg-gray-800 p-6 
                                   text-left align-middle shadow-xl transition-all">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <div className="mt-2">
              {children}
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </div>
  </Dialog>
</Transition>
```

### Headless UI Menu (Dropdown) Pattern
```jsx
import { Menu, Transition } from '@headlessui/react'

<Menu as="div" className="relative inline-block text-left">
  <Menu.Button className="inline-flex justify-center items-center">
    <FiMoreVertical />
  </Menu.Button>
  <Transition
    as={Fragment}
    enter="transition ease-out duration-100"
    enterFrom="transform opacity-0 scale-95"
    enterTo="transform opacity-100 scale-100"
    leave="transition ease-in duration-75"
    leaveFrom="transform opacity-100 scale-100"
    leaveTo="transform opacity-0 scale-95"
  >
    <Menu.Items className="absolute ltr:right-0 rtl:left-0 mt-2 w-56 
                          origin-top-right rounded-md bg-white dark:bg-gray-800 
                          shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="px-1 py-1">
        <Menu.Item>
          {({ active }) => (
            <button
              className={`${
                active ? 'bg-primary-500 text-white' : 'text-gray-900 dark:text-gray-100'
              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
            >
              <FiEdit className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
              Edit
            </button>
          )}
        </Menu.Item>
      </div>
    </Menu.Items>
  </Transition>
</Menu>
```

## WebSocket Integration

### Socket Setup
```javascript
// socket.js
import { io } from 'socket.io-client'
import { useAuthStore } from './store/useAuthStore'

export const createSocket = () => {
  const token = useAuthStore.getState().token
  
  const socket = io('http://localhost:3030', {
    auth: { token },
    autoConnect: false
  })
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket')
  })
  
  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket')
  })
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error)
  })
  
  return socket
}
```

### Socket Hook Pattern
```javascript
// useSocket.js
import { useEffect, useRef } from 'react'
import { createSocket } from './socket'

export const useSocket = () => {
  const socketRef = useRef(null)
  const { isAuthenticated } = useAuthStore()
  
  useEffect(() => {
    if (isAuthenticated) {
      socketRef.current = createSocket()
      socketRef.current.connect()
      
      return () => {
        socketRef.current?.disconnect()
      }
    }
  }, [isAuthenticated])
  
  return socketRef.current
}
```

### Real-time Notifications Example
```javascript
const NotificationsCenter = () => {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const { unreadCount, setUnreadCount } = useNotificationStore()
  
  useEffect(() => {
    if (!socket) return
    
    socket.on('notification:new', (notification) => {
      // Update React Query cache
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? { ...page, notifications: [notification, ...page.notifications] }
              : page
          )
        }
      })
      
      // Update unread count
      setUnreadCount(unreadCount + 1)
      
      // Show toast
      toast.success('New notification')
    })
    
    socket.on('notification:count', ({ unreadCount }) => {
      setUnreadCount(unreadCount)
    })
    
    return () => {
      socket.off('notification:new')
      socket.off('notification:count')
    }
  }, [socket, queryClient])
  
  // Component render...
}
```

## Date Formatting with dayjs

### Setup
```javascript
// dayjs.js
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/ar'
import 'dayjs/locale/en'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(duration)

export default dayjs
```

### Usage Patterns
```javascript
import dayjs from './lib/dayjs'
import { useUIStore } from './store/useUIStore'

const PostTimestamp = ({ createdAt }) => {
  const { locale } = useUIStore()
  
  // Relative time (e.g., "2 hours ago")
  const relative = dayjs(createdAt).locale(locale).fromNow()
  
  // Full format
  const full = dayjs(createdAt).locale(locale).format('LLL')
  
  return (
    <time dateTime={createdAt} title={full}>
      {relative}
    </time>
  )
}
```

## Error Handling Patterns

### Axios Error Handler
```javascript
// api.js
import axios from 'axios'
import { useAuthStore } from './store/useAuthStore'
import toast from 'react-hot-toast'

export const api = axios.create({
  baseURL: 'http://localhost:3030'
})

// Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.error?.code
    
    if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    if (errorCode === 'INTERNAL_ERROR') {
      toast.error('Something went wrong. Please try again.')
    }
    
    return Promise.reject(error)
  }
)
```

### Error Boundary Component
```javascript
import { Component } from 'react'
import toast from 'react-hot-toast'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    toast.error('Something went wrong')
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## Testing Patterns

### Unit Test Example (React Testing Library)
```javascript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  it('validates email format', async () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    await userEvent.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    await userEvent.click(submitButton)
    
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
```

### Integration Test Example
```javascript
import { render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClientProvider } from '@tanstack/react-query'
import AuthLoginController from './AuthLoginController'

const server = setupServer(
  rest.post('/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          token: 'fake-token',
          user: { id: '1', email: 'test@example.com' }
        }
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AuthLoginController', () => {
  it('logs in successfully', async () => {
    const { queryClient } = setupQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <AuthLoginController />
      </QueryClientProvider>
    )
    
    // Fill form and submit...
    // Assertions...
  })
})
```

## Summary

This guide provides the foundation for implementing all frontend components with:
- Consistent architecture (smart/dumb components)
- Proper state management (Zustand + React Query)
- Form handling (React Hook Form)
- Full i18n support (Intlayer)
- RTL support (Tailwind utilities)
- Real-time updates (Socket.io)
- Comprehensive styling (Tailwind + Headless UI)
- Error handling
- Testing patterns

Apply these patterns to each component spec for consistent, maintainable code.
