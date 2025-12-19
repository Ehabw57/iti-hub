# Screen Map

Source of truth: `docs/API-ROUTES.md`, server controllers (see attachments), and `docs/User-Flows.md`. No new APIs, fields, or routes are invented. When exact client route strings are not confirmed, they are marked as TODO.

---

## AUTH_LOGIN

- **Name / ID**: AUTH_LOGIN
- **Purpose / Goal**: Authenticate the user and obtain a JWT token.
- **Entry Points (routes)**:
  - Client route: TODO (typically `/login`)
  - Linked from guarded actions/screens when unauthenticated.
- **Data Requirements (API + guaranteed fields)**:
  - POST `/auth/login` with `{ email, password }`
  - Success data: `{ user, token }`
  - Guaranteed user fields (from `User` model): `_id, email, username, fullName, role, isBlocked, createdAt, updatedAt, lastSeen?`
- **Actions / Interactions**:
  - Submit credentials
  - Handle `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_BLOCKED`, `TOO_MANY_REQUESTS` (client cooldown)
- **Preconditions**:
  - User is unauthenticated
- **Postconditions**:
  - Token stored (localStorage)
  - Navigated to Home feed
- **Notes / TODOs**:
  - Rate limit enforced (10/15min). Client cooldown behavior defined in flows.

---

## AUTH_REGISTER

- **Name / ID**: AUTH_REGISTER
- **Purpose / Goal**: Create an account; receive token for immediate login.
- **Entry Points (routes)**:
  - Client route: TODO (typically `/register`)
- **Data Requirements (API + guaranteed fields)**:
  - POST `/auth/register` with `{ email, password, username, fullName }`
  - Success data: `{ user, token }`
  - Guaranteed user fields: `_id, email, username, fullName, role, isBlocked, createdAt, updatedAt`
- **Actions / Interactions**:
  - Submit registration form
  - Handle `VALIDATION_ERROR`, duplicates, `TOO_MANY_REQUESTS`
- **Preconditions**:
  - User unauthenticated
- **Postconditions**:
  - Token stored; navigated to Home feed
- **Notes / TODOs**:
  - Client-side password policy (min 8, mixed) per flows.

---

## AUTH_PASSWORD_RESET_REQUEST

- **Name / ID**: AUTH_PASSWORD_RESET_REQUEST
- **Purpose / Goal**: Request a password reset email.
- **Entry Points (routes)**:
  - Client route: TODO (typically `/password-reset`)
- **Data Requirements (API + guaranteed fields)**:
  - POST `/auth/password-reset/request` `{ email }`
  - Success always returns a generic success message
- **Actions / Interactions**:
  - Submit email
  - Handle `VALIDATION_ERROR`, `TOO_MANY_REQUESTS`
- **Preconditions**:
  - Any auth state
- **Postconditions**:
  - Success message shown; user proceeds to confirm page via email link
- **Notes / TODOs**:
  - Token validity 1h (server-side)

---

## AUTH_PASSWORD_RESET_CONFIRM

- **Name / ID**: AUTH_PASSWORD_RESET_CONFIRM
- **Purpose / Goal**: Set a new password with a valid reset token.
- **Entry Points (routes)**:
  - Client route: TODO (typically `/password-reset/confirm`)
- **Data Requirements (API + guaranteed fields)**:
  - POST `/auth/password-reset/confirm` `{ token, newPassword }`
- **Actions / Interactions**:
  - Submit new password
  - Handle `INVALID_TOKEN`, `TOKEN_EXPIRED`, `VALIDATION_ERROR`
- **Preconditions**:
  - Valid (unexpired) token
- **Postconditions**:
  - Redirect to Login

---

## FEED_HOME

