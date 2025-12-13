const getPost = require('../../../controllers/post/getPostController');
const Post = require('../../../models/Post');
const PostLike = require('../../../models/PostLike');
const PostSave = require('../../../models/PostSave');

describe('Get Post Controller', () => {
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
      params: { id: 'post123' },
      user: null
    };
  });

  it('should get a post by ID without authentication', async () => {
    const mockPost = {
      _id: 'post123',
      author: { _id: 'user123', username: 'testuser' },
      content: 'Test post',
      likesCount: 5
    };

    spyOn(Post, 'findById').and.returnValue({
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPost))
      })
    });

    const res = mockResponse();
    await getPost(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.post).toBeDefined();
  });

  it('should get a post with isLiked and isSaved for authenticated user', async () => {
    mockRequest.user = { _id: 'user123' };

    const mockPost = {
      _id: 'post123',
      author: { _id: 'user456', username: 'author' },
      content: 'Test post',
      likesCount: 5
    };

    spyOn(Post, 'findById').and.returnValue({
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPost))
      })
    });

    spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like123' }));
    spyOn(PostSave, 'findOne').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getPost(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.data.post.isLiked).toBe(true);
    expect(res.jsonData.data.post.isSaved).toBe(false);
    expect(PostLike.findOne).toHaveBeenCalledWith({ user: 'user123', post: 'post123' });
    expect(PostSave.findOne).toHaveBeenCalledWith({ user: 'user123', post: 'post123' });
  });

  it('should return 404 if post not found', async () => {
    spyOn(Post, 'findById').and.returnValue({
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve(null))
      })
    });

    const res = mockResponse();
    await getPost(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Post not found');
  });

  it('should handle database errors', async () => {
    spyOn(Post, 'findById').and.returnValue({
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.reject(new Error('Database error')))
      })
    });

    const res = mockResponse();
    await getPost(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to retrieve post');
  });
});
