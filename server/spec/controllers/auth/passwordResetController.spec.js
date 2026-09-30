const User = require('../../../models/User');
const {
  requestPasswordReset,
  confirmPasswordReset
} = require('../../../controllers/auth/passwordResetController');
const { APIError } = require('../../../utils/errors');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../../helpers/DBUtils');

/**
 * Invoke an asyncHandler-wrapped controller the same way Express would:
 * pass a `next` that captures the error and format it exactly like the
 * global error handler does, so `res.body` matches real HTTP responses.
 */
async function invokeController(controller, req, res) {
  const next = (err) => {
    if (err instanceof APIError && err.isOperational) {
      res.statusCode = err.statusCode;
      res.body = {
        success: false,
        error: { code: err.code, message: err.message }
      };
    } else {
      res.statusCode = 500;
      res.body = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
      };
    }
  };

  await controller(req, res, next);
}

/**
 * Create a mock response that captures status + body.
 */
function mockResponse() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (obj) {
    this.body = obj;
    return this;
  };
  res.send = function (data) {
    this.body = data;
    return this;
  };
  return res;
}

describe('Password Reset Controller', () => {
  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  // ===== T006: requestPasswordReset Tests =====
  describe('requestPasswordReset', () => {
    it('should return 400 if email format invalid', async () => {
      const req = { body: { email: 'notanemail' } };
      const res = mockResponse();

      await invokeController(requestPasswordReset, req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('INVALID_EMAIL');
      expect(res.body.error.message).toMatch(/invalid email/i);
    });

    it('should return 400 if email is missing', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await invokeController(requestPasswordReset, req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('INVALID_EMAIL');
    });

    it('should return 200 even if email not found (security)', async () => {
      const req = { body: { email: 'nonexistent@example.com' } };
      const res = mockResponse();

      await invokeController(requestPasswordReset, req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/if email exists/i);
    });

    it('should generate and save reset token for valid user', async () => {
      // Create test user
      const user = await User.create({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        fullName: 'Test User'
      });

      const req = { body: { email: 'test@example.com' } };
      const res = mockResponse();

      await invokeController(requestPasswordReset, req, res);

      // Reload user from database
      const updatedUser = await User.findById(user._id).select('+resetPasswordToken');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updatedUser.resetPasswordToken).toBeTruthy();
      expect(updatedUser.resetPasswordExpires).toBeTruthy();
      expect(updatedUser.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle email case-insensitively', async () => {
      // Create test user with lowercase email
      await User.create({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        fullName: 'Test User'
      });

      const req = { body: { email: 'TEST@EXAMPLE.COM' } };
      const res = mockResponse();

      await invokeController(requestPasswordReset, req, res);

      expect(res.statusCode).toBe(200);

      // Verify token was actually generated
      const user = await User.findOne({ email: 'test@example.com' }).select('+resetPasswordToken');
      expect(user.resetPasswordToken).toBeTruthy();
    });

    it('should build the reset link from FRONTEND_BASE_URL', async () => {
      await User.create({
        email: 'link@example.com',
        password: 'Password123',
        username: 'linkuser',
        fullName: 'Link User'
      });

      // The controller binds `sendEmail` at module-load time, so capturing the
      // outgoing link requires (a) replacing the cached sendEmail exports and
      // (b) freshly re-requiring the controller so its const binds to the
      // stub. Everything is restored in `finally`.
      const sendEmailPath = require.resolve('../../../utils/sendEmail');
      const controllerPath = require.resolve('../../../controllers/auth/passwordResetController');
      const originalSendEmail = require.cache[sendEmailPath].exports;
      const links = [];
      require.cache[sendEmailPath].exports = (opts) => {
        const match = String(opts.html || '').match(/https?:\/\/[^"'\s<]+token=[a-f0-9]+/);
        if (match) links.push(match[0]);
        return Promise.resolve({ id: 'test' });
      };
      delete require.cache[controllerPath];
      const { requestPasswordReset: stubbedRequest } = require(controllerPath);

      try {
        const req = { body: { email: 'link@example.com' } };
        const res = mockResponse();
        process.env.FRONTEND_BASE_URL = 'https://app.example.com';

        await invokeController(stubbedRequest, req, res);

        expect(res.statusCode).toBe(200);
        expect(links.length).toBe(1);
        expect(links[0]).toMatch(/^https:\/\/app\.example\.com\/password-reset\/confirm\?token=/);
      } finally {
        process.env.FRONTEND_BASE_URL = 'http://localhost:5173';
        require.cache[sendEmailPath].exports = originalSendEmail;
        // Purge the stub-bound controller and reload a clean instance (bound
        // to the real sendEmail) so later spec files get the original behavior.
        delete require.cache[controllerPath];
        require(controllerPath);
      }
    });
  });

  // ===== T007: confirmPasswordReset Tests =====
  describe('confirmPasswordReset', () => {
    it('should return 400 if token is missing', async () => {
      const req = { body: { newPassword: 'NewPassword123' } };
      const res = mockResponse();

      await invokeController(confirmPasswordReset, req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('MISSING_TOKEN');
      expect(res.body.error.message).toMatch(/token.*required/i);
    });

    it('should return 400 if newPassword is missing', async () => {
      const req = { body: { token: 'sometoken' } };
      const res = mockResponse();

      await invokeController(confirmPasswordReset, req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('MISSING_PASSWORD');
      expect(res.body.error.message).toMatch(/password.*required/i);
    });

    it('should return 400 if newPassword is too weak', async () => {
      const req = { body: { token: 'sometoken', newPassword: 'weak' } };
      const res = mockResponse();

      await invokeController(confirmPasswordReset, req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('WEAK_PASSWORD');
      expect(res.body.error.message).toMatch(/8 characters/i);
    });

    it('should return 401 if token is invalid', async () => {
      const req = { body: { token: 'invalidtoken123', newPassword: 'NewPassword123' } };
      const res = mockResponse();

      await invokeController(confirmPasswordReset, req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
    });

    it('should return 401 if token is expired', async () => {
      // Create user with expired reset token
      const user = await User.create({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
        fullName: 'Test User'
      });

      // Generate token and manually set it to expired
      const plainToken = await user.generatePasswordResetToken();

      // Reload user and update expiration
      const updatedUser = await User.findById(user._id);
      updatedUser.resetPasswordExpires = new Date(Date.now() - 3600000); // 1 hour ago
      await updatedUser.save();

      const req = { body: { token: plainToken, newPassword: 'NewPassword123' } };
      const res = mockResponse();

      await invokeController(confirmPasswordReset, req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('RESET_TOKEN_EXPIRED');
    });

    it('should reset password successfully with valid token', async () => {
      // Create user and generate reset token
      const user = await User.create({
        email: 'test@example.com',
        password: 'OldPassword123',
        username: 'testuser',
        fullName: 'Test User'
      });

      const plainToken = await user.generatePasswordResetToken();

      const req = { body: { token: plainToken, newPassword: 'NewPassword123' } };
      const res = mockResponse();

      await invokeController(confirmPasswordReset, req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/password reset successful/i);

      // Verify password was updated and reset fields cleared
      const updatedUser = await User.findById(user._id).select('+resetPasswordToken +password');
      expect(updatedUser.resetPasswordToken).toBeNull();
      expect(updatedUser.resetPasswordExpires).toBeNull();

      // Verify new password works
      const passwordMatches = await updatedUser.comparePassword('NewPassword123');
      expect(passwordMatches).toBe(true);

      // Verify old password doesn't work
      const oldPasswordMatches = await updatedUser.comparePassword('OldPassword123');
      expect(oldPasswordMatches).toBe(false);
    });

    it('should reject reuse of the same token (single-use tokens)', async () => {
      // Create user and generate reset token
      const user = await User.create({
        email: 'reuse@example.com',
        password: 'OldPassword123',
        username: 'reuseuser',
        fullName: 'Reuse User'
      });

      const plainToken = await user.generatePasswordResetToken();

      // First use - must succeed
      const firstReq = { body: { token: plainToken, newPassword: 'NewPassword123' } };
      const firstRes = mockResponse();
      await invokeController(confirmPasswordReset, firstReq, firstRes);
      expect(firstRes.statusCode).toBe(200);

      // Second use of the SAME token - must fail
      const secondReq = { body: { token: plainToken, newPassword: 'AnotherPassword123' } };
      const secondRes = mockResponse();
      await invokeController(confirmPasswordReset, secondReq, secondRes);

      expect(secondRes.statusCode).toBe(401);
      expect(secondRes.body.error.code).toBe('INVALID_RESET_TOKEN');
    });

    it('should accept the client body key `password` as well as `newPassword`', async () => {
      const user = await User.create({
        email: 'clientkey@example.com',
        password: 'OldPassword123',
        username: 'clientkey',
        fullName: 'Client Key User'
      });

      const plainToken = await user.generatePasswordResetToken();

      // This mirrors exactly what the React client sends: { token, password }
      const req = { body: { token: plainToken, password: 'NewPassword123' } };
      const res = mockResponse();

      await invokeController(confirmPasswordReset, req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(user._id).select('+password');
      expect(await updatedUser.comparePassword('NewPassword123')).toBe(true);
    });

    it('should hash the token before querying', async () => {
      const req = { body: { token: 'plainToken123', newPassword: 'NewPassword123' } };
      const res = mockResponse();

      const findOneSpy = spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));

      await invokeController(confirmPasswordReset, req, res);

      const queryArg = findOneSpy.calls.mostRecent().args[0];
      expect(queryArg.resetPasswordToken).not.toBe('plainToken123');
      expect(queryArg.resetPasswordToken.length).toBe(64); // SHA256 hex is 64 chars
    });

    it('should handle password reset flow end-to-end', async () => {
      // 1. Create user
      const user = await User.create({
        email: 'reset@example.com',
        password: 'OldPassword123',
        username: 'resetuser',
        fullName: 'Reset User'
      });

      // 2. Request password reset
      const requestReq = { body: { email: 'reset@example.com' } };
      const requestRes = mockResponse();
      await invokeController(requestPasswordReset, requestReq, requestRes);
      expect(requestRes.statusCode).toBe(200);

      // 3. Get the token (in real scenario, from email)
      const updatedUser = await User.findById(user._id).select('+resetPasswordToken');
      expect(updatedUser.resetPasswordToken).toBeTruthy();

      // We need the plain token - in real app it would be in the email
      // For testing, we'll generate a new one to get the plain version
      const plainToken = await updatedUser.generatePasswordResetToken();

      // 4. Confirm password reset with token
      const confirmReq = { body: { token: plainToken, newPassword: 'NewPassword123' } };
      const confirmRes = mockResponse();
      await invokeController(confirmPasswordReset, confirmReq, confirmRes);
      expect(confirmRes.statusCode).toBe(200);

      // 5. Verify can login with new password
      const finalUser = await User.findById(user._id).select('+password');
      const canLogin = await finalUser.comparePassword('NewPassword123');
      expect(canLogin).toBe(true);
    });
  });
});