- **Name / ID**: FEED_HOME
- **Purpose / Goal**: Default landing feed; algorithmic for authenticated users, recent/featured for guests.
- **Entry Points (routes)**:
  - Client route: TODO (typically `/`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/feed/home` with `page, limit`
  - Returns `{ cached, feedType: "home", posts[], pagination }`
  - Post guaranteed fields (from `Post`): `_id, author, likesCount, commentsCount, repostsCount, savesCount, createdAt, updatedAt`; optional: `content, images[], tags[], community, editedAt`; conditional flags when auth: `isLiked?, isSaved?`
- **Actions / Interactions**:
  - Infinite scroll (client-side)
  - Like/Unlike, Save/Unsave, Repost
- **Preconditions**:
  - None (optional auth)
- **Postconditions**:
  - Client cache updated; optimistic interactions reconciled with HTTP responses
- **Notes / TODOs**:
  - Do not reorder feed on interactions.

---

## FEED_FOLLOWING

- **Name / ID**: FEED_FOLLOWING
- **Purpose / Goal**: Chronological feed from followed users/communities.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/following`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/feed/following` with `page, limit` (auth required)
  - Same post field guarantees as FEED_HOME
- **Actions / Interactions**:
  - Infinite scroll; standard post interactions
- **Preconditions**:
  - Authenticated
- **Postconditions**:
  - Client cache updated

---

## FEED_TRENDING

- **Name / ID**: FEED_TRENDING
- **Purpose / Goal**: Global trending feed.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/trending`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/feed/trending` with `page, limit` (optional auth)
- **Actions / Interactions**:
  - Infinite scroll; standard post interactions
- **Preconditions**:
  - None
- **Postconditions**:
  - Client cache updated

---

## POST_COMPOSER

- **Name / ID**: POST_COMPOSER
- **Purpose / Goal**: Create a new post with text and/or images.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/compose` or modal)
- **Data Requirements (API + guaranteed fields)**:
  - POST `/posts` (multipart)
  - Body fields: `content?, tags?, community?, images[]?`
  - Success returns `{ post }` with post guarantees (see FEED_HOME)
- **Actions / Interactions**:
  - Select images, write content, choose community/tags, submit
- **Preconditions**:
  - Authenticated
- **Postconditions**:
  - Redirect to Home feed; new post appears at top
- **Notes / TODOs**:
  - Handle `UPLOAD_ERROR` and validation feedback.

---

## POST_DETAIL

- **Name / ID**: POST_DETAIL
- **Purpose / Goal**: View a single post and its comments.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/post/:postId`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/posts/:id` (optional auth; conditional `isLiked`, `isSaved`)
  - GET `/posts/:postId/comments` with `page, limit, parentCommentId?`
  - Comment guaranteed fields: `_id, author, post, content, likesCount, repliesCount, createdAt, updatedAt`; optional: `parentComment, editedAt`
- **Actions / Interactions**:
  - Like/Unlike, Save/Unsave, Repost
  - Create Comment: POST `/posts/:postId/comments` `{ content, parentCommentId? }`
  - Update/Delete Comment: PUT/DELETE `/comments/:id`
  - Like/Unlike Comment: POST/DELETE `/comments/:id/like`
- **Preconditions**:
  - None (optional auth)
- **Postconditions**:
  - State reconciled with server; blocked users' content hidden

---

## USER_PROFILE

- **Name / ID**: USER_PROFILE
- **Purpose / Goal**: Display a user’s public profile.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/user/:username`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/users/:username` (optional auth)
  - Guaranteed fields: `_id, username, fullName, bio?, profilePicture?, coverImage?, specialization?, location?, role, followersCount, followingCount, postsCount, isBlocked?, createdAt, updatedAt`
  - Conditional relationship flags: `isFollowing?`, `followsYou?` (when authenticated)
  - Posts list: GET `/users/:userId/posts` with `page, limit`
- **Actions / Interactions**:
  - Follow/Unfollow: POST/DELETE `/users/:userId/follow`
  - Block/Unblock: POST/DELETE `/users/:userId/block`
- **Preconditions**:
  - None; access may be restricted if blocking applies
- **Postconditions**:
  - Profile actions update counters and visibility.

---

## USER_FOLLOWERS

