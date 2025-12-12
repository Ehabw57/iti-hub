# Specification Summary (one-page)

This file summarizes the key requirements from the spec documents in `docs/` and maps them to the repository areas that will implement them. It also lists open questions and next steps.

Date: 2025-12-12

## Chosen backend stack (MVP)
- Server framework: Express.js
- Database / ODM: MongoDB with Mongoose
- API documentation: Swagger / OpenAPI (swagger-jsdoc + swagger-ui-express)
- Testing: Jasmine for unit/integration tests (Supertest for HTTP integration)

Note: This repo already has server route/controller/model files under `server/` and a `server/docs/*.yaml` directory with OpenAPI fragments. We'll keep Swagger/OpenAPI in sync with `API-Specification.md`.

## High-level mapping (spec → repo locations)

- Authentication
  - Spec: `docs/Authentication-Specification.md`
  - Server routes: `server/routes/authRoutes.js`
  - Controller: `server/controllers/authController.js`
  - Models: `server/models/User.js`
  - Middleware: `server/middlewares/checkAuth.js`

- Users
  - Spec: `API-Specification.md` (User Endpoints)
  - Routes: `server/routes/userRoutes.js`
  - Controller: `server/controllers/userController.js`
  - Model: `server/models/User.js`

- Posts
  - Spec: `API-Specification.md` (Post Endpoints) and `Database-Schema.md` (Post schema)
  - Routes: `server/routes/postRoutes.js`
  - Controller: `server/controllers/postController.js`
  - Model: `server/models/Post.js`
  - Uploads: `server/middlewares/upload.js` (file handling) and `server/controllers/uploadController.js` (if present)

- Comments
  - Spec: `API-Specification.md` (Comment Endpoints)
  - Routes: `server/routes/commentRoutes.js`
  - Controller: `server/controllers/commentController.js`
  - Model: `server/models/Comment.js`

- Communities
  - Spec: `API-Specification.md` (Community Endpoints)
  - Routes: `server/routes/communityRoutes.js` (or part of `postRoutes`/`userRoutes`)
  - Controller: likely `server/controllers/connectionController.js` / `server/controllers/postController.js` handle community posts
  - Model: `server/models/Branch.js` / `server/models/Track.js` (repo contains `Branch.js` / `Track.js` — confirm mapping)

- Feed
  - Spec: `docs/Feed-Algorithm-Specification.md`
  - Routes: `server/routes/feedRoutes.js` (not always present — spec indicates `routes/feedRoutes.js`)
  - Controller/Service: `server/controllers/feedController.js` and a `services/feedService.js` (may be missing; create as needed)

- Messaging / Conversations
  - Spec: `API-Specification.md` (Messaging Endpoints)
  - Routes: `server/routes/messageRoutes.js`, `server/routes/conversationRoutes.js`
  - Controllers: `server/controllers/messageController.js`, `server/controllers/conversationController.js`
  - Models: `server/models/Conversation.js`, `server/models/Message.js`

- Notifications, Reports, Admin
  - Notifications: `server/controllers/notificationController.js`, `server/routes/notificationRoutes.js`, `server/models/Notification.js`
  - Reports & Admin endpoints: `server/controllers/*` and `server/routes/*` under `admin` or `reportRoutes` per repo structure

- Other models present in repo (map to spec):
  - `server/models/PostLike.js` (Post likes)
  - `server/models/CommentLike.js` (Comment likes)
  - `server/models/Connection.js` (Follow relationships)
  - `server/models/Enrollment.js` (may map to community membership)
  - `server/models/Notification.js`
  - `server/models/Role.js` (roles: user/admin)

## Quick checklist derived from specs (for implementation/verification)
- Ensure JWT authentication across protected routes (`checkAuth` middleware) and optional auth middleware for public endpoints.
- Password hashing with bcrypt and secure JWT secret (env var). Token expiry: 7 days (per spec).
- File upload pipeline: multer or Cloudinary integration (`upload.js` middleware). Enforce file-type and size limits (profile 2MB, others 5MB).
- Feed: implement `feedService.getHomeFeed` and `getFollowingFeed` per `Feed-Algorithm-Specification.md`. Use caching (Redis or in-memory) for MVP TTLs.
- Messaging: Socket.io for real-time events already specified; verify `app.js` Socket.io wiring.
- Tests: Add/extend Jasmine tests in `server/spec/` for auth, posts, comments, and upload flows.
- API docs: wire Swagger UI at `/api-docs` (use `server/docs/*.yaml` fragments or generate from JSDoc).

## Open questions / clarifications (to record in spec summary)
1. Community model mapping: repo has `Branch.js`, `Track.js`, `Enrollment.js` — how do these map to `communities` in spec? (Are communities represented by Branch/Track/enrollment?)
2. Upload storage provider: spec suggests Cloudinary, but repo middleware `server/middlewares/upload.js` may assume local storage — confirm whether to integrate Cloudinary now or keep local uploads + optional Cloudinary later.
3. Feed service location: `feedController.js`/`feedRoutes.js` are referenced in the spec, but confirm whether they exist. If missing, we'll add a `services/feedService.js` and `controllers/feedController.js`.
4. Admin routes: confirm naming/location for admin routes (some repos use `server/routes/admin/*.js`).
5. Tests framework: repo has `server/spec/` and Jasmine config — confirm Jasmine + Supertest are expected; if not installed, list dependencies to add.

## Acceptance criteria for this summary (what I'll deliver for Todo #1)
- `docs/SPEC_SUMMARY.md` (this file) created and committed.
- A short list of gaps and open questions (above).
- Next todo set to: create feature backlog (epics & stories) — I will start that next.

## Next steps (immediate)
1. (Now) Create prioritized feature backlog and CSV (Todo #2) — marked in todo list as in-progress after this step.
2. Map actual server routes/controllers to spec endpoints and produce a gap report (Todo #3).
3. Add missing Swagger definitions or sync `server/docs/*.yaml` with `API-Specification.md` (Todo #9).

---

If you'd like a different backend stack or prefer local uploads over Cloudinary, tell me now and I will adjust the backlog and implementation notes.
