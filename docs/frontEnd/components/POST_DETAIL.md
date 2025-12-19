# POST_DETAIL — Logic-First React Component Spec

Source of truth: `docs/FRONTEND-CONTRACT.md`, `docs/User-Flows.md`, `docs/Screen-Map.md`. No APIs, fields, or routes are invented.

## Tech Stack Integration

- **Framework**: React 19 with JSX
- **State Management**: Zustand for auth state, React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM v7 (extract postId from params)
- **UI**: Headless UI + Tailwind CSS v4
- **Forms**: React Hook Form for comment composer
- **i18n**: Intlayer with full RTL support for AR/EN
- **Real-time**: Socket.io client (not used in this component)
- **Date Formatting**: dayjs
- **Notifications**: react-hot-toast

## Testing Requirements

- **Unit Tests**: Test pure child components with various prop combinations
- **Integration Tests**: Test PostDetailController with mocked React Query and API responses
- **Test Scenarios**:
  - Load post with/without auth
  - Load comments with pagination
  - Load nested replies
  - Optimistic like/save with rollback
  - Comment CRUD operations
  - Error handling and blocked content
  - Auth requirement triggers

## Component Tree

```
PostDetailController
├─ PostContent
├─ PostActions
├─ NavigationRelay
├─ CommentComposer
├─ CommentList
│  └─ CommentItem (repeated; supports replies via parentCommentId)
└─ PostDetailStatus
```

- PostDetailController (parent): Orchestrates fetching `GET /posts/:id`, comments list, and post/comment interactions per contracts; respects optional auth and blocked content rules.
- PostContent (child): Receives post object; pure render logic via props; emits abstract navigation intents; no fetching/global state.
- PostActions (child): Receives flags and counts; emits abstract post actions; no fetching/global state.
- NavigationRelay (child): Pure relay for navigation events emitted by children; maps to controller upstream emissions; no fetching/global state.
- CommentComposer (child): Controlled compose logic; emits abstract submit; no fetching/global state.
- CommentList (child): Receives comments page(s) and emits pagination/reply load events; no fetching/global state.
- CommentItem (child): Receives one comment; emits like/update/delete and reply compose events; no fetching/global state.
- PostDetailStatus (child): Pure status relay (idle/loading/error/success); no fetching/global state.

## Responsibilities

| Component             | Responsibilities                                                                                                                                                                                                 | Fetching | Local State | Side-Effects |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-------------|--------------|
| PostDetailController  | - Manage `GET /posts/:id` (optional auth → includes `isLiked`, `isSaved`).
- Manage comments: `GET /posts/:postId/comments?page&limit&parentCommentId?`.
- Implement post interactions: like/save/repost (optimistic for like/save with rollback; repost without feed reorder).
- Implement comment interactions: create, update, delete, like/unlike.
- Respect blocked content: if server indicates blocked, hide content and prevent interactions.
- Handle unified envelopes; children never fetch or access global state. | Yes (GET, POST/PUT/DELETE) | Yes (post, comments pages, inFlight flags) | Yes (network calls only) |
| PostContent           | - Receive `post` with guaranteed fields; display logic only via props. | No | No | No |
| PostActions           | - Receive flags/counts; emit `onLikeToggle`, `onSaveToggle`, `onRepost`. | No | No | No |
| NavigationRelay       | - Receive navigation intents from children and emit upstream via controller. | No | No | No |
| CommentComposer       | - Controlled input; emit `onSubmit({ content, parentCommentId? })`. | No | No | No |
| CommentList           | - Receive comments page and pagination; emit `onLoadMore(pageContext)` and `onLoadReplies({ parentCommentId })`. | No | No | No |
| CommentItem           | - Emit `onLikeToggle({ commentId, next })`, `onUpdate({ commentId, content })`, `onDelete({ commentId })`, `onReplySubmit({ parentCommentId, content })`. | No | No | No |
| PostDetailStatus      | - Relay abstract status and errors; emit `onRetry()` to reload post and first comments page. | No | No | No |

## Props and Emitted Events

### PostDetailController (Parent)

Inputs/Props:
- postId: `string` — required.
- authToken?: `string` — optional; include `Authorization` to get flags in post and for interactions.
- commentsPageSize?: `number` — default 20.
- onRequireAuth?: `() => void` — emitted when an auth-only action is attempted without token.

Upstream Navigation Emissions:
- onNavigateToProfile(payload): `{ userId?: string, username?: string }` — emitted when child requests author profile navigation.
- onNavigateToCommunity(payload): `{ communityId: string }` — emitted when child requests community navigation.

Emitted Upstream Events:
- onError(payload): `{ code: string, message: string }` — envelope error summary.
- onOptimisticRollback(payload): `{ entity: 'post'|'comment', id: string, action: string, reason: string }` — fired when an interaction fails and state is rolled back.
- onActionSuccess?(payload): `{ entity: 'post'|'comment', id: string, action: string }` — optional; for app-level toasts.

### Child: PostContent

Props:
- post: `Post` — guaranteed fields per feeds + optional `content, images[], tags[], community, editedAt`.
- relationship flags (when auth): `isLiked?, isSaved?`.

