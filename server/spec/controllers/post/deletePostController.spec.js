const deletePost = require('../../../controllers/post/deletePostController');
const Post = require('../../../models/Post');
const PostLike = require('../../../models/PostLike');
const PostSave = require('../../../models/PostSave');
const Comment = require('../../../models/Comment');

describe('Delete Post Controller', () => {
  let mockResponse;
  let mockRequest;

  beforeEach(() => {
    mockResponse = () => ({
      statusCode: null,
      jsonData: null,
      sentData: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      },
      send: function(data) {
        this.sentData = data;
        return this;
      }
    });

    mockRequest = {
      params: { id: 'post123' },
      user: {
        _id: 'user123',
        role: 'user'
      }
    };
  });

  it('should delete post and related data', async () => {
    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Test post'
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(PostLike, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 5 }));
    spyOn(PostSave, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 2 }));
    spyOn(Comment, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 10 }));
    spyOn(Post, 'findByIdAndDelete').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await deletePost(mockRequest, res);

    expect(res.statusCode).toBe(204);
    expect(PostLike.deleteMany).toHaveBeenCalledWith({ post: 'post123' });
    expect(PostSave.deleteMany).toHaveBeenCalledWith({ post: 'post123' });
    expect(Comment.deleteMany).toHaveBeenCalledWith({ post: 'post123' });
    expect(Post.findByIdAndDelete).toHaveBeenCalledWith('post123');
  });

  it('should return 404 if post not found', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await deletePost(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Post not found');
  });

  it('should return 403 if user is not the author', async () => {
    mockRequest.user = { _id: 'otheruser', role: 'user' };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Test post'
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await deletePost(mockRequest, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('permission');
  });

  it('should allow admin to delete any post', async () => {
    mockRequest.user = { _id: 'admin123', role: 'admin' };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Test post'
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(PostLike, 'deleteMany').and.returnValue(Promise.resolve({}));
    spyOn(PostSave, 'deleteMany').and.returnValue(Promise.resolve({}));
    spyOn(Comment, 'deleteMany').and.returnValue(Promise.resolve({}));
    spyOn(Post, 'findByIdAndDelete').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await deletePost(mockRequest, res);

    expect(res.statusCode).toBe(204);
  });

  it('should handle database errors', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await deletePost(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to delete post');
  });
});
