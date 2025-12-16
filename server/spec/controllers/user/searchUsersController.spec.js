const searchUsers = require('../../../controllers/user/searchUsersController');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');

describe('searchUsers Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      user: null
    };
    res = {
      status: jasmine.createSpy('status').and.callFake(function() {
        return this;
      }),
      json: jasmine.createSpy('json')
    };
  });

  describe('Query Validation', () => {
    it('should return 400 if query is missing', async () => {
      req.query = {};

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: jasmine.stringContaining('required')
      });
    });

    it('should return 400 if query is too short', async () => {
      req.query = { q: 'a' };

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: jasmine.stringContaining('at least 2 characters')
      });
    });

    it('should return 400 if query is empty string', async () => {
      req.query = { q: '  ' };

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: jasmine.stringMatching(/empty|required/i)
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search users by username', async () => {
      req.query = { q: 'john' };

      const mockUsers = [
        {
          _id: 'user1',
          username: 'johndoe',
          fullName: 'John Doe',
          followersCount: 10,
          toObject: function() { return this; }
        }
      ];

      spyOn(User, 'find').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          collation: jasmine.createSpy('collation').and.returnValue({
            sort: jasmine.createSpy('sort').and.returnValue({
              skip: jasmine.createSpy('skip').and.returnValue({
                limit: jasmine.createSpy('limit').and.returnValue(Promise.resolve(mockUsers))
              })
            })
          })
        })
      });

      spyOn(User, 'countDocuments').and.returnValue(Promise.resolve(1));

      await searchUsers(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        users: jasmine.any(Array),
        pagination: jasmine.objectContaining({
          page: 1,
          limit: 20,
          total: 1
        })
      });
    });

    it('should filter by specialization', async () => {
      req.query = { q: 'test', specialization: 'Web Development' };

      spyOn(User, 'find').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          collation: jasmine.createSpy('collation').and.returnValue({
            sort: jasmine.createSpy('sort').and.returnValue({
              skip: jasmine.createSpy('skip').and.returnValue({
                limit: jasmine.createSpy('limit').and.returnValue(Promise.resolve([]))
              })
            })
          })
        })
      });

      spyOn(User, 'countDocuments').and.returnValue(Promise.resolve(0));

      await searchUsers(req, res);

      const findCall = User.find.calls.argsFor(0)[0];
      expect(findCall.specialization).toBe('Web Development');
      expect(findCall.$text).toEqual({ $search: 'test' });
    });

    it('should return empty array if no results', async () => {
      req.query = { q: 'nonexistent' };

      spyOn(User, 'find').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          collation: jasmine.createSpy('collation').and.returnValue({
            sort: jasmine.createSpy('sort').and.returnValue({
              skip: jasmine.createSpy('skip').and.returnValue({
                limit: jasmine.createSpy('limit').and.returnValue(Promise.resolve([]))
              })
            })
          })
        })
      });

      spyOn(User, 'countDocuments').and.returnValue(Promise.resolve(0));

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        users: [],
        pagination: jasmine.objectContaining({
          total: 0,
          pages: 0
        })
      });
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      req.query = { q: 'test', page: '2', limit: '10' };

      spyOn(User, 'find').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          collation: jasmine.createSpy('collation').and.returnValue({
            sort: jasmine.createSpy('sort').and.returnValue({
              skip: jasmine.createSpy('skip').and.returnValue({
                limit: jasmine.createSpy('limit').and.returnValue(Promise.resolve([]))
              })
            })
          })
        })
      });

      spyOn(User, 'countDocuments').and.returnValue(Promise.resolve(25));

      await searchUsers(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        users: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          pages: 3
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      req.query = { q: 'test' };

      spyOn(User, 'find').and.throwError('Database error');

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });
});
