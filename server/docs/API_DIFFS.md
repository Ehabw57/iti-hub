# API Response Format Inconsistencies Report

> **Generated:** December 16, 2025  
> **Purpose:** Document ununified response formats across API endpoints

---

## Summary

This document identifies inconsistencies in the API response formats that should be addressed for better API consistency and developer experience.

---

## 1. Error Response Format Inconsistencies

### Issue: Two Different Error Response Formats

**Format A (Auth endpoints):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

**Format B (Most other endpoints):**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Affected Endpoints:

| Endpoint | Current Format | Recommended Format |
|----------|----------------|-------------------|
| `POST /auth/register` | Format A | Keep Format A |
| `POST /auth/login` | Format A | Keep Format A |
| `POST /auth/password-reset/*` | Format A | Keep Format A |
| `GET /users/{username}` | Format B | Migrate to Format A |
| `PUT /users/profile` | Format B | Migrate to Format A |
| `POST /posts` | Format B | Migrate to Format A |
| `GET /feed/*` | Format B | Migrate to Format A |
| All other endpoints | Format B | Migrate to Format A |

### Recommendation:
Standardize on **Format A** for all error responses as it provides:
- Machine-readable error codes for client-side handling
- Structured details for validation errors
- Better debugging information

---

## 2. Image Upload Response Inconsistencies

### Issue: Different success response structure for image uploads

**User Profile Picture (`POST /users/profile/picture`):**
```json
{
  "message": "Profile picture updated successfully",
  "profilePicture": "https://..."
}
```
*Note: Missing `success: true` field*

**User Cover Image (`POST /users/profile/cover`):**
```json
{
  "message": "Cover image updated successfully",
  "coverImage": "https://..."
}
```
*Note: Missing `success: true` field*

**Community Profile Picture (`POST /communities/{id}/profile-picture`):**
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "profilePicture": "https://..."
  }
}
```

### Recommendation:
Standardize all image upload responses to include:
```json
{
  "success": true,
  "message": "...",
  "data": {
    "imageUrl": "https://..."
  }
}
```

---

## 3. Image Upload Error Response Inconsistencies

### Issue: Different error key names

**User endpoints:**
```json
{
  "error": "No file uploaded"
}
```

**Other endpoints:**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

### Affected Files:
- `controllers/user/uploadProfilePictureController.js`
- `controllers/user/uploadCoverImageController.js`

### Recommendation:
Change error responses in user upload controllers to match the standard format:
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

---

## 4. Data Wrapper Inconsistencies

### Issue: Some responses wrap data in `data` object, others don't

**With data wrapper:**
```json
{
  "success": true,
  "data": {
    "post": { ... },
    "pagination": { ... }
  }
}
```

**Without data wrapper (Feed endpoints):**
```json
{
  "success": true,
  "feedType": "home",
  "posts": [...],
  "pagination": { ... },
  "cached": false
}
```

### Affected Endpoints:
| Endpoint | Current | Recommended |
|----------|---------|-------------|
| `GET /feed/home` | No wrapper | Add `data` wrapper |
| `GET /feed/following` | No wrapper | Add `data` wrapper |
| `GET /feed/trending` | No wrapper | Add `data` wrapper |
| `GET /communities/{id}/feed` | No wrapper | Add `data` wrapper |

### Recommendation:
All responses with data should use consistent structure:
```json
{
  "success": true,
  "data": {
    "feedType": "home",
    "posts": [...],
    "pagination": { ... }
  },
  "meta": {
    "cached": false
  }
}
```

---

## 5. Pagination Object Naming Inconsistencies

### Issue: Different property names for pagination

**Standard pagination:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

**Some endpoints use:**
```json
{
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

### Recommendation:
Standardize on:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## 6. Missing Authentication Error Responses

### Issue: Inconsistent 401 error messages

**Some endpoints return:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Others return:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Others return:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Recommendation:
Standardize authentication errors in `checkAuth` middleware:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## 7. Boolean Field Naming Inconsistencies

### Issue: Similar boolean fields have different names

| Endpoint | Field Names |
|----------|-------------|
| User Profile | `isFollowing`, `followsYou` |
| Post | `isLiked`, `isSaved`, `isReposted` |
| Community | `isJoined` |
| Comment | `isLiked` |

### Observation:
This is acceptable as these represent different concepts, but ensure consistency:
- All "is user doing X" should be `isX` format
- All "is X doing to user" could use `XsYou` format

---

## 8. Notification Endpoints - Missing in Routes

### Issue: Notification routes exist but controllers are not found

**Routes file references:**
```javascript
const { getNotifications, markNotificationRead, markAllNotificationsRead } = 
  require("../controllers/notificationController");
```

**Problem:** The `notificationController.js` file doesn't exist in the controllers directory.

### Impact:
- Notification endpoints will fail at runtime
- Missing documentation for notification response formats

### Recommendation:
Create the missing controller file or update routes to point to correct location.

---

## Action Items

### High Priority:
1. [ ] Standardize error response format to use `error` object with `code` and `message`
2. [ ] Fix image upload controllers to use consistent response format
3. [ ] Create or locate missing notification controller

### Medium Priority:
4. [ ] Add `data` wrapper to feed endpoints
5. [ ] Standardize pagination object structure
6. [ ] Unify authentication error messages

### Low Priority:
7. [ ] Review and document all field naming conventions
8. [ ] Add JSDoc comments to controllers for response documentation

---

## Files Requiring Changes

| File | Issue | Priority |
|------|-------|----------|
| `controllers/user/uploadProfilePictureController.js` | Error format, missing success field | High |
| `controllers/user/uploadCoverImageController.js` | Error format, missing success field | High |
| `controllers/feed/*.js` | Missing data wrapper | Medium |
| `middlewares/checkAuth.js` | Inconsistent error messages | Medium |
| `controllers/notificationController.js` | File missing | High |

---

## Response Format Standards (Recommended)

### Success Response:
```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data here
  }
}
```

### Success Response with Pagination:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional details
    }
  }
}
```

### Validation Error Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Email is required",
        "password": "Password must be at least 8 characters"
      }
    }
  }
}
```
