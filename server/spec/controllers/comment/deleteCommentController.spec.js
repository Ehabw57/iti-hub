const deleteComment = require('../../../controllers/comment/deleteCommentController');
const Comment = require('../../../models/Comment');
const CommentLike = require('../../../models/CommentLike');
const Post = require('../../../models/Post');

describe('Delete Comment Controller', () => {
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
      params: { id: 'comment123' },
      user: {
        _id: 'user123',
        role: 'user'
      }
    };
  });

  it('should delete top-level comment and its replies', async () => {
    const mockComment = {
      _id: 'comment123',
      author: {
        toString: () => 'user123'
      },
      post: {
        toString: () => 'post123'
      },
      parentComment: null,
      repliesCount: 2
    };

    const mockPost = {
      _id: 'post123',
      commentsCount: 10,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));
    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));
    spyOn(Comment, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 2 }));
    spyOn(CommentLike, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 5 }));

    const res = mockResponse();
    await deleteComment(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.message).toBe('Comment deleted successfully');
    expect(Comment.deleteOne).toHaveBeenCalledWith({ _id: 'comment123' });
    expect(Comment.deleteMany).toHaveBeenCalledWith({ parentComment: 'comment123' });
    expect(CommentLike.deleteMany).toHaveBeenCalledWith({ comment: 'comment123' });
    expect(mockPost.commentsCount).toBe(7); // 10 - 1 (comment) - 2 (replies)
    expect(mockPost.save).toHaveBeenCalled();
  });

  it('should delete reply comment and update parent repliesCount', async () => {
    mockRequest.params.id = 'reply123';

    const mockComment = {
      _id: 'reply123',
      author: {
        toString: () => 'user123'
      },
      post: {
        toString: () => 'post123'
      },
      parentComment: 'parent123'
    };

    const mockParentComment = {
      _id: 'parent123',
      repliesCount: 5,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    const mockPost = {
      _id: 'post123',
      commentsCount: 10,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    spyOn(Comment, 'findById').and.callFake((id) => {
      if (id === 'reply123') return Promise.resolve(mockComment);
      if (id === 'parent123') return Promise.resolve(mockParentComment);
    });
    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));
    spyOn(CommentLike, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 2 }));

    const res = mockResponse();
    await deleteComment(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(mockParentComment.repliesCount).toBe(4);
    expect(mockParentComment.save).toHaveBeenCalled();
    expect(mockPost.commentsCount).toBe(9);
    expect(mockPost.save).toHaveBeenCalled();
  });

  it('should allow admin to delete any comment', async () => {
    mockRequest.user.role = 'admin';

    const mockComment = {
      _id: 'comment123',
      author: {
        toString: () => 'differentUser456'
      },
      post: {
        toString: () => 'post123'
      },
      parentComment: null,
      repliesCount: 0
    };

    const mockPost = {
      _id: 'post123',
      commentsCount: 5,
      save: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));
    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));
    spyOn(Comment, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 0 }));
    spyOn(CommentLike, 'deleteMany').and.returnValue(Promise.resolve({ deletedCount: 0 }));

    const res = mockResponse();
    await deleteComment(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  it('should return 404 if comment not found', async () => {
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await deleteComment(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Comment not found');
  });

  it('should return 403 if user is not authorized', async () => {
    const mockComment = {
      _id: 'comment123',
      author: {
        toString: () => 'differentUser456'
      }
    };

    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));

    const res = mockResponse();
    await deleteComment(mockRequest, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Not authorized to delete this comment');
  });

  it('should handle database errors', async () => {
    spyOn(Comment, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await deleteComment(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to delete comment');
  });
});
