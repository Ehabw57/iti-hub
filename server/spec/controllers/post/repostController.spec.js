const repost = require('../../../controllers/post/repostController');
const Post = require('../../../models/Post');
const { validateRepostComment } = require('../../../utils/postHelpers');

describe('Repost Controller', () => {
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
      params: { id: 'originalPost123' },
      body: {},
      user: {
        _id: 'user123'
      }
    };
  });

  it('should repost without comment successfully', async () => {
    const mockOriginalPost = {
      _id: 'originalPost123',
      author: {
        toString: () => 'originalUser456'
      },
      repostsCount: 5,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    const mockRepost = {
      _id: 'repost123',
      author: 'user123',
      content: '',
      originalPost: 'originalPost123',
      repostComment: null,
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'repost123',
        author: { _id: 'user123', username: 'testuser' },
        originalPost: mockOriginalPost
      }))
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockOriginalPost));
    spyOn(Post, 'create').and.returnValue(Promise.resolve(mockRepost));

    const res = mockResponse();
    await repost(mockRequest, res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toBeDefined();
    expect(mockOriginalPost.repostsCount).toBe(6);
    expect(mockOriginalPost.save).toHaveBeenCalled();
    expect(Post.create).toHaveBeenCalledWith({
      author: 'user123',
      content: '',
      originalPost: 'originalPost123',
      repostComment: null
    });
  });

  it('should repost with comment successfully', async () => {
    mockRequest.body = { comment: 'Great post!' };

    const mockOriginalPost = {
      _id: 'originalPost123',
      author: {
        toString: () => 'originalUser456'
      },
      repostsCount: 5,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    const mockRepost = {
      _id: 'repost123',
      author: 'user123',
      content: 'Great post!',
      originalPost: 'originalPost123',
      repostComment: 'Great post!',
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'repost123',
        author: { _id: 'user123', username: 'testuser' },
        originalPost: mockOriginalPost,
        repostComment: 'Great post!'
      }))
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockOriginalPost));
    spyOn(Post, 'create').and.returnValue(Promise.resolve(mockRepost));

    const res = mockResponse();
    await repost(mockRequest, res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.success).toBe(true);
    expect(Post.create).toHaveBeenCalledWith({
      author: 'user123',
      content: 'Great post!',
      originalPost: 'originalPost123',
      repostComment: 'Great post!'
    });
  });

  it('should return 404 if original post not found', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await repost(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Original post not found');
  });

  it('should return 400 if repost comment is invalid', async () => {
    mockRequest.body = { comment: 'a'.repeat(501) }; // Exceeds max length of 500

    const mockOriginalPost = {
      _id: 'originalPost123',
      author: {
        toString: () => 'originalUser456'
      }
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockOriginalPost));

    const res = mockResponse();
    await repost(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Repost comment');
  });

  it('should prevent reposting own post', async () => {
    const mockOriginalPost = {
      _id: 'originalPost123',
      author: {
        toString: () => 'user123' // Same as requester
      }
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockOriginalPost));

    const res = mockResponse();
    await repost(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Cannot repost your own post');
  });

  it('should handle database errors', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await repost(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to repost');
  });
});
