const createComment = require('../../../controllers/comment/createCommentController');
const Comment = require('../../../models/Comment');
const Post = require('../../../models/Post');

describe('Create Comment Controller', () => {
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
      params: { postId: 'post123' },
      body: { content: 'Great post!' },
      user: {
        _id: 'user123'
      }
    };
  });

  it('should create a top-level comment successfully', async () => {
    const mockPost = {
      _id: 'post123',
      commentsCount: 5,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    const mockComment = {
      _id: 'comment123',
      author: 'user123',
      post: 'post123',
      content: 'Great post!',
      parentComment: null,
      likesCount: 0,
      repliesCount: 0,
      toObject: jasmine.createSpy().and.returnValue({
        _id: 'comment123',
        author: { _id: 'user123', username: 'testuser' },
        post: 'post123',
        content: 'Great post!',
        likesCount: 0,
        repliesCount: 0
      }),
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'comment123',
        author: { _id: 'user123', username: 'testuser' },
        post: 'post123',
        content: 'Great post!'
      }))
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'create').and.returnValue(Promise.resolve(mockComment));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.message).toBe('Comment created successfully');
    expect(res.jsonData.data.comment).toBeDefined();
    expect(mockPost.commentsCount).toBe(6);
    expect(mockPost.save).toHaveBeenCalled();
    expect(Comment.create).toHaveBeenCalledWith({
      author: 'user123',
      post: 'post123',
      content: 'Great post!',
      parentComment: null
    });
  });

  it('should create a reply comment successfully', async () => {
    mockRequest.body.parentCommentId = 'parent123';

    const mockPost = {
      _id: 'post123',
      commentsCount: 5,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    const mockParentComment = {
      _id: 'parent123',
      post: 'post123',
      parentComment: null,
      repliesCount: 2,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    const mockComment = {
      _id: 'reply123',
      author: 'user123',
      post: 'post123',
      content: 'Great post!',
      parentComment: 'parent123',
      toObject: jasmine.createSpy().and.returnValue({
        _id: 'reply123',
        content: 'Great post!'
      }),
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'reply123',
        author: { _id: 'user123', username: 'testuser' },
        content: 'Great post!'
      }))
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockParentComment));
    spyOn(Comment, 'create').and.returnValue(Promise.resolve(mockComment));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.success).toBe(true);
    expect(mockParentComment.repliesCount).toBe(3);
    expect(mockParentComment.save).toHaveBeenCalled();
    expect(Comment.create).toHaveBeenCalledWith({
      author: 'user123',
      post: 'post123',
      content: 'Great post!',
      parentComment: 'parent123'
    });
  });

  it('should return 404 if post not found', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Post not found');
  });

  it('should return 404 if parent comment not found', async () => {
    mockRequest.body.parentCommentId = 'parent123';

    const mockPost = {
      _id: 'post123'
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Parent comment not found');
  });

  it('should return 400 if parent comment belongs to different post', async () => {
    mockRequest.body.parentCommentId = 'parent123';

    const mockPost = {
      _id: 'post123'
    };

    const mockParentComment = {
      _id: 'parent123',
      post: {
        toString: () => 'differentPost456'
      },
      parentComment: null
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockParentComment));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Parent comment does not belong to this post');
  });

  it('should return 400 if trying to reply to a reply', async () => {
    mockRequest.body.parentCommentId = 'parent123';

    const mockPost = {
      _id: 'post123'
    };

    const mockParentComment = {
      _id: 'parent123',
      post: {
        toString: () => 'post123'
      },
      parentComment: 'someOtherParent' // This is already a reply
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockParentComment));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Cannot reply to a reply. You can only reply to top-level comments.');
  });

  it('should return 400 if content is invalid', async () => {
    mockRequest.body.content = ''; // Empty content

    const mockPost = {
      _id: 'post123'
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Content must be at least');
  });

  it('should handle database errors', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await createComment(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to create comment');
  });
});
