const updatePost = require('../../../controllers/post/updatePostController');
const Post = require('../../../models/Post');

describe('Update Post Controller', () => {
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
      body: {},
      user: {
        _id: 'user123',
        role: 'user'
      }
    };
  });

  it('should update post content', async () => {
    mockRequest.body = {
      content: 'Updated content'
    };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Original content',
      tags: [],
      save: jasmine.createSpy().and.returnValue(Promise.resolve()),
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'post123',
        author: { _id: 'user123', username: 'testuser' },
        content: 'Updated content',
        editedAt: new Date()
      }))
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await updatePost(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(mockPost.content).toBe('Updated content');
    expect(mockPost.editedAt).toBeDefined();
    expect(mockPost.save).toHaveBeenCalled();
  });

  it('should update post tags', async () => {
    mockRequest.body = {
      tags: ['tag1', 'tag2']
    };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Test content',
      tags: [],
      save: jasmine.createSpy().and.returnValue(Promise.resolve()),
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'post123',
        author: { _id: 'user123', username: 'testuser' },
        content: 'Test content',
        tags: ['tag1', 'tag2']
      }))
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await updatePost(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(mockPost.tags).toEqual(['tag1', 'tag2']);
  });

  it('should return 404 if post not found', async () => {
    mockRequest.body = { content: 'Updated' };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await updatePost(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Post not found');
  });

  it('should return 403 if user is not the author', async () => {
    mockRequest.body = { content: 'Updated' };
    mockRequest.user = { _id: 'otheruser', role: 'user' };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Original content'
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await updatePost(mockRequest, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('permission');
  });

  it('should allow admin to update any post', async () => {
    mockRequest.body = { content: 'Admin update' };
    mockRequest.user = { _id: 'admin123', role: 'admin' };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Original content',
      tags: [],
      save: jasmine.createSpy().and.returnValue(Promise.resolve()),
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'post123',
        author: { _id: 'user123', username: 'testuser' },
        content: 'Admin update'
      }))
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await updatePost(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  it('should return 400 if trying to update images', async () => {
    mockRequest.body = {
      images: ['https://example.com/newimg.jpg']
    };

    const mockPost = {
      _id: 'post123',
      author: 'user123'
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await updatePost(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Cannot update');
  });

  it('should handle database errors', async () => {
    mockRequest.body = { content: 'Updated' };

    spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await updatePost(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to update post');
  });
});
