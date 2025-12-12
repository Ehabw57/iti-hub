# Authentication & Authorization Specification

**Project**: ITI Hub Social Media Platform  
**Version**: 1.0 (MVP)  
**Date**: December 12, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [JWT Token Structure](#jwt-token-structure)
4. [Password Security](#password-security)
5. [Middleware Implementation](#middleware-implementation)
6. [Authorization Levels](#authorization-levels)
7. [Password Reset Flow](#password-reset-flow)
8. [Security Best Practices](#security-best-practices)
9. [Error Handling](#error-handling)

---

## Overview

### Authentication Strategy

**Method**: JWT (JSON Web Token) based authentication
- **No sessions**: Stateless API design
- **No refresh tokens in MVP**: Keep it simple
- **Token expiration**: 7 days
- **Storage**: Client-side localStorage (or memory for enhanced security)
- **Transmission**: Authorization header (`Bearer <token>`)

### Key Principles

1. **Simplicity**: No complex OAuth flows in MVP
2. **Security**: Bcrypt password hashing, JWT signing, secure token transmission
3. **Stateless**: No server-side session storage
4. **Scalable**: Works with horizontal scaling
5. **Standard**: Uses industry-standard Authorization header pattern

---

## Authentication Flow

### 1. User Registration

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│ Client  │                  │  Server │                  │ Database │
└────┬────┘                  └────┬────┘                  └─────┬────┘
     │                            │                              │
     │ POST /auth/register        │                              │
     │ {email, password, ...}     │                              │
     ├───────────────────────────>│                              │
     │                            │                              │
     │                            │ 1. Validate input           │
     │                            │ 2. Check email uniqueness   │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │                              │
     │                            │ 3. Hash password (bcrypt)   │
     │                            │ 4. Create user record        │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │                              │
     │ 201 Created                │                              │
     │ {user: {...}}              │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
```

**Implementation Steps:**

1. **Validate Request**
   - Check email format
   - Check password strength (min 8 chars, uppercase, lowercase, number)
   - Check username format and length
   - Validate fullName

2. **Check Uniqueness**
   - Query database for existing email
   - Query database for existing username
   - Return 409 Conflict if duplicate found

3. **Hash Password**
   ```javascript
   const bcrypt = require('bcrypt');
   const saltRounds = 10;
   const hashedPassword = await bcrypt.hash(password, saltRounds);
   ```

4. **Create User**
   - Save user to database with hashed password
   - Return user object (WITHOUT password)

5. **Response**
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

---

### 2. User Login

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│ Client  │                  │  Server │                  │ Database │
└────┬────┘                  └────┬────┘                  └─────┬────┘
     │                            │                              │
     │ POST /auth/login           │                              │
     │ {email, password}          │                              │
     ├───────────────────────────>│                              │
     │                            │                              │
     │                            │ 1. Find user by email       │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │                              │
     │                            │ 2. Compare password hash     │
     │                            │ 3. Check if blocked          │
     │                            │ 4. Generate JWT token        │
     │                            │ 5. Update lastSeen           │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │                              │
     │ 200 OK                     │                              │
     │ {token, user}              │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
     │ Store                      │                              |
     │                            │                              │
```

**Implementation Steps:**

1. **Validate Request**
   - Check email and password presence
   - Validate email format

2. **Find User**
   ```javascript
   const user = await User.findOne({ email: email.toLowerCase() })
     .select('+password'); // Include password field
   ```

3. **Verify Password**
   ```javascript
   const isMatch = await bcrypt.compare(password, user.password);
   if (!isMatch) {
     throw new Error('Invalid credentials');
   }
   ```

4. **Check Account Status**
   ```javascript
   if (user.isBlocked) {
     throw new Error('Account is blocked');
   }
   ```

5. **Generate JWT Token**
   ```javascript
   const jwt = require('jsonwebtoken');
   
   const payload = {
     userId: user._id,
     email: user.email,
     role: user.role
   };
   
   const token = jwt.sign(
     payload,
     process.env.JWT_SECRET,
     { expiresIn: '7d' }
   );
   ```

6. **Update Last Seen**
   ```javascript
   user.lastSeen = new Date();
   await user.save();
   ```

7. **Response**
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

---

### 3. Authenticated Request

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│ Client  │                  │  Server │                  │ Database │
└────┬────┘                  └────┬────┘                  └─────┬────┘
     │                            │                              │
     │ GET /posts                 │                              │
     │ Authorization: Bearer <JWT>│                              │
     ├───────────────────────────>│                              │
     │                            │                              │
     │                            │ 1. Extract token from header│
     │                            │ 2. Verify token signature   │
     │                            │ 3. Check token expiration   │
     │                            │ 4. Extract userId from token│
     │                            │ 5. Attach userId to request │
     │                            │                              │
     │                            │ 6. Execute route handler    │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │                              │
     │ 200 OK                     │                              │
     │ {data: [...]}              │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
```

---

## JWT Token Structure

### Token Format

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc4OTBhYmNkZWYxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MzM5OTUyMDAsImV4cCI6MTczNDYwMDAwMH0.signature
```

### Decoded Token

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "6578901234567890",
  "email": "user@example.com",
  "role": "user",
  "iat": 1733995200,
  "exp": 1734600000
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)
```

### Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User's MongoDB ObjectId |
| `email` | string | User's email address |
| `role` | string | User role ("user" or "admin") |
| `iat` | number | Issued At timestamp |
| `exp` | number | Expiration timestamp |

### Token Generation

```javascript
const jwt = require('jsonwebtoken');

function generateToken(user) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };
  
  const options = {
    expiresIn: '7d' // 7 days
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}
```

### Token Verification

```javascript
const jwt = require('jsonwebtoken');

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    } else if (error.name === 'JsonWebTokenError') {
      return { valid: false, error: 'Invalid token' };
    } else {
      return { valid: false, error: 'Token verification failed' };
    }
  }
}
```

### Client-Side Token Storage

**Storage Location**: localStorage (MVP approach)

**Storage Implementation:**
```javascript
// After successful login
const { token, user } = response.data;

// Store token
localStorage.setItem('authToken', token);

// Store user data (optional, for quick access)
localStorage.setItem('user', JSON.stringify(user));
```

**Token Retrieval:**
```javascript
// Get token for API requests
const token = localStorage.getItem('authToken');

// Include in axios requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Or for individual requests
axios.get('/api/v1/posts', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Token Removal (Logout):**
```javascript
// Clear token and user data
localStorage.removeItem('authToken');
localStorage.removeItem('user');

// Clear axios default headers
delete axios.defaults.headers.common['Authorization'];
```

**Security Considerations:**
- ⚠️ **XSS Vulnerability**: localStorage is accessible by JavaScript, vulnerable to XSS attacks
- ✅ **CORS Protection**: Only accessible from same origin
- ✅ **Simple Implementation**: No cookie configuration needed
- ✅ **Mobile Friendly**: Works well with mobile apps and PWAs

**Future Enhancement (Post-MVP):**
- Consider using memory-only storage for sensitive applications
- Implement token refresh mechanism for longer sessions
- Add biometric authentication for mobile apps

---

## Password Security

### Hashing Strategy

**Algorithm**: bcrypt  
**Salt Rounds**: 10 (good balance of security and performance)

### Password Requirements

**Client-side validation:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Server-side validation:**
```javascript
function validatePassword(password) {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!hasUppercase) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  if (!hasLowercase) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }
  if (!hasNumber) {
    return { valid: false, error: 'Password must contain number' };
  }
  
  return { valid: true };
}
```

### Password Hashing

```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
```

### Password Comparison

```javascript
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

### Pre-save Hook (Mongoose)

```javascript
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
```

---

## Middleware Implementation

### 1. Auth Middleware (checkAuth)

**File**: `middlewares/checkAuth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate user
 * Attaches user object to req.user
 */
async function checkAuth(req, res, next) {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication token is required'
        }
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_EXPIRED',
            message: 'Authentication token has expired'
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        });
      }
    }
    
    // 3. Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // 4. Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_BLOCKED',
          message: 'Your account has been blocked'
        }
      });
    }
    
    // 5. Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    });
  }
}

