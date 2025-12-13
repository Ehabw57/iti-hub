# Specification Updates Summary

## Update: T003 - Authentication Middleware (December 12, 2025)

### Change Description
Replaced `checkAdmin()` middleware with a more flexible `authorize(...roles)` role-based access control (RBAC) middleware.

### Rationale
- **Scalability**: Single `checkAdmin()` function only handles one role, limiting future expansion
- **Flexibility**: `authorize()` supports multiple roles in a single declaration
- **Best Practice**: Industry-standard RBAC pattern used in most modern applications
- **Maintainability**: Reduces code duplication for different role checks

### Changes Made

#### 1. Specification Updates
**File**: `.specify/tasks/epic-01-authentication.md`

**Before**:
```javascript
3. checkAdmin(req, res, next)
   - Requires valid JWT and admin role
```

**After**:
```javascript
3. authorize(...allowedRoles)
   - Input: ...allowedRoles (string[]) - Array of allowed role names
   - Output: Middleware function (req, res, next)
   - Description: Role-based access control
   - Usage: authorize('admin', 'moderator') or authorize('admin')
```

#### 2. Implementation Updates
**File**: `server/middlewares/checkAuth.js`

**Removed**: 86 lines of `checkAdmin()` implementation that duplicated checkAuth logic

**Added**: 
```javascript
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource'
        }
      });
    }

    next();
  };
};
```

**Key Differences**:
- Higher-order function that returns middleware
- Must be used AFTER `checkAuth` (doesn't duplicate auth logic)
- Supports multiple roles: `authorize('admin', 'moderator', 'editor')`
- Uses standardized error codes: `NOT_AUTHENTICATED`, `INSUFFICIENT_PERMISSIONS`

#### 3. Test Updates
**File**: `server/spec/middlewares/checkAuth.spec.js`

**Removed**: 4 tests for `checkAdmin` (61 lines)

**Added**: 5 tests for `authorize` (78 lines)
- `should return 401 if user not authenticated`
- `should return 403 if user role not in allowed roles`
- `should call next if user has admin role`
- `should call next if user has one of multiple allowed roles`
- `should work with single role`

**Test Results**: 15 specs, 0 failures ✅

### Usage Examples

#### Before (checkAdmin):
```javascript
// Only works for admin role
router.delete('/users/:id', checkAuth, checkAdmin, deleteUser);
```

#### After (authorize):
```javascript
// Single role
router.delete('/users/:id', checkAuth, authorize('admin'), deleteUser);

// Multiple roles
router.post('/posts', checkAuth, authorize('admin', 'moderator', 'editor'), createPost);
router.get('/reports', checkAuth, authorize('admin', 'moderator'), viewReports);

// Any authenticated user (when combined with checkAuth)
router.get('/profile', checkAuth, authorize('user', 'admin', 'moderator'), viewProfile);
```

### Benefits

1. **Code Reduction**: Removed 86 lines of duplicated authentication logic
2. **Flexibility**: Support for multiple roles without additional middleware functions
3. **Composability**: Can easily chain with other middleware
4. **Clarity**: `authorize('admin', 'moderator')` is more explicit than `checkAdmin`
5. **Future-Proof**: Easy to add new roles (editor, moderator, etc.) without code changes

### Migration Guide

For any existing code using `checkAdmin`:

```javascript
// Old
router.use(checkAdmin);

// New
router.use(checkAuth, authorize('admin'));
```

**Important**: `authorize()` must be used AFTER `checkAuth` as it relies on `req.user` being populated.

### Error Code Changes

| Scenario | Old Code | New Code |
|----------|----------|----------|
| No authentication | `NO_TOKEN` | `NOT_AUTHENTICATED` |
| Wrong role | `ADMIN_REQUIRED` | `INSUFFICIENT_PERMISSIONS` |

### Acceptance Criteria
- [x] checkAuth validates JWT and attaches user
- [x] checkAuth rejects invalid/expired tokens
- [x] checkAuth rejects blocked users
- [x] optionalAuth works with or without token
- [x] authorize requires authentication
- [x] authorize supports multiple roles
- [x] All 15 tests pass

### Files Modified
1. `.specify/tasks/epic-01-authentication.md` - Updated specification
2. `server/middlewares/checkAuth.js` - Replaced checkAdmin with authorize
3. `server/spec/middlewares/checkAuth.spec.js` - Updated test suite
4. `.specify/tasks/CHECKLIST.md` - Updated task tracking

### Backward Compatibility
⚠️ **Breaking Change**: Any code using `checkAdmin` will need to be updated to use `checkAuth` + `authorize('admin')`.

### Next Steps
- Review all existing routes that may have used `checkAdmin` pattern
- Update route definitions to use new `authorize()` middleware
- Document role hierarchy in API documentation
- Consider adding role constants/enum for type safety
