const User = require('../../../models/User');
const { googleAuth } = require('../../../controllers/auth/googleAuthController');
const googleAuthUtil = require('../../../utils/googleAuth');
const { APIError } = require('../../../utils/errors');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../../helpers/DBUtils');

// The controller issues the app's normal JWT on success
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}

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

/** Build a GoogleAuthError-like rejection (mirrors utils/googleAuth.js). */
function googleError(message, code) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = 401;
  err.isOperational = true;
  return err;
}

describe('Google Auth Controller', () => {
  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('input validation', () => {
    it('should return 400 if idToken is missing', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('MISSING_GOOGLE_TOKEN');
    });
  });

  describe('ID token verification failures', () => {
    it('should return 401 if Google rejects the ID token', async () => {
      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.rejectWith(
        googleError('Invalid Google ID token', 'INVALID_GOOGLE_TOKEN')
      );

      const req = { body: { idToken: 'bad-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('INVALID_GOOGLE_TOKEN');
    });

    it('should return 401 when the Google email is not verified', async () => {
      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.rejectWith(
        googleError('Your Google account email is not verified', 'GOOGLE_EMAIL_NOT_VERIFIED')
      );

      const req = { body: { idToken: 'some-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.error.code).toBe('GOOGLE_EMAIL_NOT_VERIFIED');
    });

    it('should return 500 GOOGLE_NOT_CONFIGURED when GOOGLE_CLIENT_ID is missing', async () => {
      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.rejectWith(
        googleError(
          'Google sign-in is not configured (GOOGLE_CLIENT_ID missing)',
          'GOOGLE_NOT_CONFIGURED'
        )
      );

      const req = { body: { idToken: 'some-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe('GOOGLE_NOT_CONFIGURED');
    });

    it('should return 500 GOOGLE_UNREACHABLE when Google cannot be reached', async () => {
      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.rejectWith(
        googleError('Unable to reach Google to verify the sign-in', 'GOOGLE_UNREACHABLE')
      );

      const req = { body: { idToken: 'some-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe('GOOGLE_UNREACHABLE');
    });
  });

  describe('account linking and creation (real DB)', () => {
    const profile = {
      sub: 'google-sub-123',
      email: 'googler@example.com',
      name: 'Google User',
      picture: 'https://lh3.googleusercontent.com/photo.png',
    };

    it('should sign in an existing user matched by googleId', async () => {
      await User.create({
        email: 'googler@example.com',
        username: 'googler',
        password: 'Password123',
        fullName: 'Google User',
        googleId: 'google-sub-123',
      });

      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.resolveTo(profile);

      const req = { body: { idToken: 'valid-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.email).toBe('googler@example.com');
      // Not a new link — this account was already connected to Google
      expect(res.body.data.linkedToExisting).toBe(false);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.googleId).toBeUndefined();
    });

    it('should link by email and flag linkedToExisting', async () => {
      // Pre-existing password-based account with the same email
      await User.create({
        email: 'googler@example.com',
        username: 'googler',
        password: 'Password123',
        fullName: 'Password User',
      });

      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.resolveTo(profile);

      const req = { body: { idToken: 'valid-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.linkedToExisting).toBe(true);
      expect(res.body.message).toMatch(/linked to your existing account/i);

      // The Google identity must be persisted on the existing account
      const updated = await User.findOne({ email: 'googler@example.com' }).select('+googleId +password');
      expect(updated.googleId).toBe('google-sub-123');
      // Google verified the email for us
      expect(updated.isEmailVerified).toBe(true);
      // The original password login must keep working after linking
      expect(await updated.comparePassword('Password123')).toBe(true);
    });

    it('should return 403 if the matched account is blocked', async () => {
      await User.create({
        email: 'blocked@example.com',
        username: 'blockeduser',
        password: 'Password123',
        fullName: 'Blocked User',
        isBlocked: true,
        blockReason: 'Terms violation',
      });

      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.resolveTo({
        ...profile,
        email: 'blocked@example.com',
      });

      const req = { body: { idToken: 'valid-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_BLOCKED');
      expect(res.body.error.message).toMatch(/blocked/i);
    });

    it('should create a new account for an unknown email', async () => {
      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.resolveTo(profile);

      const req = { body: { idToken: 'valid-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.linkedToExisting).toBe(false);
      expect(res.body.message).toMatch(/signed in with google/i);
      expect(res.body.data.token).toBeTruthy();

      // New account persisted with a username derived from the email local part
      const created = await User.findOne({ email: 'googler@example.com' }).select('+googleId +password');
      expect(created).toBeTruthy();
      expect(created.googleId).toBe('google-sub-123');
      expect(created.username).toMatch(/^googler/);
      expect(created.isEmailVerified).toBe(true);
      // Password is random but stored hashed — account signs in via Google
      expect(created.password).toBeTruthy();
      expect(created.password).toMatch(/^\$2[ab]\$/);

      // Sensitive fields must not leak in the response
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.googleId).toBeUndefined();
    });

    it('should derive a unique username when the base is taken', async () => {
      // Someone already owns the username this email would map to
      await User.create({
        email: 'other@example.com',
        username: 'taken',
        password: 'Password123',
        fullName: 'Taken User',
      });

      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.resolveTo({
        ...profile,
        email: 'taken@example.com',
        name: 'Late User',
      });

      const req = { body: { idToken: 'valid-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(200);

      // buildUniqueUsername appended a random suffix, not a duplicate
      const created = await User.findOne({ email: 'taken@example.com' });
      expect(created).toBeTruthy();
      expect(created.username).not.toBe('taken');
      expect(created.username).toMatch(/^taken_\d{4}$/);
    });

    it('should sanitize unusable email local parts into valid usernames', async () => {
      // `++@example.com` → local part strips to nothing usable → fallback base
      spyOn(googleAuthUtil, 'verifyGoogleIdToken').and.resolveTo({
        ...profile,
        email: '++@example.com',
      });

      const req = { body: { idToken: 'valid-token' } };
      const res = mockResponse();

      await invokeController(googleAuth, req, res);

      expect(res.statusCode).toBe(200);
      const created = await User.findOne({ email: '++@example.com' });
      expect(created).toBeTruthy();
      expect(created.username).toMatch(/^[a-z0-9_]{3,30}$/); // schema-legal username
    });
  });
});

