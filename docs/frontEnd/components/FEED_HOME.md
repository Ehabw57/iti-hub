# FEED_HOME — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Tech Stack Integration

- **Framework**: React 19 with JSX
- **State Management**: Zustand for auth state, React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM v7
- **UI**: Headless UI + Tailwind CSS v4
- **Forms**: React Hook Form (if needed for inline filters)
- **i18n**: Intlayer with full RTL support for AR/EN
- **Real-time**: Socket.io client (not used in this component)
- **Date Formatting**: dayjs
- **Notifications**: react-hot-toast

## Testing Requirements

- **Unit Tests**: Test pure child components (FeedList, FeedPostItem, FeedStatus) with various prop combinations
- **Integration Tests**: Test FeedHomeController with mocked React Query and API responses
- **Test Scenarios**:
  - Initial load with/without auth
  - Infinite scroll pagination
  - Optimistic like/save with rollback
  - Repost action
  - Error handling and retry
  - Auth requirement triggers

## Component Tree

```
FeedHomeController (page/container)
├─ FeedList (presentational)
│  └─ FeedPostItem (presentational, repeated per post)
└─ FeedStatus (presentational)
```

- **FeedHomeController** (parent): Smart container using React Query (`useInfiniteQuery`) for `GET /feed/home` with pagination. Manages optimistic mutations for like/save/repost. Reads auth token from Zustand store. Never passes Zustand or React Query directly to children.
- **FeedList** (child): Pure presentational component; receives items array and pagination via props; emits abstract list-level events (load more, per-item action) only. Styled with Tailwind, supports RTL.
- **FeedPostItem** (child): Pure presentational component; receives single post and relationship flags via props; emits abstract post actions (like/save/repost). Styled with Tailwind, supports RTL, uses dayjs for date formatting.
- **FeedStatus** (child): Pure presentational component; displays loading/error/success states; uses Headless UI for error dialogs; supports i18n messages.

## Responsibilities

| Component            | Responsibilities                                                                                                                                                                                                                           | Fetching | Local State | Side-Effects | Tech Stack Usage |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|------------------|
| FeedHomeController   | - Use React Query `useInfiniteQuery` for `GET /feed/home?page&limit`.
- Read auth token from Zustand `useAuthStore`.
- Use React Query mutations for like/save/repost with optimistic updates.
- Maintain pagination and append pages; do not reorder on interactions.
- Handle errors using unified envelopes; optional auth behavior.
- Pass plain data props to children; never expose Zustand or React Query hooks to children. | Yes (React Query) | Minimal (UI state only) | Yes (React Query) | React Query, Zustand (read-only), React Router (navigation) |
| FeedList             | - Receive items and pagination; render list with Tailwind styles supporting RTL.
- Use Intersection Observer or scroll listener to detect near-end.
- Emit `onLoadMore()`; forward per-item actions to parent.
- Use Intlayer for any list-level messages (e.g., "No posts yet"). | No | No | No (except scroll detection) | Tailwind CSS, Intlayer (i18n) |
| FeedPostItem         | - Receive a single post and relationship flags; render with Tailwind supporting RTL.
- Use dayjs for date formatting (e.g., "2 hours ago").
- Use react-icons for action buttons.
- Emit `onLikeToggle`, `onSaveToggle`, `onRepost` with payloads.
- Remain controlled by parent; disable actions during `inFlight`. | No | No | No | Tailwind CSS, dayjs, react-icons, Intlayer (i18n) |
| FeedStatus           | - Display loading spinner, error message with Headless UI Dialog, or success state.
- Emit `onRetry()` to reload.
- Use Intlayer for error messages supporting AR/EN. | No | No | No | Headless UI (Dialog), Tailwind CSS, Intlayer (i18n) |

## Props and Emitted Events

### FeedHomeController (Parent)

Inputs/Props:
- No props required (reads from Zustand and URL params if needed)

Zustand Store Access (read-only):
- `useAuthStore`: reads `token`, `isAuthenticated`

React Query Hooks:
- `useInfiniteQuery`: for `GET /feed/home` with pagination
  - queryKey: `['feed', 'home']`
  - Passes `Authorization: Bearer ${token}` if authenticated
- `useMutation`: for like/unlike actions with optimistic updates
- `useMutation`: for save/unsave actions with optimistic updates
- `useMutation`: for repost action

React Router Integration:
- Uses `useNavigate` to navigate on `onRequireAuth` (redirect to `/login`)
- May navigate to post detail on click

Toast Notifications:
- Uses `react-hot-toast` for success/error messages (e.g., "Post reposted successfully")

Emitted Upstream Events:
- None (controller is top-level for this feature)

### Child: FeedList

