const { likeComment, unlikeComment } = require('../../../controllers/comment/likeCommentController');
const Comment = require('../../../models/Comment');
const CommentLike = require('../../../models/CommentLike');

describe('Like Comment Controller', () => {
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
        _id: 'user123'
      }
    };
  });

  describe('likeComment', () => {
    it('should like a comment successfully', async () => {
      const mockComment = {
        _id: 'comment123',
        likesCount: 5,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));
      spyOn(CommentLike, 'findOne').and.returnValue(Promise.resolve(null));
      spyOn(CommentLike, 'create').and.returnValue(Promise.resolve({ _id: 'like123' }));

      const res = mockResponse();
      await likeComment(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.message).toBe('Comment liked successfully');
      expect(res.jsonData.data.isLiked).toBe(true);
      expect(res.jsonData.data.likesCount).toBe(6);
      expect(mockComment.likesCount).toBe(6);
      expect(mockComment.save).toHaveBeenCalled();
      expect(CommentLike.create).toHaveBeenCalledWith({ user: 'user123', comment: 'comment123' });
    });

    it('should return 404 if comment not found', async () => {
      spyOn(Comment, 'findById').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await likeComment(mockRequest, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Comment not found');
    });

    it('should return 400 if comment already liked', async () => {
      const mockComment = {
        _id: 'comment123',
        likesCount: 5
      };

      spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));
      spyOn(CommentLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like123' }));

      const res = mockResponse();
      await likeComment(mockRequest, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Comment already liked');
    });

    it('should handle database errors', async () => {
      spyOn(Comment, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

      const res = mockResponse();
      await likeComment(mockRequest, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Failed to like comment');
    });
  });

  describe('unlikeComment', () => {
    it('should unlike a comment successfully', async () => {
      const mockComment = {
        _id: 'comment123',
        likesCount: 5,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));
      spyOn(CommentLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like123' }));
      spyOn(CommentLike, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));

      const res = mockResponse();
      await unlikeComment(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.message).toBe('Comment unliked successfully');
      expect(res.jsonData.data.isLiked).toBe(false);
      expect(res.jsonData.data.likesCount).toBe(4);
      expect(mockComment.likesCount).toBe(4);
      expect(mockComment.save).toHaveBeenCalled();
      expect(CommentLike.deleteOne).toHaveBeenCalledWith({ user: 'user123', comment: 'comment123' });
    });

    it('should return 404 if comment not found', async () => {
      spyOn(Comment, 'findById').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await unlikeComment(mockRequest, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Comment not found');
    });

    it('should return 400 if comment not liked', async () => {
      const mockComment = {
        _id: 'comment123',
        likesCount: 5
      };

      spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));
      spyOn(CommentLike, 'findOne').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await unlikeComment(mockRequest, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Comment not liked');
    });

    it('should not allow negative likes count', async () => {
      const mockComment = {
        _id: 'comment123',
        likesCount: 0,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));
      spyOn(CommentLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like123' }));
      spyOn(CommentLike, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));

      const res = mockResponse();
      await unlikeComment(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(mockComment.likesCount).toBe(0);
    });

    it('should handle database errors', async () => {
      spyOn(Comment, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

      const res = mockResponse();
      await unlikeComment(mockRequest, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Failed to unlike comment');
    });
  });
});
