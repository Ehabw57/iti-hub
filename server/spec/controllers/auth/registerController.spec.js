const { register } = require('../../../controllers/auth/registerController');
const User = require('../../../models/User');
const { APIError } = require('../../../utils/errors');

// The controller signs a JWT on successful registration
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
        error: { code: err.code, message: err.message, details: err.details }
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

describe('Register Controller', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

  it('should return 400 if email is missing', async () => {
    const req = { body: { password: 'Password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 if email format is invalid', async () => {
    const req = { body: { email: 'notanemail', password: 'Password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.email).toMatch(/invalid/i);
  });

  it('should return 400 if password is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Pass1', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.password).toMatch(/at least 8 characters/i);
  });

  it('should return 400 if password lacks lowercase', async () => {
    const req = { body: { email: 'test@example.com', password: 'PASSWORD123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.password).toMatch(/lowercase/i);
  });

  it('should return 400 if password lacks number', async () => {
    const req = { body: { email: 'test@example.com', password: 'PasswordOnly', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.password).toMatch(/number/i);
  });

  it('should return 400 if username is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'ab', fullName: 'Test User' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.username).toMatch(/3.*30 characters/i);
  });

  it('should return 400 if username contains invalid characters', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'test-user!', fullName: 'Test User' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.username).toMatch(/alphanumeric/i);
  });

  it('should return 400 if fullName is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'testuser', fullName: 'T' } };
    const res = mockResponse();

    await invokeController(register, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.details.fields.fullName).toMatch(/at least 2 characters/i);
  });

  it('should return 409 if email already exists', async () => {
    const req = { body: { email: 'existing@example.com', password: 'Password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue(Promise.resolve({ email: 'existing@example.com' }));

    await invokeController(register, req, res);

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

    await invokeController(register, req, res);

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
        const obj = { ...this };
        delete obj.password;
        return obj;
      }
    };
    spyOn(User, 'findOne').and.returnValue(Promise.resolve(null));
    spyOn(User.prototype, 'save').and.returnValue(Promise.resolve(mockUser));

    await invokeController(register, req, res);

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

    await invokeController(register, req, res);

    const savedUser = saveSpy.calls.mostRecent().object;
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.username).toBe('testuser');
  });
});
