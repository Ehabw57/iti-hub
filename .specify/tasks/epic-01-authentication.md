# Epic 1: Authentication & Authorization (P0)

**Priority**: P0 (MVP Critical)  
**Estimated Effort**: 7-10 days  
**Dependencies**: None  
**Specifications**: `/docs/specs/Authentication-Specification.md`, `/docs/specs/API-Specification.md`

---

## User Stories

### US1: User Registration
**As a** new user  
**I want to** create an account with email and password  
**So that** I can access the platform  

**Acceptance Criteria:**
- Email must be unique and valid format
- Password must be at least 8 characters with uppercase, lowercase, and number
- Username must be unique, 3-30 characters, alphanumeric + underscore
- Password is hashed using bcrypt before storage
- Returns created user without password field
- Returns appropriate error messages for validation failures

---

### US2: User Login
**As a** registered user  
**I want to** login with my credentials  
**So that** I can access protected features  

**Acceptance Criteria:**
- Accept email and password
- Verify password against bcrypt hash
- Generate JWT token with 7-day expiration
- Return token and user profile
- Update lastSeen timestamp
- Reject blocked accounts

---

### US3: Password Reset Flow
**As a** user who forgot their password  
**I want to** reset my password via email  
**So that** I can regain access to my account  

**Acceptance Criteria:**
- Request endpoint sends reset link to email
- Reset token is hashed and stored with expiration (1 hour)
- Confirm endpoint validates token and sets new password
- Old password is invalidated after reset
- Tokens are single-use only

---

### US4: Authentication Middleware
**As a** developer  
**I want** authentication middleware  
**So that** protected routes verify user identity  

**Acceptance Criteria:**
- `checkAuth`: Requires valid JWT, attaches user to req.user
- `optionalAuth`: Attaches user if token present, allows anonymous
- `checkAdmin`: Requires valid JWT and admin role
- Proper error responses for invalid/expired tokens
- Rate limiting on auth endpoints

---

## Phase 1: Setup (Shared Infrastructure)

### T001: Setup Authentication Dependencies
**Type**: Setup  
**Estimated Effort**: 0.5 days  
**Can Run in Parallel**: Yes

**Target Files:**
- `/server/package.json`

**Description:**
Install required authentication packages if not already present:
- `bcrypt` or `bcryptjs` for password hashing
- `jsonwebtoken` for JWT generation
- `validator` for email validation
- `express-rate-limit` for rate limiting

**Acceptance Criteria:**
- [ ] All packages installed and listed in package.json
- [ ] Server starts without dependency errors

**Command:**
```bash
cd server && npm install bcrypt jsonwebtoken validator express-rate-limit
```

---

## Phase 2: Foundational (Blocking Prerequisites)