Props:
- items: `Array<PostListItem>` where each item minimally includes: `_id, author, likesCount, commentsCount, repostsCount, savesCount, createdAt, updatedAt`; optional: `content, images[], tags[], community, editedAt`; conditional flags when auth: `isLiked?, isSaved?`.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }` — from server when present.
- loading: `boolean` — list-level loading indicator.
- disabled: `boolean` — prevent duplicate `onLoadMore` during fetch.

Events:
- onLoadMore: `void` — emitted when list reaches near end.
- onItemLikeToggle: `{ postId: string, next: boolean }`.
- onItemSaveToggle: `{ postId: string, next: boolean }`.
- onItemRepost: `{ postId: string, comment?: string }`.

### Child: FeedPostItem

Props:
- post: `PostListItem` (same guarantees as above).
- inFlight?: `{ like?: boolean, save?: boolean, repost?: boolean }` — to disable repeated actions on the same item.

Events:
- onLikeToggle: `{ postId: string, next: boolean }`.
- onSaveToggle: `{ postId: string, next: boolean }`.
- onRepost: `{ postId: string, comment?: string }`.

### Child: FeedStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.
- cached?: `boolean` — mirrors server field; informational only.

Events:
- onRetry: `void` — parent refetches first page.

## Data Flow

Endpoint: `GET /feed/home` with `page, limit`. Optional auth.

1) **Init**
- Controller uses `useInfiniteQuery` with queryKey `['feed', 'home']`
- Initial fetch: `GET /feed/home?page=1&limit=20`
- If `token` exists in Zustand store, include `Authorization` header
- React Query manages loading/error/success states automatically

2) **Load Page (React Query)**
- `getNextPageParam` extracts next page from `pagination.hasNextPage`
- On success: React Query appends new posts to existing pages
- Posts remain in stable order; do not reorder on interactions
- `cached` flag from server is stored but not displayed to user

3) **Infinite Scroll**
- FeedList uses Intersection Observer to detect scroll near end
- When triggered and `hasNextPage === true`, calls `fetchNextPage()` from React Query
- React Query automatically guards against concurrent fetches

4) **Interactions (auth required)**

**Like/Unlike:**
- Check `isAuthenticated` from Zustand; if false, call `navigate('/login')` and abort
- Use React Query mutation with optimistic update:
  ```javascript
  onMutate: async ({ postId, next }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['feed', 'home'])
    // Snapshot previous value
    const previous = queryClient.getQueryData(['feed', 'home'])
    // Optimistically update
    queryClient.setQueryData(['feed', 'home'], (old) => {
      // Update isLiked and likesCount for postId
    })
    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback to previous state
    queryClient.setQueryData(['feed', 'home'], context.previous)
    toast.error(t('feed.likeError'))
  },
  onSuccess: (data) => {
    // Reconcile with server response if needed
    queryClient.invalidateQueries(['feed', 'home'])
  }
  ```
- Call `POST /posts/:id/like` or `DELETE /posts/:id/like`

**Save/Unsave:**
- Same pattern as like/unlike with `/posts/:id/save` endpoint

**Repost:**
- Check auth; if missing, navigate to login
- Call mutation for `POST /posts/:id/repost` with optional `{ comment }`
- On success: show toast `toast.success(t('feed.repostSuccess'))`
- Do NOT insert/reorder current feed
- Invalidate queries if needed

5) **Errors**
- React Query error state captured and passed to FeedStatus
- For `INVALID_TOKEN`/`TOKEN_EXPIRED`: clear Zustand token, show toast, treat as unauthenticated
- For network errors: show retry button via FeedStatus

6) **i18n Integration**
- Use Intlayer `useIntlayer` hook for all text content
- Support AR/EN with RTL via Tailwind `dir` attribute
- Date formatting with dayjs locale switching

## State Machine (React Query)

```
idle/loading -> success -> refetching (background)
            └-> error --retry--> loading
```

React Query provides: `isLoading`, `isError`, `isSuccess`, `isFetching`, `isFetchingNextPage`

## Defaults & Configuration
- pageSize default: 20; initialPage default: 1 (per contract defaults)
- React Query staleTime: 5 minutes (configurable)
- React Query cacheTime: 10 minutes (configurable)
- Intersection Observer threshold: 0.8 (trigger at 80% scroll)

## Styling & RTL Support

**Tailwind Configuration:**
- Use `dir="rtl"` on root element for Arabic
- Tailwind utilities: `ltr:` and `rtl:` prefixes for directional styles
- Example: `ltr:ml-4 rtl:mr-4` for margin

**Component-Specific Styles:**
- FeedList: vertical stack with gap, responsive grid for images
- FeedPostItem: card layout with hover effects, flex layout for actions
- Loading states: skeleton screens with Tailwind animation
- Error states: centered error message with Headless UI Dialog

**Icons:**
- Use react-icons: `FiHeart`, `FiBookmark`, `FiRepeat`, `FiMessageCircle`
- Flip icons for RTL where needed

## i18n Translation Keys

```javascript
// feed.content.ts (Intlayer)
export default {
  key: 'feed',
  content: {
    title: {
      en: 'Home Feed',
      ar: 'الصفحة الرئيسية'
    },
    loadMore: {
      en: 'Load More',
      ar: 'تحميل المزيد'
    },
    likeError: {
      en: 'Failed to like post',
      ar: 'فشل الإعجاب بالمنشور'
    },
    repostSuccess: {
      en: 'Post reposted successfully',
      ar: 'تمت مشاركة المنشور بنجاح'
    },
    noPostsYet: {
      en: 'No posts yet. Follow some users or join communities!',
      ar: 'لا توجد منشورات بعد. تابع بعض المستخدمين أو انضم إلى المجتمعات!'
    },
    retryLoad: {
      en: 'Retry',
      ar: 'إعادة المحاولة'
    }
  }
}
```

## Contracts & References
- Endpoints: `GET /feed/home`; interactions: `POST|DELETE /posts/:id/like`, `POST|DELETE /posts/:id/save`, `POST /posts/:id/repost`
- Envelope and pagination per contract
- Flows: infinite scroll; do not reorder on interactions
- Tech: React Query for server state, Zustand for auth, Tailwind + Headless UI for presentation

## Notes
- Children are pure presentational components; they never fetch or access global state
- For caching, React Query keys by `['feed', 'home']`; `cached` server flag is informational
- All text must be translatable via Intlayer
- All components must support RTL layout for Arabic
- Use react-hot-toast for user feedback on actions
- Date formatting with dayjs: use relative time (e.g., "2 hours ago") with locale support