Events:
- onAuthorNavigate: `{ userId?: string, username?: string }` — controller will emit `onNavigateToProfile` upstream.
- onCommunityNavigate: `{ communityId: string }` — controller will emit `onNavigateToCommunity` upstream.

### Child: PostActions

Props:
- counts: `{ likesCount, commentsCount, repostsCount, savesCount }`.
- flags: `{ isLiked?: boolean, isSaved?: boolean }`.
- inFlight?: `{ like?: boolean, save?: boolean, repost?: boolean }`.

Events:
- onLikeToggle: `{ postId: string, next: boolean }`.
- onSaveToggle: `{ postId: string, next: boolean }`.
- onRepost: `{ postId: string, comment?: string }`.

### Child: CommentComposer

Props:
- values: `{ content: string, parentCommentId?: string }`.
- fieldErrors?: `Record<string, string>`.
- submitting: `boolean`.
- disabled: `boolean` — parent-controlled (e.g., missing auth).

Events:
- onSubmit: `{ content: string, parentCommentId?: string }`.

### Child: CommentList

Props:
- items: `Array<CommentItem>` with guaranteed fields: `_id, author, post, content, likesCount, repliesCount, createdAt, updatedAt`; optional: `parentComment, editedAt`.
- pagination?: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`.
- loading: `boolean`.
- disabled: `boolean`.

Events:
- onLoadMore: `{ pageContext: 'root' | { parentCommentId: string } }` — indicates which list to paginate.
- onLoadReplies: `{ parentCommentId: string }` — loads first page of replies.

### Child: CommentItem

Props:
- comment: `CommentItem` with guarantees above.
- inFlight?: `{ like?: boolean, update?: boolean, delete?: boolean, reply?: boolean }`.

Events:
- onLikeToggle: `{ commentId: string, next: boolean }`.
- onUpdate: `{ commentId: string, content: string }`.
- onDelete: `{ commentId: string }`.
- onReplySubmit: `{ parentCommentId: string, content: string }`.

### Child: PostDetailStatus

Props:
- status: `'idle' | 'loading' | 'success' | 'error'`.
- error?: `{ code: string, message: string } | null`.

Events:
- onRetry: `void` — parent refetches post and first comments page.

## Data Flow

Endpoints:
- Post: `GET /posts/:id` (optional auth; includes `isLiked`, `isSaved` when authenticated).
- Comments: `GET /posts/:postId/comments` with `page, limit, parentCommentId?`.
- Post actions: `POST|DELETE /posts/:id/like`, `POST|DELETE /posts/:id/save`, `POST /posts/:id/repost`.
- Comment actions: `POST /posts/:postId/comments`, `PUT /comments/:id`, `DELETE /comments/:id`, `POST|DELETE /comments/:id/like`.

1) Init
- Controller: `status='idle'`, load post and first comments page concurrently.

2) Load Post
- GET `/posts/:id` (attach `Authorization` if `authToken`).
- On success: set `post` and flags; `status='success'` if comments also loaded; otherwise remain loading until both complete.
- On error: `status='error'`; emit `onError`. If blocked/not allowed, see Blocked Content.

3) Load Comments
- GET `/posts/:postId/comments?page=1&limit={commentsPageSize}` for root-level comments.
- Replies are loaded lazily via `onLoadReplies({ parentCommentId })` and additional pages via `onLoadMore` indicating context.

4) Post Interactions (auth required)
- Like/Unlike: gate on `authToken`. Optimistically toggle `isLiked` and adjust `likesCount`; call endpoint; reconcile or rollback.
- Save/Unsave: same pattern with `isSaved`.
- Repost: gate on `authToken`. Call endpoint; emit `onActionSuccess` on success; no reorder.

5) Comment Interactions (auth required)
- Create: gate on `authToken`. POST `{ content, parentCommentId? }`; wait for server response; on success, insert into the correct list (root or replies). No optimistic create.
- Update: gate on `authToken`. PUT `{ content }`; wait for server response; on success, update entry. No optimistic update.
- Delete: gate on `authToken`. DELETE; wait for server response; on success, remove entry. No optimistic delete.
- Like/Unlike: gate on `authToken`. Optimistically toggle comment like state and `likesCount` with rollback on error.

6) Blocked Content
- If server returns a domain-specific blocked relationship error code, the controller hides post/comment content and disables all interactions. The controller does not invent fields and relies on the error code only.

## State Machine

```
idle -> loading -> success
            └-> error --onRetry--> loading
```

## Defaults & Configuration
- commentsPageSize default: 20.
- Controller never reads localStorage; receives token via `authToken` prop.

## Contracts & References
- Endpoints and envelopes per `FRONTEND-CONTRACT.md`.
- Flows: do not show blocked users' content; optional auth flags in post detail; comment CRUD and like/unlike.
- Screen Map: `POST_DETAIL`.

## Notes
- Children are pure; they never fetch or access global state.
- Replies are paginated via `parentCommentId` and `page/limit`.

## Clarifications Resolved
- Navigation: Children emit `onAuthorNavigate` / `onCommunityNavigate`; controller emits upstream `onNavigateToProfile` / `onNavigateToCommunity`.
- Comment CRUD: Not optimistic; wait for server responses before mutating local lists.
- Comment like/unlike: Optimistic toggle + rollback on error.
- Blocked content: Use domain-specific error code; hide content and disable interactions.
