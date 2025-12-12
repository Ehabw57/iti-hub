const { login } = require('../../../controllers/auth/loginController');
const User = require('../../../models/User');

describe('Login Controller', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

  let mockResponse;

  beforeEach(() => {
    mockResponse = () => ({
      statusCode: null,
      jsonData: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      }
    });
  });

  it('should return 400 if email is missing', async () => {
    const req = { body: { password: 'Password123' } };
    const res = mockResponse();
    await login(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.message).toMatch(/email.*required/i);
  });

  it('should return 400 if password is missing', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = mockResponse();
    await login(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.message).toMatch(/password.*required/i);
  });

  it('should return 401 if user not found', async () => {
    const req = { body: { email: 'nonexistent@example.com', password: 'Password123' } };
    const res = mockResponse();
    const findOneStub = spyOn(User, 'findOne').and.returnValue({
      select: jasmine.createSpy().and.returnValue(Promise.resolve(null))
    });
    await login(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error.code).toBe('INVALID_CREDENTIALS');
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
    await login(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error.code).toBe('INVALID_CREDENTIALS');
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
    await login(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.error.code).toBe('ACCOUNT_BLOCKED');
    expect(res.jsonData.error.message).toMatch(/blocked/i);
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

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.token).toBe('mockToken123');
    expect(res.jsonData.data.user.email).toBe('test@example.com');
    expect(res.jsonData.data.user.password).toBeUndefined();
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

    await login(req, res);

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

    await login(req, res);

    expect(findOneSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ email: 'test@example.com' })
    );
  });
});
