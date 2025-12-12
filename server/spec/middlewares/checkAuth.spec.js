const { checkAuth, optionalAuth, authorize } = require('../../middlewares/checkAuth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  
  let mockUser;
  let mockToken;
  
  beforeEach(() => {
    // Setup JWT secret for tests
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    
    // Mock user
    mockUser = {
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      isBlocked: false
    };
    
    // Generate valid token
    mockToken = jwt.sign(
      { userId: mockUser._id, email: mockUser.email, role: mockUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('checkAuth', () => {
    it('should return 401 if no token provided', async () => {
      const req = { headers: {} };
      const res = {
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
      };
      const next = jasmine.createSpy('next');

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error.code).toBe('NO_TOKEN');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      const req = { headers: { authorization: 'Bearer invalidtoken' } };
      const res = {
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
      };
      const next = jasmine.createSpy('next');

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error.code).toBe('INVALID_TOKEN');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      const req = { headers: { authorization: `Bearer ${mockToken}` } };
      const res = {
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
      };
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(null));

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error.code).toBe('USER_NOT_FOUND');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is blocked', async () => {
      const blockedUser = { ...mockUser, isBlocked: true };
      const req = { headers: { authorization: `Bearer ${mockToken}` } };
      const res = {
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
      };
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(blockedUser));

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData.error.code).toBe('ACCOUNT_BLOCKED');
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach user to req and call next on success', async () => {
      const req = { headers: { authorization: `Bearer ${mockToken}` } };
      const res = {
        status: function() { return this; },
        json: function() { return this; }
      };
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));

      await checkAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = {
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
      };
      const next = jasmine.createSpy('next');

      await checkAuth(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error.code).toBe('TOKEN_EXPIRED');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next without token', async () => {
      const req = { headers: {} };
      const res = {};
      const next = jasmine.createSpy('next');

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should attach user if valid token provided', async () => {
      const req = { headers: { authorization: `Bearer ${mockToken}` } };
      const res = {};
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should call next without attaching user if token is invalid', async () => {
      const req = { headers: { authorization: 'Bearer invalidtoken' } };
      const res = {};
      const next = jasmine.createSpy('next');

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should not attach blocked user', async () => {
      const blockedUser = { ...mockUser, isBlocked: true };
      const req = { headers: { authorization: `Bearer ${mockToken}` } };
      const res = {};
      const next = jasmine.createSpy('next');
      spyOn(User, 'findById').and.returnValue(Promise.resolve(blockedUser));

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe('authorize', () => {
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

    it('should return 401 if user not authenticated', () => {
      const req = {}; // No req.user
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error.code).toBe('NOT_AUTHENTICATED');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role not in allowed roles', () => {
      const req = { user: { _id: 'user123', role: 'user' } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      const middleware = authorize('admin', 'moderator');

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user has admin role', () => {
      const req = { user: { _id: 'admin123', role: 'admin' } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBeNull();
    });

    it('should call next if user has one of multiple allowed roles', () => {
      const req = { user: { _id: 'mod123', role: 'moderator' } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      const middleware = authorize('admin', 'moderator', 'editor');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should work with single role', () => {
      const req = { user: { _id: 'user123', role: 'user' } };
      const res = mockResponse();
      const next = jasmine.createSpy('next');
      const middleware = authorize('user');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