module.exports = checkAuth;
```

### 2. Optional Auth Middleware

For endpoints that work both authenticated and unauthenticated:

```javascript
/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && !user.isBlocked) {
        req.user = user;
        req.userId = user._id.toString();
      }
    } catch (error) {
      // Invalid token, proceed without auth
      req.user = null;
      req.userId = null;
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = optionalAuth;
```

### 3. Admin Middleware

```javascript
/**
 * Middleware to check if user is admin
 * Must be used after checkAuth middleware
 */
function checkAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      }
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Admin access required'
      }
    });
  }
  
  next();
}

module.exports = checkAdmin;
```

### 4. Moderator Middleware

```javascript
/**
 * Check if user is moderator of a specific community
 * Must be used after checkAuth middleware
 */
async function checkModerator(req, res, next) {
  try {
    const { communityId } = req.params;
    
    // Admins can moderate any community
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is moderator of this community
    const membership = await CommunityMember.findOne({
      user: req.userId,
      community: communityId,
      role: 'moderator'
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Moderator access required'
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = checkModerator;
```

---

## Authorization Levels

### 1. Public (No Auth)

**Endpoints:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`

**Usage:**
```javascript
router.post('/register', authController.register);
```

### 2. Optional Auth

**Endpoints:**
- `GET /posts/:postId`
- `GET /users/:userId`
- `GET /communities/:communityId`
- `GET /search/*`

**Usage:**
```javascript
router.get('/posts/:id', optionalAuth, postController.getPost);
```

**Behavior:**
- If token provided and valid: `req.user` is set
- If no token or invalid: `req.user` is null
- Different data returned based on auth status (e.g., isLiked, isSaved)

### 3. User Auth Required

**Endpoints:**
- Most CRUD operations
- Social interactions (like, follow, comment)
- Messaging
- Profile updates

**Usage:**
```javascript
router.post('/posts', checkAuth, postController.createPost);
router.post('/posts/:id/like', checkAuth, postController.likePost);
```

### 4. Admin Only

**Endpoints:**
- `/admin/*` routes
- User management
- Community creation
- Report management

**Usage:**
```javascript
router.get('/admin/users', checkAuth, checkAdmin, adminController.getUsers);
router.post('/admin/communities', checkAuth, checkAdmin, adminController.createCommunity);
```

### 5. Resource Owner or Admin

For endpoints that require ownership:

```javascript
async function checkPostOwnership(req, res, next) {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }
    
    // Allow if owner or admin
    if (post.author.toString() === req.userId || req.user.role === 'admin') {
      req.post = post; // Attach post to request
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: { code: 'PERMISSION_DENIED', message: 'Not authorized' }
      });
  } catch (error) {
    next(error);
  }
}

// Usage
router.delete('/posts/:postId', checkAuth, checkPostOwnership, postController.deletePost);
```

---

## Password Reset Flow

### 1. Request Password Reset

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│ Client  │                  │  Server │                  │ Database │
└────┬────┘                  └────┬────┘                  └─────┬────┘
     │                            │                              │
     │ POST /auth/password-reset/ │                              │
     │ request {email}            │                              │
     ├───────────────────────────>│                              │
     │                            │                              │
     │                            │ 1. Find user by email       │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │                              │
     │                            │ 2. Generate random token     │
     │                            │ 3. Hash token & save         │
     │                            ├─────────────────────────────>│
     │                            │<─────────────────────────────┤
     │                            │                              │
     │                            │ 4. Send email with token     │
     │                            │    (future enhancement)      │
     │                            │                              │
     │ 200 OK                     │                              │
     │ "Reset link sent"          │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
```

**Implementation:**

```javascript
const crypto = require('crypto');

async function requestPasswordReset(email) {
  // 1. Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  
  // Always return success (prevent email enumeration)
  if (!user) {
    return { success: true };
  }
  
  // 2. Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // 3. Hash and save token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  
  // 4. Send email (MVP: return token in response for testing)
  // TODO: Implement email sending in production
  
  return { 
    success: true,
    token: resetToken // Remove in production
  };
}
```

### 2. Reset Password

```javascript
async function resetPassword(token, newPassword) {
  // 1. Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // 2. Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }
  
  // 3. Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // 4. Update password and clear token
  user.password = newPassword; // Will be hashed by pre-save hook
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  
  return { success: true };
}
```

---

## Security Best Practices

### 1. Environment Variables

**File**: `.env`

```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

**Generation:**
```javascript
// Generate secure JWT secret
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log(secret);
```

### 2. Token Storage (Client-side)

**Options:**

**localStorage** (Simple, recommended for MVP):
```javascript
// Store
localStorage.setItem('token', token);

// Retrieve
const token = localStorage.getItem('token');

// Remove on logout
localStorage.removeItem('token');
```

**httpOnly Cookie** (More secure, future enhancement):
- Prevents XSS attacks
- Requires server to set cookie
- CSRF protection needed

### 3. Rate Limiting

Implement rate limiting on auth endpoints:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again later.'
    }
  }
});