### T002: [P] Create/Update User Model with Authentication Fields
**Type**: Model  
**User Story**: Foundation  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/models/User.js`

**Functions to Implement:**

1. **Schema Definition**
   - Input: Mongoose schema definition
   - Output: User model with all authentication fields

2. **`User.prototype.comparePassword(candidatePassword)`**
   - Input: `candidatePassword` (string)
   - Output: Promise<boolean>
   - Description: Compares plain password with hashed password

3. **`User.prototype.generateAuthToken()`**
   - Input: None
   - Output: string (JWT token)
   - Description: Generates JWT with userId, email, role

4. **`User.prototype.generatePasswordResetToken()`**
   - Input: None
   - Output: string (plain token)
   - Description: Generates reset token, hashes and stores it with expiration

5. **Pre-save Hook: Hash Password**
   - Input: User document before save
   - Output: Modified document with hashed password
   - Description: Automatically hash password if modified

**Schema Fields (Authentication Related):**
```javascript
{
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  username: { type: String, required: true, unique: true, lowercase: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String, default: null },
  resetPasswordToken: { type: String, default: null, select: false },
  resetPasswordExpires: { type: Date, default: null },
  lastSeen: { type: Date, default: Date.now }
}
```

**Tests to Pass:**
File: `/server/spec/models/userModel.spec.js`

```javascript
describe('User Model - Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        fullName: 'Test User'
      });
      await user.save();
      expect(user.password).not.toBe('Password123');
      expect(user.password).toMatch(/^\$2[ab]\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        email: 'test2@example.com',
        password: 'Password123',
        username: 'testuser2',
        fullName: 'Test User 2'
      });
      const originalHash = user.password;
      user.fullName = 'Updated Name';
      await user.save();
      expect(user.password).toBe(originalHash);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const user = await User.create({
        email: 'test3@example.com',
        password: 'Password123',
        username: 'testuser3',
        fullName: 'Test User 3'
      });
      const isMatch = await user.comparePassword('Password123');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        email: 'test4@example.com',
        password: 'Password123',
        username: 'testuser4',
        fullName: 'Test User 4'
      });
      const isMatch = await user.comparePassword('WrongPassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('generateAuthToken', () => {
    it('should generate valid JWT token', async () => {
      const user = await User.create({
        email: 'test5@example.com',
        password: 'Password123',
        username: 'testuser5',
        fullName: 'Test User 5'
      });
      const token = user.generateAuthToken();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user._id.toString());
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should include 7-day expiration', async () => {
      const user = await User.create({
        email: 'test6@example.com',
        password: 'Password123',
        username: 'testuser6',
        fullName: 'Test User 6'
      });
      const token = user.generateAuthToken();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate reset token and hash it', async () => {
      const user = await User.create({
        email: 'test7@example.com',
        password: 'Password123',
        username: 'testuser7',
        fullName: 'Test User 7'
      });
      const resetToken = await user.generatePasswordResetToken();
      expect(resetToken).toBeTruthy();
      expect(resetToken.length).toBe(64); // 32 bytes hex string
      expect(user.resetPasswordToken).toBeTruthy();
      expect(user.resetPasswordToken).not.toBe(resetToken); // Should be hashed
      expect(user.resetPasswordExpires).toBeTruthy();
      expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All authentication fields present in schema
- [ ] Password hashing pre-save hook works correctly
- [ ] comparePassword method validates passwords
- [ ] generateAuthToken creates valid JWT
- [ ] generatePasswordResetToken creates and hashes token
- [ ] All tests pass

---

### T003: [P] Create Authentication Middleware
**Type**: Middleware  
**User Story**: US4  
**Estimated Effort**: 1 day  
**Can Run in Parallel**: Yes  
**Priority**: Blocking

**Target File:**
- `/server/middlewares/checkAuth.js`

**Functions to Implement:**

1. **`checkAuth(req, res, next)`**
   - Input: Express request, response, next
   - Output: Calls next() or sends error response
   - Description: Requires valid JWT, attaches user to req.user

2. **`optionalAuth(req, res, next)`**
   - Input: Express request, response, next
   - Output: Calls next() always
   - Description: Attaches user to req.user if token present, allows anonymous

3. **`checkAdmin(req, res, next)`**
   - Input: Express request, response, next
   - Output: Calls next() or sends error response
   - Description: Requires valid JWT and admin role

**Implementation Details:**
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware 1: checkAuth
const checkAuth = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required'
        }
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // 4. Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BLOCKED',
          message: 'Your account has been blocked'
        }
      });
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

// Middleware 2: optionalAuth
const optionalAuth = async (req, res, next) => {
  // Similar to checkAuth but doesn't fail if no token
  // Just continues without attaching user
  next();
};

// Middleware 3: checkAdmin
const checkAdmin = async (req, res, next) => {
  // First run checkAuth logic
  // Then verify role === 'admin'
  next();
};

