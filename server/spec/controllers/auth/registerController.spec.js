const { register } = require('../../../controllers/auth/registerController');
const User = require('../../../models/User');

describe('Register Controller', () => {
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
    const req = { body: { password: 'Password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 if email format is invalid', async () => {
    const req = { body: { email: 'notanemail', password: 'Password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.email).toMatch(/invalid/i);
  });

  it('should return 400 if password is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Pass1', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.password).toMatch(/at least 8 characters/i);
  });

  it('should return 400 if password lacks uppercase', async () => {
    const req = { body: { email: 'test@example.com', password: 'password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.password).toMatch(/uppercase/i);
  });

  it('should return 400 if password lacks lowercase', async () => {
    const req = { body: { email: 'test@example.com', password: 'PASSWORD123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.password).toMatch(/lowercase/i);
  });

  it('should return 400 if password lacks number', async () => {
    const req = { body: { email: 'test@example.com', password: 'PasswordOnly', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.password).toMatch(/number/i);
  });

  it('should return 400 if username is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'ab', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.username).toMatch(/3.*30 characters/i);
  });

  it('should return 400 if username contains invalid characters', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'test-user!', fullName: 'Test User' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.username).toMatch(/alphanumeric/i);
  });

  it('should return 400 if fullName is too short', async () => {
    const req = { body: { email: 'test@example.com', password: 'Password123', username: 'testuser', fullName: 'T' } };
    const res = mockResponse();
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error.details.fields.fullName).toMatch(/at least 2 characters/i);
  });

  it('should return 409 if email already exists', async () => {
    const req = { body: { email: 'existing@example.com', password: 'Password123', username: 'testuser', fullName: 'Test User' } };
    const res = mockResponse();
    spyOn(User, 'findOne').and.returnValue(Promise.resolve({ email: 'existing@example.com' }));
    await register(req, res);
    expect(res.statusCode).toBe(409);
    expect(res.jsonData.error.code).toBe('EMAIL_EXISTS');
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
    expect(res.jsonData.error.code).toBe('USERNAME_EXISTS');
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

    await register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.user.email).toBe('new@example.com');
    expect(res.jsonData.data.user.password).toBeUndefined();
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
