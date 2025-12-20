# API Specification

**Project**: ITI Hub Social Media Platform  
**Version**: 1.0 (MVP)  
**Base URL**: `/api/v1`  
**Date**: December 12, 2025

---

## Table of Contents

1. [General API Information](#general-api-information)
2. [Authentication Endpoints](#authentication-endpoints)
3. [User Endpoints](#user-endpoints)
4. [Post Endpoints](#post-endpoints)
5. [Comment Endpoints](#comment-endpoints)
6. [Community Endpoints](#community-endpoints)
7. [Feed Endpoints](#feed-endpoints)
8. [Messaging Endpoints](#messaging-endpoints)
9. [Notification Endpoints](#notification-endpoints)
10. [Search Endpoints](#search-endpoints)
11. [Admin Endpoints](#admin-endpoints)
12. [Roles & Permissions](#roles--permissions)

---

## General API Information

### Authentication
All endpoints except public endpoints require JWT token in header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Response Format

**Success Response:**
## Roles & Permissions

### Roles

- Admin
  - Full system access.
  - Only role allowed to manage: Branches (create, update, disable), Tracks (create, update, disable), Tags (create, update, disable), Editors (assign and remove).
  - Approve or reject user branch & track verification status.
  - No admin APIs for community management.

- Editor (new role)
  - Has all Admin permissions EXCEPT: cannot manage branches, tracks, tags, editors, or admins.
  - Can do everything a normal user can.
  - Manages only the communities they created.

- User
  - Normal user permissions.
  - Can submit branch & track selection (verification flow).

### Non-Goals

- No reports system.
- No admin APIs for community management.

### Common Query Parameters
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `sortBy` (string): Field to sort by
- `order` (string: 'asc' | 'desc', default: 'desc'): Sort order

---

## Authentication Endpoints

### 1. Register User

**Endpoint**: `POST /auth/register`  
**Auth Required**: No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "johndoe",
  "fullName": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, unique in database
- `password`: Min 8 chars, must contain uppercase, lowercase, number
- `username`: 3-30 chars, alphanumeric + underscore, unique
- `fullName`: 2-100 chars

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "userId123",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "createdAt": "2025-12-12T10:00:00Z"
    }
  },
  "message": "Registration successful. Please login."
}
```

**Error Responses:**
- `400`: Validation error
- `409`: Email or username already exists

---

### 2. Login User

**Endpoint**: `POST /auth/login`  
**Auth Required**: No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "userId123",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "profilePicture": "https://...",
      "role": "user"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400`: Invalid email or password format
- `401`: Incorrect credentials
- `403`: Account blocked

---

### 3. Request Password Reset

**Endpoint**: `POST /auth/password-reset/request`  
**Auth Required**: No

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If email exists, reset link has been sent"
}
```

*Note: Always returns success to prevent email enumeration*

---

### 4. Reset Password

**Endpoint**: `POST /auth/password-reset/confirm`  
**Auth Required**: No

**Request Body:**
```json
{
  "token": "resetToken123",
  "newPassword": "NewSecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400`: Invalid or expired token
- `400`: Password validation failed

---

## User Endpoints

### 5. Get User Profile by Username

**Endpoint**: `GET /users/:username`  
**Auth Required**: No (public), Optional (for relationship metadata)  
**Description**: Retrieve a user's public profile information. When authenticated, includes relationship status (isFollowing, followsYou, isBlocked).

**Path Parameters:**
- `username` (string, required): The username of the user to retrieve

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "fullName": "John Doe",
    "bio": "Software developer passionate about web tech",
    "profilePicture": "https://example.com/pic.jpg",
    "coverImage": "https://example.com/cover.jpg",
    "specialization": "Full-Stack Development",
    "location": "Cairo, Egypt",
    "followersCount": 150,
    "followingCount": 80,
    "postsCount": 45,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-12-13T10:00:00.000Z",
    "isFollowing": true,
    "followsYou": false,
    "isBlocked": false,
    "isOwnProfile": false
  }
}
```

**Response Fields (authenticated request):**
- `isFollowing` (boolean): Whether the requester follows this user
- `followsYou` (boolean): Whether this user follows the requester back
- `isBlocked` (boolean): Whether there's a block relationship
- `isOwnProfile` (boolean): Whether this is the requester's own profile
- `email` (string): Only included when viewing own profile

**Error Responses:**
- `404 Not Found`: User with specified username not found
```json
{
  "success": false,
  "message": "User not found"
}
```
- `403 Forbidden`: Blocked by the target user
```json
{
  "success": false,
  "message": "You cannot view this profile"
}
```

---

### 6. Update Own Profile

**Endpoint**: `PUT /users/profile`  
**Auth Required**: Yes (JWT)  
**Description**: Update the authenticated user's profile information. Only specified fields in the updatable list can be modified.

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "bio": "Updated bio text - I love coding!",
  "specialization": "DevOps Engineer",
  "location": "Alexandria, Egypt",
  "profilePicture": "https://example.com/new-pic.jpg",
  "coverImage": "https://example.com/new-cover.jpg",
  "branchId": "507f1f77bcf86cd799439099",
  "roundId": "507f1f77bcf86cd799439555",
  "trackId": "507f1f77bcf86cd799439100"
}
```

**Updatable Fields:**
- `fullName` (string): 2-100 characters
- `bio` (string): Max 300 characters
- `specialization` (string): Max 100 characters
- `location` (string): Max 100 characters
- `profilePicture` (string): URL
- `coverImage` (string): URL
- `branchId` (string): Optional; selecting sets `verificationStatus` to `null` (pending)
- `roundId` (string): Optional; must belong to selected `branchId`; selecting sets `verificationStatus` to `null` (pending)
- `trackId` (string): Optional; must belong to selected `roundId`; sets `verificationStatus` to `null` (pending)

**Protected Fields (ignored if sent):**
- `email`, `password`, `role`, `username`, `followersCount`, `followingCount`, `postsCount`, `isBlocked`, `blockReason`
- `verificationStatus` (managed by Admin): boolean or null
  - `true`: verified
  - `false`: not verified
  - `null`: pending

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated; verification pending",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Updated Doe",
    "bio": "Updated bio text - I love coding!",
    "specialization": "DevOps Engineer",
    "location": "Alexandria, Egypt",
    "profilePicture": "https://example.com/new-pic.jpg",
    "coverImage": "https://example.com/new-cover.jpg",
    "branch": { "id": "507f1f77bcf86cd799439099", "name": "AI" },
  "round": { "id": "507f1f77bcf86cd799439555", "number": 8, "name": "2025 Winter" },
    "track": { "id": "507f1f77bcf86cd799439100", "name": "Machine Learning" },
  "verificationStatus": null,
    "followersCount": 150,
    "followingCount": 80,
    "postsCount": 45,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-12-13T10:05:00.000Z"
  }
}
```

### Branch, Round & Track Selection Rules

- Branch & track selection is optional.
- Round dropdown is disabled until a branch is chosen; only rounds belonging to the selected branch are shown.
- Track dropdown is disabled until a round is chosen; only tracks belonging to the selected round are shown.
- Backend must reject any request where `roundId` does not belong to `branchId`, or `trackId` does not belong to `roundId`.
- When branch & track are submitted, set `verificationStatus` to `null` (pending).
- Admin reviews users with `pending` status and sets to `verified` or `non-verified`.
- If `non-verified`, branch & track fields are cleared.
- If `verified`, branch & track are shown publicly until the user changes them again (status returns to `pending`).

---

## Rounds & Per-Round Tracks

### Round Model

Entity under Branch representing a time-bound cohort (semester-like) that contains tracks.

Fields:
- `id` (string)
- `branchId` (string, required)
- `number` (integer, required): unique per branch; sequential but may start at any number
- `name` (string, optional): human label (e.g., "2025 Winter")
- `startDate` (ISO date, optional)
- `endDate` (ISO date, optional)
- `status` (enum, required): `draft` | `upcoming` | `active` | `ended` | `disabled`
- `createdAt` (ISO date)
- `updatedAt` (ISO date)

Constraints:
- One `active` round per branch at a time.
- At most one `upcoming` round per branch.
- Status transitions are manual via Admin endpoints (no scheduled activation yet).

Uniqueness:
- `number` must be unique within a branch.

Disable semantics:
- Disabling a branch hides its rounds and their tracks from public selection (existing links remain).
- Disabling a round hides the round and its tracks from public selection (existing links remain).

### Track (Per-Round) Model

Tracks are instantiated per round.

Fields:
- `id` (string)
- `roundId` (string, required)
- `branchId` (string, required; denormalized from round)
- `name` (string, required)
- `description` (string, optional)
- `disabled` (boolean, default: false)
- `createdAt` (ISO date)
- `updatedAt` (ISO date)

Uniqueness:
- `name` must be unique within a round (case-insensitive).

Disable semantics:
- A track can be disabled independently while the round remains active.

---

## Admin Endpoints (Rounds & Per-Round Tracks)

### Rounds Management (Admin-only)

- `POST /admin/branches/:branchId/rounds`
  - Create a round in a branch. Body: `{ number, name?, startDate?, endDate?, status? }`
  - Validations: `number` unique per branch; status must be one of enum.

- `PATCH /admin/rounds/:roundId`
  - Update mutable fields: `name`, `startDate`, `endDate`.
  - `branchId` and `number` immutable.

- `POST /admin/rounds/:roundId/start`
  - Set status to `active`. Enforces single active round per branch. If an active round exists, return `409`.

- `POST /admin/rounds/:roundId/end`
  - Set status to `ended`.

- `POST /admin/rounds/:roundId/disable`
  - Set status to `disabled` (hidden/blocked).

- `GET /admin/branches/:branchId/rounds`
  - List rounds for a branch (includes disabled).

### Tracks per Round (Admin-only)

- `POST /admin/rounds/:roundId/tracks`
  - Create a track instance for a round. Body: `{ name, description? }`
  - Validations: `name` unique within round.

- `PATCH /admin/tracks/:trackId`
  - Update `name`, `description` of a per-round track.

- `POST /admin/tracks/:trackId/disable`
  - Disable a per-round track.

---

## Public & Authenticated Lists

- `GET /branches`
  - Public; returns enabled branches only.

- `GET /rounds?branchId=<id>`
  - Public; returns rounds for a branch with statuses `active` and `ended` (excludes `disabled`).

- `GET /tracks?roundId=<id>`
  - Public; returns enabled tracks for the given round.

- `GET /admin/rounds?branchId=<id>`
  - Admin; returns all rounds including `disabled`.

- `GET /admin/tracks?roundId=<id>`
  - Admin; returns tracks including disabled.

---

## Verification & Enrollment

### Profile Submission (User)

- `PUT /users/profile`
  - Accepts `branchId`, `roundId`, `trackId` and sets `verificationStatus` to `null` (pending).
  - Validation: `roundId` belongs to `branchId`; `trackId` belongs to `roundId`.
  - Entities must exist and not be `disabled`.

### Admin Verification & Graduation

- `POST /admin/users/:userId/verify`
  - Body: `{ branchId, roundId, trackId, graduated: true|false }`
  - Behavior:
    - Verifies the user's profile (`verificationStatus` = `true`).
    - Creates a `UserEnrollment` record: `{ userId, branchId, roundId, trackId, graduated: true|false }`.
    - Idempotent: if an identical enrollment exists, return `200` with existing record.

- `DELETE /admin/users/:userId/verify`
  - Sets `verificationStatus` to `false` and clears `branchId`, `roundId`, `trackId` from profile. Does not delete historical enrollments.

- `POST /admin/enrollments/:enrollmentId/graduate`
  - Body: `{ graduated: true|false }`
  - Behavior:
    - Updates the graduation status for the specified enrollment.
    - Returns `404` if enrollment not found.
    - Idempotent: setting the same value returns `200` with no changes.

### UserEnrollment Model

Represents a verified participation of a user in a specific branch/round/track.

Fields:
- `id` (string)
- `userId` (string, required)
- `branchId` (string, required)
- `roundId` (string, required)
- `trackId` (string, required)
- `graduated` (boolean, required)
- `createdAt`, `updatedAt`

Notes:
- Users can have multiple enrollments, but not multiple tracks within the same round.
- Changing round requires selecting a new track as well.

---