- **Name / ID**: USER_FOLLOWERS
- **Purpose / Goal**: List followers of a user.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/user/:userId/followers`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/users/:userId/followers` with `page, limit`
  - Item minimum fields: `_id, username, fullName, profilePicture?`; conditional `isFollowing?`
- **Actions / Interactions**:
  - Follow/Unfollow via connection endpoints
- **Preconditions**:
  - None (optional auth)
- **Postconditions**:
  - Lists updated, counters reconciled
- **Notes / TODOs**:
  - Exact item field set subject to controller response.

---

## USER_FOLLOWING

- **Name / ID**: USER_FOLLOWING
- **Purpose / Goal**: List accounts the user is following.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/user/:userId/following`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/users/:userId/following` with `page, limit`
  - Item minimum fields: `_id, username, fullName, profilePicture?`; conditional `isFollowing?`
- **Actions / Interactions**:
  - Follow/Unfollow
- **Preconditions**:
  - None (optional auth)
- **Postconditions**:
  - Lists updated

---

## SAVED_POSTS

- **Name / ID**: SAVED_POSTS
- **Purpose / Goal**: Show current user’s saved posts.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/saved`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/posts/saved` (auth required) with `page, limit`
  - Post field guarantees as in FEED_HOME; `isSaved` should be true
- **Actions / Interactions**:
  - Unsave posts; standard post interactions
- **Preconditions**:
  - Authenticated
- **Postconditions**:
  - Saved list reconciled

---

## COMMUNITIES_DIRECTORY

- **Name / ID**: COMMUNITIES_DIRECTORY
- **Purpose / Goal**: Discover and filter communities.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/communities`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/communities` with `page, limit, search, tags`
  - Community guaranteed fields: `_id, name, description, tags[], profilePicture?, coverImage?, memberCount, postCount, owners[], moderators[], createdAt, updatedAt`
  - Conditional flags: `isJoined?, role?` when authenticated
- **Actions / Interactions**:
  - Filter by tags/search; Join/Leave
- **Preconditions**:
  - None (optional auth)
- **Postconditions**:
  - Membership flags updated
- **Notes / TODOs**:
  - Allowed tags endpoint is not implemented (see flows TODO).

---

## COMMUNITY_DETAIL

- **Name / ID**: COMMUNITY_DETAIL
- **Purpose / Goal**: View community details and feed.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/community/:id`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/communities/:id` (optional auth)
  - GET `/communities/:communityId/feed` with `page, limit`
  - Community field guarantees as per directory; conditional `isJoined?, role?`
- **Actions / Interactions**:
  - Join/Leave community
  - For moderators/owners: remove posts (via `DELETE /posts/:id`) per permissions
- **Preconditions**:
  - None; moderation actions require role
- **Postconditions**:
  - Membership and content reflect changes

---

## COMMUNITY_CREATE

- **Name / ID**: COMMUNITY_CREATE
- **Purpose / Goal**: Create a new community.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/community/create`)
- **Data Requirements (API + guaranteed fields)**:
  - POST `/communities` (multipart)
  - Fields: `name, description, tags[]`; optional images
- **Actions / Interactions**:
  - Submit form, upload images
- **Preconditions**:
  - Authenticated
- **Postconditions**:
  - Redirect to community detail
- **Notes / TODOs**:
  - Tag fetch endpoint pending.

---

## COMMUNITY_EDIT

- **Name / ID**: COMMUNITY_EDIT
- **Purpose / Goal**: Owner-only editing of community details and images.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/community/:id/edit`)
- **Data Requirements (API + guaranteed fields)**:
  - PATCH `/communities/:id` `{ description }`
  - POST `/communities/:id/profile-picture` (image)
  - POST `/communities/:id/cover-image` (image)
- **Actions / Interactions**:
  - Update description; upload images
- **Preconditions**:
  - Authenticated; user is owner
- **Postconditions**:
  - Community updated
- **Notes / TODOs**:
  - Name/other fields update not exposed via API.

---

## COMMUNITY_MODERATION

