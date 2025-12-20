# Epic 10: Admin Management API Documentation

This document describes all API endpoints introduced in Epic 10 for admin management functionality including branches, rounds, tracks, tags, editor role assignment, user verification, and enrollment graduation.

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Admin Endpoints](#admin-endpoints)
  - [Branch Management](#branch-management)
  - [Round Management](#round-management)
  - [Track Management](#track-management)
  - [Tag Management](#tag-management)
  - [Editor Role Management](#editor-role-management)
  - [User Verification & Enrollment](#user-verification--enrollment)
  - [Enrollment & Graduation](#enrollment--graduation)
  - [Admin User List](#admin-user-list)
- [Public Endpoints](#public-endpoints)
  - [Public Branches](#public-branches)
  - [Public Rounds](#public-rounds)
  - [Public Tracks](#public-tracks)
- [Data Models](#data-models)
- [Error Codes](#error-codes)

---

## Authentication

All admin endpoints require:
1. **Bearer Token**: Valid JWT in `Authorization` header
2. **Admin Role**: User must have `role: "admin"`

```
Authorization: Bearer <JWT_TOKEN>
```

Non-admin users receive `403 Forbidden`.

---

## Response Format

All responses follow the standard format defined in `responseHelpers.js`:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { /* response payload */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Admin Endpoints

### Branch Management

#### POST /admin/branches
Create a new branch.

**Request Body:**
```json
{
  "name": "Alexandria",
  "description": "Alexandria branch location"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Unique branch name (case-insensitive) |
| description | string | No | Optional description |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "_id": "64f...",
    "name": "Alexandria",
    "description": "Alexandria branch location",
    "isDisabled": false,
    "createdAt": "2025-12-20T10:00:00.000Z",
    "updatedAt": "2025-12-20T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Branch name is required
- `409` - Branch with this name already exists

---

#### PATCH /admin/branches/:branchId
Update branch fields.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| branchId | ObjectId | Branch ID |

**Request Body:**
```json
{
  "name": "Alexandria Updated",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": { /* updated branch object */ }
}
```

**Errors:**
- `404` - Branch not found
- `409` - Another branch with this name already exists

---

#### POST /admin/branches/:branchId/disable
Disable a branch (hide from public selection lists).

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| branchId | ObjectId | Branch ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Branch disabled successfully",
  "data": { /* branch with isDisabled: true */ }
}
```

**Errors:**
- `404` - Branch not found
- `409` - Branch is already disabled

---

#### GET /admin/branches
List all branches (including disabled) for admin.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "name": "Alexandria",
      "description": "...",
      "isDisabled": false
    },
    {
      "_id": "64f...",
      "name": "Cairo",
      "description": "...",
      "isDisabled": true
    }
  ]
}
```

---

### Round Management

#### POST /admin/branches/:branchId/rounds
Create a round in a branch.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| branchId | ObjectId | Branch ID |

**Request Body:**
```json
{
  "number": 45,
  "name": "Round 45 - Spring 2025",
  "startDate": "2025-03-01",
  "endDate": "2025-06-30",
  "status": "draft"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | integer | Yes | Unique round number within branch |
| name | string | No | Human-readable name |
| startDate | date | No | Round start date |
| endDate | date | No | Round end date |
| status | enum | No | One of: `draft`, `upcoming`, `active`, `ended`, `disabled`. Default: `draft` |

**Constraints:**
- Only ONE `active` round per branch
- At most ONE `upcoming` round per branch

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Round created successfully",
  "data": {
    "_id": "64f...",
    "branchId": "64f...",
    "number": 45,
    "name": "Round 45 - Spring 2025",
    "startDate": "2025-03-01T00:00:00.000Z",
    "endDate": "2025-06-30T00:00:00.000Z",
    "status": "draft"
  }
}
```

**Errors:**
- `400` - Round number is required / Invalid status
- `404` - Branch not found
- `409` - Round number already exists / Branch already has an active round / Branch already has an upcoming round

---

#### PATCH /admin/rounds/:roundId
Update mutable round fields.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| roundId | ObjectId | Round ID |

**Request Body:**
```json
{
  "name": "Updated Round Name",
  "startDate": "2025-03-15",
  "endDate": "2025-07-15"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Round updated successfully",
  "data": { /* updated round */ }
}
```

**Errors:**
- `404` - Round not found

---

#### POST /admin/rounds/:roundId/start
Set round status to `active`.

**Constraints:**
- Only one active round per branch
- Returns 409 if branch already has an active round

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Round started successfully",
  "data": { /* round with status: "active" */ }
}
```

**Errors:**
- `404` - Round not found
- `409` - Branch already has an active round

---

#### POST /admin/rounds/:roundId/end
Set round status to `ended`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Round ended successfully",
  "data": { /* round with status: "ended" */ }
}
```

**Errors:**
- `404` - Round not found
- `409` - Round is already ended

---

#### POST /admin/rounds/:roundId/disable
Set round status to `disabled` (hide from all lists).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Round disabled successfully",
  "data": { /* round with status: "disabled" */ }
}
```

**Errors:**
- `404` - Round not found
- `409` - Round is already disabled

---

#### GET /admin/branches/:branchId/rounds
List all rounds for a branch (includes all statuses).

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| branchId | ObjectId | Branch ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "branchId": "64f...",
      "number": 45,
      "name": "Round 45",
      "status": "active"
    },
    {
      "_id": "64f...",
      "branchId": "64f...",
      "number": 44,
      "name": "Round 44",
      "status": "ended"
    }
  ]
}
```

**Errors:**
- `404` - Branch not found

---

### Track Management

#### POST /admin/rounds/:roundId/tracks
Create a track for a round.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| roundId | ObjectId | Round ID |

**Request Body:**
```json
{
  "name": "Full-Stack Development",
  "description": "MEARN stack track"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Unique within round (case-insensitive) |
| description | string | No | Track description |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Track created successfully",
  "data": {
    "_id": "64f...",
    "roundId": "64f...",
    "branchId": "64f...",
    "name": "Full-Stack Development",
    "description": "MEARN stack track",
    "isDisabled": false
  }
}
```

**Errors:**
- `400` - Track name is required
- `404` - Round not found
- `409` - Track with this name already exists in this round

---

#### PATCH /admin/tracks/:trackId
Update track fields.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| trackId | ObjectId | Track ID |

**Request Body:**
```json
{
  "name": "Updated Track Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Track updated successfully",
  "data": { /* updated track */ }
}
```

**Errors:**
- `404` - Track not found
- `409` - Another track with this name already exists in this round

---

#### POST /admin/tracks/:trackId/disable
Disable a track.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Track disabled successfully",
  "data": { /* track with isDisabled: true */ }
}
```

**Errors:**
- `404` - Track not found
- `409` - Track is already disabled

---

#### GET /admin/tracks?roundId=\<id\>
List all tracks for a round (includes disabled).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| roundId | ObjectId | Yes | Round ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Full-Stack", "isDisabled": false },
    { "_id": "...", "name": "Mobile", "isDisabled": true }
  ]
}
```

**Errors:**
- `400` - roundId query parameter is required
- `404` - Round not found

---

### Tag Management

#### POST /admin/tags
Create a new tag.

**Request Body:**
```json
{
  "name": "javascript",
  "description": "JavaScript related content"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Unique tag name (stored lowercase) |
| description | string | No | Tag description |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "_id": "64f...",
    "name": "javascript",
    "description": "JavaScript related content",
    "isDisabled": false
  }
}
```

**Errors:**
- `400` - Tag name is required
- `409` - Tag with this name already exists

---

#### PATCH /admin/tags/:tagId
Update tag fields.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tag updated successfully",
  "data": { /* updated tag */ }
}
```

**Errors:**
- `404` - Tag not found
- `409` - Another tag with this name already exists

---

#### POST /admin/tags/:tagId/disable
Disable a tag.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tag disabled successfully",
  "data": { /* tag with isDisabled: true */ }
}
```

**Errors:**
- `404` - Tag not found
- `409` - Tag is already disabled

---

#### GET /admin/tags
List all tags (including disabled).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "javascript", "isDisabled": false },
    { "_id": "...", "name": "react", "isDisabled": true }
  ]
}
```

---

### Editor Role Management

#### POST /admin/editors
Assign editor role to a user.

**Request Body:**
```json
{
  "userId": "64f..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Editor role assigned successfully",
  "data": {
    "id": "64f...",
    "username": "john_doe",
    "role": "editor"
  }
}
```

**Notes:**
- Idempotent: Returns 200 if user is already an editor
- Cannot change admin role

**Errors:**
- `400` - userId is required / Cannot change admin role
- `404` - User not found

---

#### DELETE /admin/editors/:userId
Remove editor role from a user (set back to `user`).

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | ObjectId | User ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Editor role removed successfully",
  "data": {
    "id": "64f...",
    "username": "john_doe",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Cannot change admin role
- `404` - User not found

---

### User Verification & Enrollment

#### POST /admin/users/:userId/verify
Verify user profile and create enrollment record.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | ObjectId | User ID |

**Request Body:**
```json
{
  "branchId": "64f...",
  "roundId": "64f...",
  "trackId": "64f..."
}
```

**Validation Chain:**
1. User exists
2. Branch exists and not disabled
3. Round exists, belongs to branch, not disabled
4. Track exists, belongs to round, not disabled

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User verified and enrolled successfully",
  "data": {
    "user": {
      "id": "64f...",
      "username": "student1",
      "verificationStatus": true
    },
    "enrollment": {
      "_id": "64f...",
      "userId": "64f...",
      "branchId": "64f...",
      "roundId": "64f...",
      "trackId": "64f...",
      "graduated": null
    }
  }
}
```

**Notes:**
- Idempotent: Returns 200 if user already enrolled in this round
- Sets user's `verificationStatus` to `true`
- Sets user's `branchId`, `roundId`, `trackId`

**Errors:**
- `400` - Round does not belong to branch / Track does not belong to round / Disabled entities
- `404` - User/Branch/Round/Track not found

---

#### DELETE /admin/users/:userId/verify
Reject user verification.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User verification rejected; selections cleared",
  "data": {
    "id": "64f...",
    "username": "student1",
    "verificationStatus": false
  }
}
```

**Side Effects:**
- Sets `verificationStatus` to `false`
- Clears `branchId`, `roundId`, `trackId` to `null`

**Errors:**
- `404` - User not found

---

### Enrollment & Graduation

#### POST /admin/enrollments/:enrollmentId/graduate
Update graduation status for an enrollment.

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| enrollmentId | ObjectId | Enrollment ID |

**Request Body:**
```json
{
  "graduated": true
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| graduated | boolean | Yes | `true` (passed) or `false` (failed) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Enrollment marked as graduated",
  "data": {
    "_id": "64f...",
    "userId": "64f...",
    "roundId": "64f...",
    "trackId": "64f...",
    "graduated": true
  }
}
```

**Notes:**
- Idempotent: Returns 200 with "unchanged" if same value

**Errors:**
- `400` - graduated field is required
- `404` - Enrollment not found

---

#### GET /admin/enrollments
List enrollments with optional filters.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| roundId | ObjectId | No | Filter by round |
| graduated | string | No | Filter: `null`, `true`, `false` |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "userId": { "_id": "...", "username": "student1", "fullName": "Student One" },
      "branchId": { "_id": "...", "name": "Alexandria" },
      "roundId": { "_id": "...", "number": 45, "name": "Round 45" },
      "trackId": { "_id": "...", "name": "Full-Stack" },
      "graduated": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### Admin User List

#### GET /admin/users
List users with optional verification status filter.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| verificationStatus | string | No | Filter: `null`/`pending`, `true`/`verified`, `false`/`rejected` |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "username": "student1",
      "fullName": "Student One",
      "email": "student1@example.com",
      "role": "user",
      "verificationStatus": null,
      "branchId": null,
      "roundId": null,
      "trackId": null,
      "createdAt": "2025-12-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Public Endpoints

These endpoints are accessible without authentication.

### Public Branches

#### GET /branches
Returns enabled branches only.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "_id": "64f...", "name": "Alexandria", "description": "..." },
    { "_id": "64f...", "name": "Cairo", "description": "..." }
  ]
}
```

---

### Public Rounds

#### GET /rounds?branchId=\<id\>
Returns rounds with status `active` or `ended` for a branch.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| branchId | ObjectId | Yes | Branch ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "_id": "64f...", "number": 45, "name": "Round 45", "status": "active" },
    { "_id": "64f...", "number": 44, "name": "Round 44", "status": "ended" }
  ]
}
```

**Notes:**
- Excludes `draft`, `upcoming`, and `disabled` rounds
- Returns 404 if branch not found or disabled

**Errors:**
- `400` - branchId query parameter is required
- `404` - Branch not found

---

### Public Tracks

#### GET /tracks?roundId=\<id\>
Returns enabled tracks for a round.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| roundId | ObjectId | Yes | Round ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "_id": "64f...", "name": "Full-Stack Development", "description": "..." },
    { "_id": "64f...", "name": "Mobile Development", "description": "..." }
  ]
}
```

**Notes:**
- Excludes disabled tracks
- Returns 404 if round not found or disabled

**Errors:**
- `400` - roundId query parameter is required
- `404` - Round not found

---

## Data Models

### Branch
```javascript
{
  _id: ObjectId,
  name: String,          // unique, case-insensitive
  description: String,
  isDisabled: Boolean,   // default: false
  createdAt: Date,
  updatedAt: Date
}
```

### Round
```javascript
{
  _id: ObjectId,
  branchId: ObjectId,    // ref: Branch
  number: Number,        // unique within branch
  name: String,
  startDate: Date,
  endDate: Date,
  status: String,        // enum: draft|upcoming|active|ended|disabled
  createdAt: Date,
  updatedAt: Date
}
```

**Constraints:**
- Only ONE `active` round per branch
- At most ONE `upcoming` round per branch

### Track
```javascript
{
  _id: ObjectId,
  roundId: ObjectId,     // ref: Round
  branchId: ObjectId,    // ref: Branch (denormalized)
  name: String,          // unique within round, case-insensitive
  description: String,
  isDisabled: Boolean,   // default: false
  createdAt: Date,
  updatedAt: Date
}
```

### Tag
```javascript
{
  _id: ObjectId,
  name: String,          // unique, stored lowercase
  description: String,
  isDisabled: Boolean,   // default: false
  createdAt: Date,
  updatedAt: Date
}
```

### UserEnrollment
```javascript
{
  _id: ObjectId,
  userId: ObjectId,      // ref: User
  branchId: ObjectId,    // ref: Branch
  roundId: ObjectId,     // ref: Round
  trackId: ObjectId,     // ref: Track
  graduated: Boolean,    // null=not determined, true=passed, false=failed
  createdAt: Date,
  updatedAt: Date
}
```

**Constraints:**
- Unique compound index: `userId + roundId` (one track per round per user)

### User (Epic 10 additions)
```javascript
{
  // ... existing fields ...
  verificationStatus: Boolean,  // null=pending, true=verified, false=rejected
  branchId: ObjectId,           // ref: Branch (current)
  roundId: ObjectId,            // ref: Round (current)
  trackId: ObjectId             // ref: Track (current)
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Missing required fields, validation errors |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - User lacks admin role |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate, already disabled, constraint violation |
| 500 | Internal Server Error |

---

## Testing

Run Epic 10 integration tests:

```bash
cd server
$env:NODE_ENV='test' ; npx jasmine --filter="Epic 10"
```

Test file: `/server/spec/integration/epic10.integration.spec.js`

---

*Last updated: December 20, 2025*
