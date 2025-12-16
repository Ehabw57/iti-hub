const { likePost, unlikePost } = require('../../../controllers/post/likePostController');
const Post = require('../../../models/Post');
const PostLike = require('../../../models/PostLike');
const Notification = require('../../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../../utils/constants');

describe('Like Post Controller', () => {
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
      user: {
        _id: 'user123'
      }
    };
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      const mockPost = {
        _id: 'post123',
        likesCount: 5,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));
      spyOn(PostLike, 'create').and.returnValue(Promise.resolve({ _id: 'like123' }));

      const res = mockResponse();
      await likePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.isLiked).toBe(true);
      expect(res.jsonData.data.likesCount).toBe(6);
      expect(mockPost.likesCount).toBe(6);
      expect(mockPost.save).toHaveBeenCalled();
      expect(PostLike.create).toHaveBeenCalledWith({ user: 'user123', post: 'post123' });
    });

    it('should return 404 if post not found', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await likePost(mockRequest, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post not found');
    });

    it('should return 400 if post already liked', async () => {
      const mockPost = {
        _id: 'post123',
        likesCount: 5
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like123' }));

      const res = mockResponse();
      await likePost(mockRequest, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post already liked');
    });

    it('should handle database errors', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

      const res = mockResponse();
      await likePost(mockRequest, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Failed to like post');
    });

    it('should create notification when liking post', async () => {
      const mockPost = {
        _id: 'post123',
        author: 'author123',
        likesCount: 5,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));
      spyOn(PostLike, 'create').and.returnValue(Promise.resolve({ _id: 'like123' }));
      spyOn(Notification, 'createOrUpdateNotification').and.returnValue(Promise.resolve({ _id: 'notif123' }));

      const res = mockResponse();
      await likePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(Notification.createOrUpdateNotification).toHaveBeenCalledWith(
        'author123',
        'user123',
        NOTIFICATION_TYPES.LIKE,
        'post123'
      );
    });

    it('should not create notification for own post', async () => {
      const mockPost = {
        _id: 'post123',
        author: 'user123', // Same as the user liking
        likesCount: 5,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));
      spyOn(PostLike, 'create').and.returnValue(Promise.resolve({ _id: 'like123' }));
      spyOn(Notification, 'createOrUpdateNotification').and.returnValue(Promise.resolve(null)); // Returns null for self-notification

      const res = mockResponse();
      await likePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(Notification.createOrUpdateNotification).toHaveBeenCalled();
    });

    it('should not block like action if notification fails', async () => {
      const mockPost = {
        _id: 'post123',
        author: 'author123',
        likesCount: 5,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));
      spyOn(PostLike, 'create').and.returnValue(Promise.resolve({ _id: 'like123' }));
      spyOn(Notification, 'createOrUpdateNotification').and.returnValue(Promise.reject(new Error('Notification error')));
      spyOn(console, 'error'); // Suppress error log

      const res = mockResponse();
      await likePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(console.error).toHaveBeenCalledWith('Failed to create notification:', jasmine.any(Error));
    });
  });

  describe('unlikePost', () => {
    it('should unlike a post successfully', async () => {
      const mockPost = {
        _id: 'post123',
        likesCount: 5,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like123' }));
      spyOn(PostLike, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));

      const res = mockResponse();
      await unlikePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.isLiked).toBe(false);
      expect(res.jsonData.data.likesCount).toBe(4);
      expect(mockPost.likesCount).toBe(4);
      expect(mockPost.save).toHaveBeenCalled();
      expect(PostLike.deleteOne).toHaveBeenCalledWith({ user: 'user123', post: 'post123' });
    });

    it('should return 404 if post not found', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await unlikePost(mockRequest, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post not found');
    });

    it('should return 400 if post not liked', async () => {
      const mockPost = {
        _id: 'post123',
        likesCount: 5
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await unlikePost(mockRequest, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post not liked');
    });

    it('should not allow negative likes count', async () => {
      const mockPost = {
        _id: 'post123',
        likesCount: 0,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like123' }));
      spyOn(PostLike, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));

      const res = mockResponse();
      await unlikePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(mockPost.likesCount).toBe(0);
    });

    it('should handle database errors', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

      const res = mockResponse();
      await unlikePost(mockRequest, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Failed to unlike post');
    });
  });
});
