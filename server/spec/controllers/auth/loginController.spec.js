const { login } = require('../../../controllers/auth/loginController');
const User = require('../../../models/User');
const { APIError } = require('../../../utils/errors');

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

describe('Login Controller', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

  it('should return 400 if email is missing', async () => {
    const req = { body: { password: 'Password123' } };
    const res = mockResponse();

    await invokeController(login, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/email.*required/i);
  });

  it('should return 400 if password is missing', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = mockResponse();

    await invokeController(login, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/password.*required/i);
  });

  it('should return 401 if user not found', async () => {
    const req = { body: { email: 'nonexistent@example.com', password: 'Password123' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue({
      select: jasmine.createSpy().and.returnValue(Promise.resolve(null))
    });

    await invokeController(login, req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 if password is incorrect', async () => {
    const req = { body: { email: 'test@example.com', password: 'WrongPassword' } };
    const res = mockResponse();
    const mockUser = {
      comparePassword: jasmine.createSpy().and.returnValue(Promise.resolve(false))
    };
    spyOn(User, 'findOne').and.returnValue({
      select: jasmine.createSpy().and.returnValue(Promise.resolve(mockUser))
    });

    await invokeController(login, req, res);

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
    spyOn(User, 'findOne').and.returnValue({
      select: jasmine.createSpy().and.returnValue(Promise.resolve(mockUser))
    });

    await invokeController(login, req, res);

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
        const obj = { ...this };
        delete obj.password;
        return obj;
      }
    };
    spyOn(User, 'findOne').and.returnValue({
      select: jasmine.createSpy().and.returnValue(Promise.resolve(mockUser))
    });

    await invokeController(login, req, res);

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
      toObject: function() { return { ...this }; }
    };
    spyOn(User, 'findOne').and.returnValue({
      select: jasmine.createSpy().and.returnValue(Promise.resolve(mockUser))
    });

    await invokeController(login, req, res);

    expect(mockUser.lastSeen.getTime()).toBeGreaterThan(oldDate.getTime());
  });

  it('should be case-insensitive for email', async () => {
    const req = { body: { email: 'TEST@EXAMPLE.COM', password: 'Password123' } };
    const res = mockResponse();
    const findOneSpy = spyOn(User, 'findOne').and.returnValue({
      select: jasmine.createSpy().and.returnValue(Promise.resolve({
        isBlocked: false,
        comparePassword: () => Promise.resolve(true),
        generateAuthToken: () => 'token',
        save: () => Promise.resolve(true),
        toObject: () => ({})
      }))
    });

    await invokeController(login, req, res);

    expect(findOneSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ email: 'test@example.com' })
    );
  });
});