module.exports = { checkAuth, optionalAuth, checkAdmin };
```

**Tests to Pass:**
File: `/server/spec/middlewares/checkAuth.spec.js`

```javascript
const { checkAuth, optionalAuth, checkAdmin } = require('../../middlewares/checkAuth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const mockResponse = require('../helpers/responseMock');

describe('Authentication Middleware', () => {
  describe('checkAuth', () => {
    it('should return 401 if no token provided', async () => {
      const req = { headers: {} };
      const res = mockResponse();
      const next = jasmine.createSpy('next');

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('NO_TOKEN');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      const req = { headers: { authorization: 'Bearer invalidtoken' } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      const token = jwt.sign({ userId: 'nonexistent' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(null));

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is blocked', async () => {
      const mockUser = { _id: 'user123', isBlocked: true };
      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_BLOCKED');
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach user to req and call next on success', async () => {
      const mockUser = { _id: 'user123', isBlocked: false, email: 'test@example.com' };
      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));

      await checkAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBeUndefined();
    });

    it('should return 401 for expired token', async () => {
      const token = jwt.sign(
        { userId: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next without token', async () => {
      const req = { headers: {} };
      const res = mockResponse();
      const next = jasmine.createSpy('next');

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should attach user if valid token provided', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com' };
      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('checkAdmin', () => {
    it('should return 403 if user is not admin', async () => {
      const mockUser = { _id: 'user123', role: 'user', isBlocked: false };
      const token = jwt.sign({ userId: 'user123' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));

      await checkAdmin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('ADMIN_REQUIRED');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user is admin', async () => {
      const mockUser = { _id: 'admin123', role: 'admin', isBlocked: false };
      const token = jwt.sign({ userId: 'admin123' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));

      await checkAdmin(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });
});
```

**Acceptance Criteria:**
- [ ] checkAuth validates JWT and attaches user
- [ ] checkAuth rejects invalid/expired tokens
- [ ] checkAuth rejects blocked users
- [ ] optionalAuth works with or without token
- [ ] checkAdmin requires admin role
- [ ] All tests pass

---

## Phase 3: User Story 1 - User Registration

### T004: [US1] Implement Registration Controller
**Type**: Controller  
**User Story**: US1  
**Estimated Effort**: 1.5 days  
**Depends On**: T002  
**Priority**: P0

**Target File:**
- `/server/controllers/authController.js`

**Function to Implement:**

**`register(req, res)`**
- **Input**: 
  - `req.body.email` (string)
  - `req.body.password` (string)
  - `req.body.username` (string)
  - `req.body.fullName` (string)
- **Output**: JSON response with user object (201) or error (400/409/500)
- **Description**: Validates input, checks uniqueness, creates user with hashed password

**Implementation Steps:**
1. Validate input (email format, password strength, username format)
2. Check email uniqueness
3. Check username uniqueness
4. Create user (password auto-hashed by model)
5. Return user without password field

**Tests to Pass:**
File: `/server/spec/controllers/authController.spec.js` (extend existing)

```javascript
describe('register', () => {
  it('should return 400 if email is missing', async () => {
    const req = { body: { password: 'Password123', username: 'testuser', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 if email format is invalid', async () => {
    const req = { body: { email: 'notanemail', password: 'Password123', username: 'testuser', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.email).toMatch(/invalid/i);
  });

  it('should return 400 if password is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Pass1', username: 'testuser', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.password).toMatch(/at least 8 characters/i);
  });

  it('should return 400 if password lacks uppercase', async () => {
    const req = { body: { email: 'test@example.com', password: 'password123', username: 'testuser', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.password).toMatch(/uppercase/i);
  });

  it('should return 400 if password lacks lowercase', async () => {
    const req = { body: { email: 'test@example.com', password: 'PASSWORD123', username: 'testuser', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.password).toMatch(/lowercase/i);
  });

  it('should return 400 if password lacks number', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password', username: 'testuser', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.password).toMatch(/number/i);
  });

  it('should return 400 if username is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'ab', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.username).toMatch(/3.*30 characters/i);
  });

  it('should return 400 if username contains invalid characters', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'test-user!', fullName: 'Test' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.username).toMatch(/alphanumeric/i);
  });

  it('should return 400 if fullName is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'testuser', fullName: 'T' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.fullName).toMatch(/at least 2 characters/i);
  });

  it('should return 409 if email already exists', async () => {
    const req = { body: { email: 'existing@example.com', password: 'Password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue(Promise.resolve({ email: 'existing@example.com' }));
    await register(req, res);
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('should return 409 if username already exists', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'existinguser', fullName: 'Test User' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValues(
      Promise.resolve(null), // Email check
      Promise.resolve({ username: 'existinguser' }) // Username check
    );
    await register(req, res);
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_EXISTS');
  });

  it('should create user successfully with valid data', async () => {
    const req = { body: { email: 'new@example.com', password: 'Password123', username: 'newuser', fullName: 'New User' } };
    const res = mockResponse();
    const mockUser = {
      _id: 'user123',
      email: 'new@example.com',
      username: 'newuser',
      fullName: 'New User',
      createdAt: new Date(),
      toObject: function() { 
        const { password, ...rest } = this;
        return rest;
      }
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));
    spyOn(User.prototype, 'save').and.returnValue(Promise.resolve(mockUser));

    await register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('new@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should convert email and username to lowercase', async () => {
    const req = { body: { email: 'TEST@EXAMPLE.COM', password: 'Password123', username: 'TestUser', fullName: 'Test User' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));
    const saveSpy = spyOn(User.prototype, 'save').and.callFake(function() {
      return Promise.resolve(this);
    });

    await register(req, res);

    const savedUser = saveSpy.calls.mostRecent().object;
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.username).toBe('testuser');
  });
});
```

**Acceptance Criteria:**
- [ ] All input validations implemented
- [ ] Email and username uniqueness checked
- [ ] User created with hashed password
- [ ] Response does not include password
- [ ] All validation tests pass
- [ ] All success cases pass

---

## Phase 4: User Story 2 - User Login

### T005: [US2] Implement Login Controller
**Type**: Controller  
**User Story**: US2  
**Estimated Effort**: 1 day  
**Depends On**: T002, T003  
**Priority**: P0

**Target File:**
- `/server/controllers/authController.js`

**Function to Implement:**

**`login(req, res)`**
- **Input**:
  - `req.body.email` (string)
  - `req.body.password` (string)
- **Output**: JSON response with token and user (200) or error (400/401/403/500)
- **Description**: Validates credentials, generates JWT, updates lastSeen

**Implementation Steps:**
1. Validate email and password presence
2. Find user by email (include password field)
3. Verify password using comparePassword method
4. Check if account is blocked
5. Generate JWT token
6. Update lastSeen timestamp
7. Return token and user profile (without password)

**Tests to Pass:**
File: `/server/spec/controllers/authController.spec.js` (extend existing)

```javascript
describe('login', () => {
  it('should return 400 if email is missing', async () => {
    const req = { body: { password: 'Password123' } };
    const res = mockResponse();
    await login(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/email.*required/i);
  });

  it('should return 400 if password is missing', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = mockResponse();
    await login(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/password.*required/i);
  });

  it('should return 401 if user not found', async () => {
    const req = { body: { email: 'nonexistent@example.com', password: 'Password123' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));
    await login(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 if password is incorrect', async () => {
    const req = { body: { email: 'test@example.com', password: 'WrongPassword' } };
    const res = mockResponse();
    const mockUser = {
      comparePassword: jasmine.createSpy().and.returnValue(Promise.resolve(false))
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));
    await login(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 403 if account is blocked', async () => {
    const req = { body: { email: 'blocked@example.com', password: 'Password123' } };
    const res = mockResponse();
    const mockUser = {
      isBlocked: true,
      blockReason: 'Violation of terms',
      comparePassword: jasmine.createSpy().and.returnValue(Promise.resolve(true))
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));
    await login(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_BLOCKED');
    expect(res.body.error.message).toMatch(/blocked/i);
  });

  it('should login successfully with valid credentials', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123' } };
    const res = mockResponse();
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      role: 'user',
      isBlocked: false,
      lastSeen: new Date(),
      comparePassword: jasmine.createSpy().and.returnValue(Promise.resolve(true)),
      generateAuthToken: jasmine.createSpy().and.returnValue('mockToken123'),
      save: jasmine.createSpy().and.returnValue(Promise.resolve(true)),
      toObject: function() {
        const { password, ...rest } = this;
        return rest;
      }
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('mockToken123');
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.password).toBeUndefined();
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should update lastSeen on successful login', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123' } };
    const res = mockResponse();
    const oldDate = new Date('2025-01-01');
    const mockUser = {
      lastSeen: oldDate,
      isBlocked: false,
      comparePassword: jasmine.createSpy().and.returnValue(Promise.resolve(true)),
      generateAuthToken: jasmine.createSpy().and.returnValue('token'),
      save: jasmine.createSpy().and.callFake(function() {
        return Promise.resolve(this);
      }),
      toObject: function() { return this; }
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));

    await login(req, res);

    expect(mockUser.lastSeen.getTime()).toBeGreaterThan(oldDate.getTime());
  });

  it('should be case-insensitive for email', async () => {
    const req = { body: { email: 'TEST@EXAMPLE.COM', password: 'Password123' } };
    const res = mockResponse();
    const findOneSpy = spyOn(User, 'findOne').and.returnValue(Promise.resolve({
      isBlocked: false,
      comparePassword: () => Promise.resolve(true),
      generateAuthToken: () => 'token',
      save: () => Promise.resolve(true),
      toObject: () => ({})
    }));

    await login(req, res);

    expect(findOneSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ email: 'test@example.com' })
    );
  });
});
```

**Acceptance Criteria:**
- [ ] Email and password validated
- [ ] User lookup includes password field
- [ ] Password verification using comparePassword
- [ ] Blocked accounts rejected with 403
- [ ] JWT token generated on success
- [ ] lastSeen timestamp updated
- [ ] All tests pass

---

## Phase 5: User Story 3 - Password Reset

### T006: [US3] Implement Password Reset Request Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 1 day  
**Depends On**: T002  
**Priority**: P0

**Target File:**
- `/server/controllers/authController.js`

**Function to Implement:**

**`requestPasswordReset(req, res)`**
- **Input**: `req.body.email` (string)
- **Output**: JSON response (200) - always success for security
- **Description**: Generates reset token, sends email (or logs for MVP)

**Implementation Steps:**
1. Validate email format
2. Find user by email (silently fail if not found for security)
3. Generate password reset token
4. Save hashed token and expiration to user
5. Send email with reset link (or log for MVP)
6. Always return success message

**Tests to Pass:**
File: `/server/spec/controllers/authController.spec.js`

```javascript
describe('requestPasswordReset', () => {
  it('should return 200 even if email not found (security)', async () => {
    const req = { body: { email: 'nonexistent@example.com' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));

    await requestPasswordReset(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/if email exists/i);
  });

  it('should return 400 if email format invalid', async () => {
    const req = { body: { email: 'notanemail' } };
    const res = mockResponse();

    await requestPasswordReset(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/invalid email/i);
  });

  it('should generate and save reset token for valid user', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = mockResponse();
    const mockUser = {
      email: 'test@example.com',
      generatePasswordResetToken: jasmine.createSpy().and.returnValue('plainToken123'),
      save: jasmine.createSpy().and.returnValue(Promise.resolve(true))
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));

    await requestPasswordReset(req, res);

    expect(mockUser.generatePasswordResetToken).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('should log reset token for MVP (no email service)', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = mockResponse();
    const mockUser = {
      email: 'test@example.com',
      generatePasswordResetToken: jasmine.createSpy().and.returnValue('plainToken123'),
      save: jasmine.createSpy().and.returnValue(Promise.resolve(true))
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));
    spyOn(console, 'log');

    await requestPasswordReset(req, res);

    expect(console.log).toHaveBeenCalledWith(
      jasmine.stringMatching(/reset.*token.*plainToken123/i)
    );
  });
});
```

---

### T007: [US3] Implement Password Reset Confirm Controller
**Type**: Controller  
**User Story**: US3  
**Estimated Effort**: 1 day  
**Depends On**: T002, T006  
**Priority**: P0

**Target File:**
- `/server/controllers/authController.js`

**Function to Implement:**

**`confirmPasswordReset(req, res)`**
- **Input**:
  - `req.body.token` (string) - plain reset token
  - `req.body.newPassword` (string)
- **Output**: JSON response (200) or error (400/401/500)
- **Description**: Validates token, updates password, clears reset token

**Implementation Steps:**
1. Validate new password format
2. Hash the provided token
3. Find user with matching hashed token and non-expired expiration
4. Update password (will be auto-hashed by model)
5. Clear resetPasswordToken and resetPasswordExpires
6. Save user
7. Return success message

**Tests to Pass:**
File: `/server/spec/controllers/authController.spec.js`

```javascript
describe('confirmPasswordReset', () => {
  it('should return 400 if token is missing', async () => {
    const req = { body: { newPassword: 'NewPassword123' } };
    const res = mockResponse();

    await confirmPasswordReset(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/token.*required/i);
  });

  it('should return 400 if newPassword is missing', async () => {
    const req = { body: { token: 'sometoken' } };
    const res = mockResponse();

    await confirmPasswordReset(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/password.*required/i);
  });

  it('should return 400 if newPassword is too weak', async () => {
    const req = { body: { token: 'sometoken', newPassword: 'weak' } };
    const res = mockResponse();

    await confirmPasswordReset(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/password.*8 characters/i);
  });

  it('should return 401 if token is invalid', async () => {
    const req = { body: { token: 'invalidtoken', newPassword: 'NewPassword123' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));

    await confirmPasswordReset(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 401 if token is expired', async () => {
    const req = { body: { token: 'expiredtoken', newPassword: 'NewPassword123' } };
    const res = mockResponse();
    const mockUser = {
      resetPasswordExpires: new Date(Date.now() - 3600000) // 1 hour ago
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));

    await confirmPasswordReset(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('should reset password successfully with valid token', async () => {
    const req = { body: { token: 'validtoken', newPassword: 'NewPassword123' } };
    const res = mockResponse();
    const mockUser = {
      password: 'oldHashedPassword',
      resetPasswordToken: 'hashedToken',
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour from now
      save: jasmine.createSpy().and.returnValue(Promise.resolve(true))
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(mockUser));

    await confirmPasswordReset(req, res);

    expect(mockUser.password).toBe('NewPassword123'); // Will be hashed by pre-save hook
    expect(mockUser.resetPasswordToken).toBeNull();
    expect(mockUser.resetPasswordExpires).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/password.*reset.*success/i);
  });

  it('should hash the token before querying', async () => {
    const req = { body: { token: 'plainToken123', newPassword: 'NewPassword123' } };
    const res = mockResponse();
    const findOneSpy = spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));

    await confirmPasswordReset(req, res);

    const queryArg = findOneSpy.calls.mostRecent().args[0];
    expect(queryArg.resetPasswordToken).not.toBe('plainToken123');
    expect(queryArg.resetPasswordToken.length).toBe(64); // Hashed token
  });
});
```

**Acceptance Criteria:**
- [ ] Token and password validated
- [ ] Token hashed before lookup
- [ ] Expired tokens rejected
- [ ] Password updated and reset fields cleared
- [ ] All tests pass

---

## Phase 6: Routes & Rate Limiting

### T008: Create/Update Authentication Routes
**Type**: Routes  
**User Story**: All  
**Estimated Effort**: 0.5 days  
**Depends On**: T004, T005, T006, T007  
**Priority**: P0

**Target File:**
- `/server/routes/authRoutes.js`

**Routes to Implement:**
```javascript
POST /auth/register
POST /auth/login
POST /auth/password-reset/request
POST /auth/password-reset/confirm
```

**Implementation:**
```javascript
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  requestPasswordReset,
  confirmPasswordReset
} = require('../controllers/authController');

