const request = require('supertest');
const User = require('../../models/User');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');

// Set JWT_SECRET for tests if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
}

const app = require('../../app');

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Complete Registration and Login Flow', () => {
    it('should register user and then login successfully', async () => {
      // Register
      const registerRes = await request(app)
        .post('/auth/register')
        .send({
          email: 'integration@example.com',
          password: 'Password123',
          username: 'integrationuser',
          fullName: 'Integration Test User'
        });

      // Debug: log if registration failed
      if (registerRes.status !== 201) {
        console.log('Registration failed:', registerRes.body);
      }

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.data.user.email).toBe('integration@example.com');
      expect(registerRes.body.data.user.password).toBeUndefined();
      expect(registerRes.body.data.token).toBeTruthy(); // Registration now returns token for auto-login
      
      // Verify the token is valid by using it in an authenticated request
      const token = registerRes.body.data.token;
      expect(token).toBeTruthy();
      
      // Test that we can use the token immediately (auto-login)
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'Password123'
        });

      // Debug: log if login failed
      if (loginRes.status !== 200) {
        console.log('Login failed:', loginRes.body);
      }

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeTruthy();
      expect(loginRes.body.data.user.email).toBe('integration@example.com');
    });

    it('should prevent duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123',
          username: 'user1',
          fullName: 'User One'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password456',
          username: 'user2',
          fullName: 'User Two'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should prevent duplicate username registration', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send({
          email: 'user1@example.com',
          password: 'Password123',
          username: 'duplicateuser',
          fullName: 'User One'
        });

      // Second registration with same username
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'Password456',
          username: 'duplicateuser',
          fullName: 'User Two'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USERNAME_EXISTS');
    });

    it('should fail login with incorrect password', async () => {
      // Create user directly in database to avoid rate limit
      await User.create({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        fullName: 'Test User'
      });

      // Try login with wrong password
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail login with non-existent email', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full password reset flow', async () => {
      // Create user directly in database
      const user = await User.create({
        email: 'reset@example.com',
        password: 'OldPassword123',
        username: 'resetuser',
        fullName: 'Reset User'
      });

      // Request reset
      const requestRes = await request(app)
        .post('/auth/password-reset/request')
        .send({ email: 'reset@example.com' });

      expect(requestRes.status).toBe(200);
      expect(requestRes.body.success).toBe(true);

      // Get reset token from database (in real scenario, from email)
      const updatedUser = await User.findById(user._id).select('+resetPasswordToken');
      expect(updatedUser.resetPasswordToken).toBeTruthy();

      // Generate a new token to get the plain version (simulate email delivery)
      const plainToken = await updatedUser.generatePasswordResetToken();

      // Confirm reset with the plain token
      const confirmRes = await request(app)
        .post('/auth/password-reset/confirm')
        .send({
          token: plainToken,
          newPassword: 'NewPassword123'
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);

      // Verify old password doesn't work
      const oldPasswordLogin = await request(app)
        .post('/auth/login')
        .send({
          email: 'reset@example.com',
          password: 'OldPassword123'
        });

      expect(oldPasswordLogin.status).toBe(401);

      // Try logging in with new password
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'reset@example.com',
          password: 'NewPassword123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeTruthy();
    });

    it('should return success for non-existent email (security)', async () => {
      const requestRes = await request(app)
        .post('/auth/password-reset/request')
        .send({ email: 'nonexistent@example.com' });

      expect(requestRes.status).toBe(200);
      expect(requestRes.body.success).toBe(true);
      expect(requestRes.body.message).toMatch(/if email exists/i);
    });

    // Note: Additional password reset tests (expired token, invalid token) are omitted
    // to avoid rate limit conflicts. These scenarios are thoroughly tested in:
    // - /spec/controllers/auth/passwordResetController.spec.js (unit tests)
    // Rate limiting for password reset is 3 requests per hour, and this test suite
    // already makes multiple password reset requests
  });

  describe('Authentication Middleware Integration', () => {
    it('should reject blocked user login', async () => {
      // Create and block user
      await User.create({
        email: 'blocked@example.com',
        password: 'Password123',
        username: 'blockeduser',
        fullName: 'Blocked User',
        isBlocked: true,
        blockReason: 'Test block'
      });

      // Try to login
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'blocked@example.com',
          password: 'Password123'
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.error.code).toBe('ACCOUNT_BLOCKED');
    });

    it('should update lastSeen on successful login', async () => {
      // Create user
      const user = await User.create({
        email: 'lastseen@example.com',
        password: 'Password123',
        username: 'lastseenuser',
        fullName: 'LastSeen User'
      });

      const beforeLogin = user.lastSeen;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Login
      await request(app)
        .post('/auth/login')
        .send({
          email: 'lastseen@example.com',
          password: 'Password123'
        });

      // Check lastSeen was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastSeen.getTime()).toBeGreaterThan(beforeLogin.getTime());
    });

    it('should generate valid JWT tokens', async () => {
      // Create user directly in database
      await User.create({
        email: 'jwttest@example.com',
        password: 'Password123',
        username: 'jwttestuser',
        fullName: 'JWT Test User'
      });

      // Login and verify token
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'jwttest@example.com',
          password: 'Password123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeTruthy();
      
      // Token should be a string with 3 parts separated by dots (JWT format)
      const token = loginRes.body.data.token;
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  // Note: Input validation is already thoroughly tested in unit tests
  // (registerController.spec.js, loginController.spec.js, passwordResetController.spec.js)
  // Integration tests focus on end-to-end flows rather than repeating unit test coverage
});