- **Name / ID**: COMMUNITY_MODERATION
- **Purpose / Goal**: Owner/moderator management.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/community/:id/moderation`)
- **Data Requirements (API + guaranteed fields)**:
  - POST `/communities/:id/moderators` `{ userId }`
  - DELETE `/communities/:id/moderators/:userId`
- **Actions / Interactions**:
  - Add/remove moderator; remove posts (via post deletion)
- **Preconditions**:
  - Authenticated; appropriate role
- **Postconditions**:
  - Role assignments updated
- **Notes / TODOs**:
  - Member removal endpoint not defined.

---

## MESSAGES_LIST

- **Name / ID**: MESSAGES_LIST
- **Purpose / Goal**: Show user’s conversations.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/messages`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/conversations` with `page, limit`
  - Conversation guaranteed fields: `_id, type, participants[], name?, image?, admin?, lastMessage{ content, senderId, timestamp }?, unreadCount(Map), createdAt, updatedAt`
- **Actions / Interactions**:
  - Open conversation; create individual or group
- **Preconditions**:
  - Authenticated
- **Postconditions**:
  - Navigation to conversation detail

---

## CONVERSATION_DETAIL

- **Name / ID**: CONVERSATION_DETAIL
- **Purpose / Goal**: Chat in a specific conversation.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/messages/:conversationId`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/conversations/:conversationId`
  - GET `/conversations/:conversationId/messages` with `cursor, limit`
  - Message guaranteed fields: `_id, conversation, sender, content?, image?, status, seenBy[], createdAt`
- **Actions / Interactions**:
  - Send message: POST `/conversations/:conversationId/messages` (multipart)
  - Mark seen: PUT `/conversations/:conversationId/seen`
  - Group admin actions: add/remove member, leave, update name/image
- **Preconditions**:
  - Authenticated; participant of conversation
- **Postconditions**:
  - Unread counts reduced; lastMessage updated server-side
- **Notes / TODOs**:
  - Realtime via WS with fallback polling.

---

## NOTIFICATIONS_CENTER

- **Name / ID**: NOTIFICATIONS_CENTER
- **Purpose / Goal**: View and manage notifications.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/notifications`)
- **Data Requirements (API + guaranteed fields)**:
  - GET `/notifications` with `page, limit`
  - GET `/notifications/unread/count`
  - PUT `/notifications/read` (all) / PUT `/notifications/:id/read` (single)
  - Notification guaranteed fields: `_id, recipient, actor, actorCount, type, target?, isRead, createdAt, updatedAt`
- **Actions / Interactions**:
  - Mark as read (single/all)
- **Preconditions**:
  - Authenticated
- **Postconditions**:
  - Badges and lists synchronized with HTTP
- **Notes / TODOs**:
  - Grouping behavior per server logic (non-follow, non-repost types).

---

## SEARCH

- **Name / ID**: SEARCH
- **Purpose / Goal**: Full search with tabbed results.
- **Entry Points (routes)**:
  - Client route: TODO (e.g., `/search`)
- **Data Requirements (API + guaranteed fields)**:
  - Users: GET `/search/users` with `q(>=2), specialization?, page, limit`
    - Item minimum: `_id, username, fullName, profilePicture?`; conditional `isFollowing?`
  - Posts: GET `/search/posts` with `q, type?, communityId?, page, limit`
    - Post field guarantees as per feeds; conditional `hasLiked?/hasSaved?` from API-ROUTES
  - Communities: GET `/search/communities` with `q, tags, page, limit`
    - Community field guarantees as per directory; conditional `isMember?`
- **Actions / Interactions**:
  - Debounced input; tab switching; pagination per tab
- **Preconditions**:
  - None (optional auth)
- **Postconditions**:
  - Independent tab states maintained
- **Notes / TODOs**:
  - Suggestions/Top Matches endpoint not implemented.

---

## ROUTING_NOTES

- Canonical client routes are marked TODO where unspecified in `User-Flows.md`.
- Deep linking permitted; protected views should redirect to Login when unauthenticated.
- All data contracts use unified envelopes.