router.post('/login', loginLimiter, authController.login);
```

### 4. Password Policy

- **Never** log passwords
- **Never** return passwords in API responses
- **Always** use select('-password') in queries
- **Always** validate password strength on both client and server

### 5. Token Blacklisting (Future Enhancement)

For logout functionality with token invalidation:

```javascript
// Store token hash in Redis with expiration
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
await redis.setex(`blacklist:${tokenHash}`, 604800, '1'); // 7 days

// Check on auth middleware
const isBlacklisted = await redis.get(`blacklist:${tokenHash}`);
if (isBlacklisted) {
  throw new Error('Token has been revoked');
}
```

*Note: Not implemented in MVP for simplicity*

---

## Error Handling

### Common Auth Errors

| Error Code | HTTP Status | Message | Cause |
|------------|-------------|---------|-------|
| AUTH_TOKEN_MISSING | 401 | Authentication token is required | No Authorization header |
| AUTH_TOKEN_INVALID | 401 | Invalid authentication token | Malformed or tampered token |
| AUTH_TOKEN_EXPIRED | 401 | Authentication token has expired | Token past expiration |
| USER_NOT_FOUND | 401 | User not found | User deleted after token issued |
| USER_BLOCKED | 403 | Your account has been blocked | User blocked by admin |
| PERMISSION_DENIED | 403 | Not authorized | Insufficient permissions |
| INVALID_CREDENTIALS | 401 | Invalid email or password | Wrong login credentials |
| WEAK_PASSWORD | 400 | Password does not meet requirements | Password validation failed |
| EMAIL_EXISTS | 409 | Email already registered | Duplicate email |
| USERNAME_EXISTS | 409 | Username already taken | Duplicate username |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Authentication token has expired",
    "details": {
      "expiredAt": "2025-12-19T10:00:00Z"
    }
  }
}
```

