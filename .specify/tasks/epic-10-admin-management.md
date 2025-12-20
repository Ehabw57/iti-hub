# Epic 10: Admin Management (P0)

**Priority**: P0 (MVP)
**Estimated Effort**: 8-12 days
**Dependencies**: Epic 1 (Authentication)
**Specifications**: `/docs/specs/API-Specification.md`

---

## Overview

Introduce admin-only management for Tags, Branches, Rounds, per-round Tracks, and Editor role assignment/removal. Extend user profile to support Branch → Round → Track selection with verification status managed by Admin and enrollment creation. No reports system and no admin community management.

## Goals
- Admin can create, update, disable Tags (disable => not selectable/readable/assignable in new/updated entities)
- Admin can create, update, disable Branches (disabled => hidden from selection lists)
- Admin can create, update, start, end, disable Rounds (one active round per branch; at most one upcoming per branch)
- Admin can create, update, disable Tracks per Round (belongs to one Round; disabled => hidden)
- Admin can assign/remove Editor role to existing users
- User can select Branch & Round & Track; verificationStatus becomes null (pending) until Admin reviews
- Strict validation: roundId must belong to branchId; trackId must belong to roundId
- On verification, create a UserEnrollment { userId, branchId, roundId, trackId, graduated }

## Non-Goals
- No reports feature
- No admin APIs for community management

---

## User Stories

### US1: Admin manages Tags
As an Admin, I want to create, update, and disable tags so that platform taxonomy is controlled.

Acceptance:
- POST /admin/tags creates tag with unique name
- PATCH /admin/tags/:tagId updates name/description
- POST /admin/tags/:tagId/disable marks tag disabled and prevents selection/use in new/updated entities

### US2: Admin manages Branches
As an Admin, I want to create, update, and disable branches so that users can select from curated branches.

Acceptance:
- POST /admin/branches creates branch
- PATCH /admin/branches/:branchId updates fields
- POST /admin/branches/:branchId/disable hides it from selection lists (existing links remain)

### US3: Admin manages Tracks
As an Admin, I want to create, update, and disable per-round tracks so that specialization is well organized.

Acceptance:
- POST /admin/rounds/:roundId/tracks creates track with roundId (branchId denormalized)
- PATCH /admin/tracks/:trackId updates name/description only
- POST /admin/tracks/:trackId/disable hides it from selection (existing links remain)

### US3b: Admin manages Rounds
As an Admin, I want to manage rounds per branch to organize time-bound cohorts.

Acceptance:
- POST /admin/branches/:branchId/rounds creates round with unique number per branch
- PATCH /admin/rounds/:roundId updates name/startDate/endDate
- POST /admin/rounds/:roundId/start sets status to active (enforce single active per branch)
- POST /admin/rounds/:roundId/end sets status to ended
- POST /admin/rounds/:roundId/disable sets status to disabled

### US4: Admin assigns/removes Editor role
As an Admin, I want to assign or remove the editor role from a user so that editorial responsibilities are delegated.

Acceptance:
- POST /admin/editors assigns role to existing user (idempotent)
- DELETE /admin/editors/:userId removes role

### US5: User selects Branch & Track (verification)
As a User, I want to select branch, round, and track so that my profile reflects my path pending admin verification.

Acceptance:
- PUT /users/profile accepts branchId, roundId, trackId and sets verificationStatus to null
- Backend rejects if roundId doesn’t belong to branchId or trackId doesn’t belong to roundId
- Admin toggles verificationStatus to true/false
- If false, branchId/trackId are cleared
- If true, create UserEnrollment record { userId, branchId, roundId, trackId, graduated }

### US6: Admin graduates verified users
As an Admin, I want to mark a verified user's enrollment as graduated or not after the round ends.

Acceptance:
- POST /admin/enrollments/:enrollmentId/graduate with body `{ graduated: true|false }`
- Returns 404 if enrollment not found; idempotent updates

---

## Tasks

### Phase 1: Data & Permissions
- T201 Update User Model for Verification
- T202 Create Branch Model
- T203 Create Track Model
- T204 Create Tag Model

### Phase 2: Admin Endpoints (Branches/Rounds/Tracks/Tags)
- T205 Admin Branches Controllers
- T206 Admin Rounds Controllers
- T207 Admin Per-Round Tracks Controllers
- T207 Admin Tags Controllers

### Phase 3: Admin Endpoints (Editors & Users)
- T208 Assign/Remove Editor Controllers
- T209 Update Admin Users List (verification filter)
- T212 Admin Verify & Enrollment Controller
- T213 Admin Graduation Controller

### Phase 4: User Profile Flow
- T210 Update Update-Profile Controller
- T214 Get Rounds by Branch Controller
- T215 Get Tracks by Round Controller

### Phase 5: Routes, Middleware, Tests, Docs
- T212 Create/Update Admin Routes
- T213 Validation & Policies
- T214 Tests for Admin & Profile Flows
- T215 Update API Documentation

---

## Acceptance Criteria
- Branches/Rounds/Per-Round Tracks/Tags: create/update/disable implemented and tested
- Editors assignment/removal implemented and tested
- Update Profile sets verificationStatus to null and enforces round-branch, track-round relation
- Admin Users list supports verificationStatus filtering
- Admin graduation endpoint updates enrollment graduation status
- Endpoints protected by admin-only checks
- Documentation updated and consistent with API spec