// Rate limiters
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many registration attempts. Please try again later.'
    }
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please try again later.'
    }
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset attempts. Please try again later.'
    }
  }
});

// Routes
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/password-reset/request', passwordResetLimiter, requestPasswordReset);
router.post('/password-reset/confirm', passwordResetLimiter, confirmPasswordReset);

module.exports = router;
```

**Tests to Pass:**
File: `/server/spec/routes/authRoutes.spec.js`

```javascript
const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  it('should mount POST /auth/register', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).not.toBe(404);
  });

  it('should mount POST /auth/login', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).not.toBe(404);
  });

  it('should mount POST /auth/password-reset/request', async () => {
    const res = await request(app).post('/auth/password-reset/request').send({});
    expect(res.status).not.toBe(404);
  });

  it('should mount POST /auth/password-reset/confirm', async () => {
    const res = await request(app).post('/auth/password-reset/confirm').send({});
    expect(res.status).not.toBe(404);
  });

  it('should apply rate limiting to registration', async () => {
    // Make 6 requests (limit is 5)
    for (let i = 0; i < 6; i++) {
      const res = await request(app).post('/auth/register').send({
        email: `test${i}@example.com`,
        password: 'Password123',
        username: `user${i}`,
        fullName: 'Test User'
      });
      
      if (i < 5) {
        expect(res.status).not.toBe(429);
      } else {
        expect(res.status).toBe(429);
        expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
      }
    }
  });
});
```

**Acceptance Criteria:**
- [ ] All routes properly mounted
- [ ] Rate limiting applied to each endpoint
- [ ] Controllers properly connected
- [ ] All route tests pass

---

## Phase 7: Integration & Documentation

### T009: Create Authentication Integration Tests
**Type**: Testing  
**User Story**: All  
**Estimated Effort**: 1 day  
**Depends On**: T004, T005, T006, T007, T008  
**Priority**: P0

**Target File:**
- `/server/spec/integration/auth.integration.spec.js` (new file)

**Description**: End-to-end tests for complete authentication flows

**Tests to Implement:**

```javascript
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { connectDB, closeDB, clearDB } = require('../helpers/DBUtils');

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('Complete Registration and Login Flow', () => {
    it('should register user and then login successfully', async () => {
      // Register
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'integration@example.com',
          password: 'Password123',
          username: 'integrationuser',
          fullName: 'Integration Test User'
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.data.user.email).toBe('integration@example.com');
      expect(registerRes.body.data.user.password).toBeUndefined();

      // Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'Password123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeTruthy();
      expect(loginRes.body.data.user.email).toBe('integration@example.com');
    });

    it('should prevent duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123',
          username: 'user1',
          fullName: 'User One'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password456',
          username: 'user2',
          fullName: 'User Two'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full password reset flow', async () => {
      // Create user
      const user = await User.create({
        email: 'reset@example.com',
        password: 'OldPassword123',
        username: 'resetuser',
        fullName: 'Reset User'
      });

      // Request reset
      const requestRes = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'reset@example.com' });

      expect(requestRes.status).toBe(200);

      // Get reset token from database (in real scenario, from email)
      const updatedUser = await User.findById(user._id).select('+resetPasswordToken');
      expect(updatedUser.resetPasswordToken).toBeTruthy();

      // For testing, we need the plain token (normally sent via email)
      // We'll use the generatePasswordResetToken method's return value
      const plainToken = 'testResetToken123'; // Simulated

      // Confirm reset
      const confirmRes = await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: plainToken,
          newPassword: 'NewPassword123'
        });

      expect(confirmRes.status).toBe(200);

      // Try logging in with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'reset@example.com',
          password: 'NewPassword123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeTruthy();
    });
  });

  describe('Authentication Middleware Integration', () => {
    it('should protect routes with checkAuth middleware', async () => {
      // Try accessing protected route without token
      const res = await request(app)
        .get('/api/v1/users/me')
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('NO_TOKEN');
    });

    it('should allow access with valid token', async () => {
      // Create user and get token
      const user = await User.create({
        email: 'middleware@example.com',
        password: 'Password123',
        username: 'middlewareuser',
        fullName: 'Middleware User'
      });
      const token = user.generateAuthToken();

      // Access protected route with token
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).not.toBe(401);
    });

    it('should reject blocked user even with valid token', async () => {
      // Create and block user
      const user = await User.create({
        email: 'blocked@example.com',
        password: 'Password123',
        username: 'blockeduser',
        fullName: 'Blocked User',
        isBlocked: true,
        blockReason: 'Test block'
      });
      const token = user.generateAuthToken();

      // Try accessing protected route
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_BLOCKED');
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Tests use real database (test environment)
- [ ] Tests cover happy paths and error cases
- [ ] Tests verify complete user journeys

---

### T010: Update API Documentation for Authentication
**Type**: Documentation  
**User Story**: All  
**Estimated Effort**: 0.5 days  
**Depends On**: T008  
**Priority**: P1

**Target Files:**
- `/server/docs/user.yaml` (if auth endpoints documented here)
- Or create `/server/docs/auth.yaml`

**Description**: Add/update OpenAPI documentation for all authentication endpoints

**Documentation to Include:**
- POST /auth/register (201, 400, 409)
- POST /auth/login (200, 400, 401, 403)
- POST /auth/password-reset/request (200, 400)
- POST /auth/password-reset/confirm (200, 400, 401)
- Security schemes (JWT Bearer token)
- Request/response schemas
- Error response examples

**Acceptance Criteria:**
- [ ] All auth endpoints documented in OpenAPI format
- [ ] Request body schemas defined
- [ ] Response schemas for success and errors
- [ ] Security requirements specified
- [ ] Documentation renders correctly in Swagger UI

---

## Summary

**Total Tasks**: 10  
**Estimated Total Effort**: 7-10 days  
**Blockers**: T002, T003 must complete before other tasks  

**Task Dependencies Graph:**
```
T001 (Setup) ─┐
              ├─> T002 (User Model) ─┬─> T004 (Register) ─┐
              │                       ├─> T005 (Login) ────┤
              │                       └─> T006 (Reset Req) ┴─> T007 (Reset Confirm) ─┐
              │                                                                        │
              └─> T003 (Middleware) ─────────────────────────────────────────────────┤
                                                                                       │
                                                           T008 (Routes) <─────────────┤
                                                                 │                     │
                                                                 ├─> T009 (Integration)│
                                                                 │                     │
                                                                 └─> T010 (Docs) ──────┘
```

**Parallel Execution Opportunities:**
- T001, T002, T003 can all start simultaneously
- T004, T005, T006 can run in parallel after T002 completes
- T009 and T010 can run in parallel after T008

**Definition of Done for Epic:**
- [ ] All 10 tasks completed
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code reviewed and approved
- [ ] API documentation complete
- [ ] Manual testing of all flows successful
- [ ] Rate limiting verified
- [ ] Security audit completed
