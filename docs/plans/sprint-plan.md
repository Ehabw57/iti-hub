# Sprint Plan & Estimates

Purpose
- Split the backlog into numbered sprints (1-2 week cadence) for an initial 8-week roadmap focused on an MVP that supports auth, posts, feed, uploads, and basic social features.

Assumptions
- Team: 2 full-stack engineers + 1 QA (parallel work possible). Adjust sprint scope if team size differs.
- Sprint length: 2 weeks (10 working days). If you prefer 1-week sprints, I can re-slice.
- Goals: deliver usable MVP after 4 sprints (8 weeks), with additional polish in sprints 5-6.

Sprint breakdown (2-week sprints)

Sprint 1 (Weeks 1-2) — Core auth, user, and infra (P0)
- Tasks:
  - Implement registration and login endpoints (auth PRs completed earlier) — S
  - Harden `authenticate` middleware and require `JWT_SECRET` (done) — S
  - User profile GET/PATCH and profile picture support (baseline) — M
  - Add basic tests for auth and user endpoints (Jasmine unit tests) — M
  - Setup CI to run tests on PRs (GitHub Actions) — S
- Acceptance criteria:
  - Users can register/login and fetch/update their profile; JWT auth enforced.
  - CI runs tests and blocks PRs on failing tests.

Sprint 2 (Weeks 3-4) — Posts, comments, and uploads (P0)
- Tasks:
  - Post create/read/update/delete (soft delete) with counters — M
  - Comment CRUD and counting — M
  - Upload endpoint hardened (multer limits + `file-type` check) and integration tests — M
  - Image processing baseline (thumbnails) or direct Cloudinary flow (choose local-first or cloud-first) — M
- Acceptance criteria:
  - Posts and comments operate end-to-end; images can be uploaded and returned as URLs; upload tests pass.

Sprint 3 (Weeks 5-6) — Social graph & feed (P0)
- Tasks:
  - Follow/unfollow endpoints and connection model indexing — S
  - Implement feed service skeleton and following feed (chronological) — M
  - Add counters (likes/comments/reposts) and indexes on Post for feed queries — S
  - Unit tests for feed scoring functions (for later home feed) — S
- Acceptance criteria:
  - Users can follow/unfollow and see following feed; Post counters are accurate; feed unit tests pass.

Sprint 4 (Weeks 7-8) — Home feed, caching, notifications (P0)
- Tasks:
  - Implement Home feed scoring and `GET /feed/home` (in-memory scoring + caching NodeCache; pluggable Redis) — M
  - Implement notification creation on like/comment/follow and basic retrieval endpoints — M
  - Integration tests covering feed endpoints and notification flows — M
- Acceptance criteria:
  - Home feed returns scored results and cache reduces DB reads; notifications appear for actions and tests pass.

Sprint 5 (Weeks 9-10) — Reliability & ops (P1)
- Tasks:
  - Replace NodeCache with Redis-backed caching and add metrics/logging — M
  - Add rate-limiting to auth and upload endpoints — S
  - Add cleanup job for temp uploads and monitor storage usage — S
- Acceptance criteria:
  - Redis cache operational, rate-limits enforced, and temp files are cleaned regularly.

Sprint 6 (Weeks 11-12) — Polishing & admin (P1/P2)
- Tasks:
  - Community CRUD and membership flows — M
  - Admin moderation endpoints and reports — M
  - Add more integration tests and expand CI matrix (node versions) — M
- Acceptance criteria:
  - Community features work as expected; admin console endpoints present and tested.

Minimal MVP milestone (end of Sprint 4)
- Deliverables:
  - Auth (register/login/reset), user profiles, posts, comments, uploads, following feed, home feed (algorithmic), notifications, CI and tests.

Estimates & allocation notes
- Each Sprint contains a balanced mix of new features and tests/infra tasks so the team can parallelize.
- Estimates in backlog are rough; refine when scoping each ticket for implementation.

Risk & mitigations
- Risk: Feed performance with large followings. Mitigation: implement per-author recent-post limits and caching; postpone DB-side scoring until needed.
- Risk: Upload storage costs/time. Mitigation: local-first with strict limits, then move to Cloudinary when comfortable.