---

## Testing Authentication

### Unit Tests

```javascript
describe('Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPass123';
      const hashed = await hashPassword(password);
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(50);
    });
    
    it('should verify correct password', async () => {
      const password = 'TestPass123';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(password, hashed);
      expect(isMatch).toBe(true);
    });
  });
  
  describe('JWT Token', () => {
    it('should generate valid token', () => {
      const user = { _id: 'userId123', email: 'test@test.com', role: 'user' };
      const token = generateToken(user);
      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3);
    });
    
    it('should verify valid token', () => {
      const user = { _id: 'userId123', email: 'test@test.com', role: 'user' };
      const token = generateToken(user);
      const result = verifyToken(token);
      expect(result.valid).toBe(true);
      expect(result.payload.userId).toBe('userId123');
    });
  });
});
```

### Integration Tests

```javascript
describe('POST /auth/register', () => {
  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@test.com',
        password: 'TestPass123',
        username: 'testuser',
        fullName: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@test.com');
  });
  
  it('should reject duplicate email', async () => {
    // Register first user
    await request(app).post('/api/v1/auth/register').send({
      email: 'test@test.com',
      password: 'TestPass123',
      username: 'testuser',
      fullName: 'Test User'
    });
    
    // Try to register with same email
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'test@test.com',
      password: 'Different123',
      username: 'different',
      fullName: 'Different User'
    });
    
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});
```

---

**End of Authentication & Authorization Specification**
