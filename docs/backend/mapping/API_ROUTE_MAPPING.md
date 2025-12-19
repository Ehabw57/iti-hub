# API → Code Route Mapping & Gap Report

Generated: 2025-12-12

This document maps key endpoints from `docs/API-Specification.md` to the existing route files in `server/routes/` and controllers in `server/controllers/`. It highlights mismatches and missing endpoints to prioritize implementation work.

Summary of routing style in repository
- Routes are mounted directly on the app (no global `/api/v1` prefix). Example: `/register` and `/login` are top-level routes.
- Some routers include `/api` in their paths (conversation/message routes use `/api/conversations`), causing mixed URL patterns.

Mapping table (high level)

- Authentication
  - Spec: `POST /auth/register` -> Repo: `POST /register` in `server/routes/authRoutes.js` → controller: `server/controllers/authController.js` (register)
  - Spec: `POST /auth/login` -> Repo: `POST /login` in `server/routes/authRoutes.js` → controller: `login`
  - Spec missing in repo: `POST /auth/password-reset/request` and `POST /auth/password-reset/confirm` → Status: MISSING

- Users
  - Spec: `GET /users/:userId` -> Repo: `GET /users/:id` in `server/routes/userRoutes.js` → `userController.getUserById` exists
  - Spec: `PATCH /users/me` -> Repo: `PUT /users/:id` (updateUser) exists but uses `:id` (not `me`) and no `checkAuth` in route definition → Status: PARTIAL (exists, auth enforcement may be missing)
  - Spec: Follow/unfollow endpoints expected at `/users/:userId/follow` -> Repo models follow via `server/routes/connectionRoutes.js` endpoints under `/connections/*` (send request, accept, delete). Mapping: use `connections` routes to satisfy follow semantics but route names differ → Status: EXISTS (different path)

- Posts
  - Spec: `POST /posts` -> Repo: `POST /posts` in `server/routes/postRoutes.js` (createPost) with `authenticate` middleware – good
  - Spec: `GET /posts/:postId` -> Repo: `GET /posts/:id` (getPostById) – good
  - Spec: `PATCH /posts/:postId` -> Repo: `PUT /posts/:id` (updatePost) uses `PUT` instead of `PATCH` and uses `authenticate` middleware named `authenticate` → Status: PARTIAL (method difference and verify semantics)
  - Spec: Like/unlike: repo implements `POST /posts/:id/like` and `GET /posts/:id/likes` (no DELETE route for unlike) → Status: PARTIAL (unlike may be missing)
  - Spec: Save/unsave and repost endpoints appear to be missing in repo → Status: MISSING

- Comments
  - Spec: `POST /posts/:postId/comments` -> Repo: `POST /comments/:postId` in `server/routes/commentRoutes.js` (createComment) — path differs (spec expects posts/:postId/comments). GET comments: `GET /posts/:postId/comments` matches. Delete/PATCH endpoints exist. Like comment endpoints exist. → Status: PARTIAL (path ordering differs)

- Communities
  - Spec: `/communities` endpoints are not present in `server/routes/` (no `communityRoutes.js`) → Status: MISSING (but repo has `Branch.js`/`Track.js` models which may relate)

- Feed
  - Spec: `/feed/home` and `/feed/following` not present in `server/routes/` → Status: MISSING

- Messaging & Conversations
  - Spec: `/messages/conversations`, `/messages/conversations/:id/messages` → Repo: conversationRoutes.js exposes `/conversations` (prefixed with `/api` in the router) and messageRoutes uses `/conversations/:id/messages` (prefixed with `/api` in the router) — these match functionally but use `/api` prefix in router definitions. Controllers exist: `conversationController.js`, `messageController.js` → Status: EXISTS (mixed prefixes)

- Notifications
  - Spec: `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all` → Repo: `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all` in `server/routes/notificationRoutes.js` (controller: notificationController.js). Slight method differences (`PUT` vs `PATCH` and `POST` vs `PUT`) — functionally OK. → Status: EXISTS (minor differences)

- Search
  - Spec: `/search/users`, `/search/posts`, `/search/communities` → Repo: no search routes found → Status: MISSING

- Admin
  - Spec: many `/admin/*` endpoints → Repo: no admin routes found in `server/routes/` → Status: MISSING

- Uploads
  - Spec: `/upload/image` → Repo: `server/middlewares/upload.js` exists but no `routes/uploadRoutes.js` present → Status: PARTIAL (middleware exists; route/controller missing)

Controller coverage (directory `server/controllers/`)
- Controllers present: authController, commentController, connectionController, conversationController, messageController, notificationController, postController, userController — these cover core functionality for auth, posts, comments, messaging, notifications, connections.

Gaps and recommended next steps (short)
1. Add password-reset endpoints and controller logic (authController) — create routes `/auth/password-reset/request` and `/auth/password-reset/confirm` or keep top-level `/password-reset/...` to match repo style. (Priority: P0)
2. Normalize the API prefix and paths — either mount routers under `/api/v1` in `app.js` or update spec mapping to repo style. Decide on consistency (high priority for public API).
3. Add feed routes and implement `feedService`/`feedController` per Feed spec (P0).
4. Add community routes and map `Branch.js`/`Track.js`/`Enrollment.js` models to `communities` or create a new `Community` model and routes (P1).
5. Implement save/unsave and repost endpoints for posts (P0).
6. Add upload route(s) (`/upload/image`) that use existing `middlewares/upload.js` and implement Cloudinary or local storage integration (P0).
7. Add search endpoints and admin routes (P1).
8. Review auth enforcement: some routes don't include `authenticate` middleware (e.g., user update uses PUT /users/:id with no middleware) — add `checkAuth`/`authenticate` where required (P0).

Files to add / edit (initial tasks)
- `server/routes/uploadRoutes.js` (POST /upload/image) — uses `middlewares/upload` and a new `uploadController.uploadImage`.
- `server/controllers/authController.js` — add password reset methods if not present.
- `server/routes/feedRoutes.js` + `server/controllers/feedController.js` + `server/services/feedService.js` — implement feed logic.
- `server/routes/communityRoutes.js` + `server/controllers/communityController.js` — implement community CRUD and membership.
- Update `server/app.js` to mount routers consistently (consider prefix `/api/v1`) and register `uploadRoutes`, `feedRoutes`, and `communityRoutes`.
- Add middleware `authenticate` checks to routes that require auth (user updates, follow actions, etc.).

Acceptance criteria for mapping task
- A mapping document (this file) with: existing endpoints, controller mappings, and a prioritized list of missing routes/tasks.
- Todo #3 will be marked completed once the repo mapping is reviewed by you and tasks accepted.
