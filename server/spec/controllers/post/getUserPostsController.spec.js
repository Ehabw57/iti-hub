const getUserPosts = require('../../../controllers/post/getUserPostsController');
const Post = require('../../../models/Post');
const User = require('../../../models/User');

describe('Get User Posts Controller', () => {
  let mockResponse;
  let mockRequest;

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

    mockRequest = {
      params: { userId: 'user123' },
      query: {},
      user: null
    };
  });

  it('should return user posts with default pagination', async () => {
    const mockUser = { _id: 'user123', username: 'testuser' };
    const mockPosts = [
      { _id: 'post1', content: 'Post 1', author: 'user123' },
      { _id: 'post2', content: 'Post 2', author: 'user123' }
    ];

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue({
              populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      })
    };

    spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));
    spyOn(Post, 'find').and.returnValue(mockQuery);
    spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(2));

    const res = mockResponse();
    await getUserPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.posts.length).toBe(2);
    expect(res.jsonData.data.pagination.page).toBe(1);
    expect(res.jsonData.data.pagination.limit).toBe(20);
    expect(res.jsonData.data.pagination.pages).toBe(1);
  });

  it('should return user posts with custom pagination', async () => {
    mockRequest.query = { page: '2', limit: '10' };

    const mockUser = { _id: 'user123', username: 'testuser' };
    const mockPosts = [
      { _id: 'post3', content: 'Post 3', author: 'user123' }
    ];

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue({
              populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      })
    };

    spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));
    spyOn(Post, 'find').and.returnValue(mockQuery);
    spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(15));

    const res = mockResponse();
    await getUserPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.pagination.page).toBe(2);
    expect(res.jsonData.data.pagination.limit).toBe(10);
    expect(res.jsonData.data.pagination.pages).toBe(2);
  });

  it('should include isLiked and isSaved for authenticated user', async () => {
    mockRequest.user = { _id: 'currentUser456' };

    const mockUser = { _id: 'user123', username: 'testuser' };
    const mockPosts = [
      {
        _id: 'post1',
        content: 'Post 1',
        author: 'user123',
        toObject: jasmine.createSpy().and.returnValue({ _id: 'post1', content: 'Post 1' })
      }
    ];

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue({
              populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      })
    };

    spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));
    spyOn(Post, 'find').and.returnValue(mockQuery);
    spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(1));

    const PostLike = require('../../../models/PostLike');
    const PostSave = require('../../../models/PostSave');
    spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like1' }));
    spyOn(PostSave, 'findOne').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getUserPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.data.posts[0].isLiked).toBe(true);
    expect(res.jsonData.data.posts[0].isSaved).toBe(false);
  });

  it('should return 404 if user not found', async () => {
    spyOn(User, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getUserPosts(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('User not found');
  });

  it('should return empty array if user has no posts', async () => {
    const mockUser = { _id: 'user123', username: 'testuser' };

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue({
              populate: jasmine.createSpy().and.returnValue(Promise.resolve([]))
            })
          })
        })
      })
    };

    spyOn(User, 'findById').and.returnValue(Promise.resolve(mockUser));
    spyOn(Post, 'find').and.returnValue(mockQuery);
    spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(0));

    const res = mockResponse();
    await getUserPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.posts.length).toBe(0);
    expect(res.jsonData.data.pagination.pages).toBe(0);
  });

  it('should handle database errors', async () => {
    spyOn(User, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await getUserPosts(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to retrieve user posts');
  });
});
