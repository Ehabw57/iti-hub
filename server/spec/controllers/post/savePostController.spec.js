const { savePost, unsavePost } = require('../../../controllers/post/savePostController');
const Post = require('../../../models/Post');
const PostSave = require('../../../models/PostSave');

describe('Save Post Controller', () => {
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

  describe('savePost', () => {
    it('should save a post successfully', async () => {
      const mockPost = {
        _id: 'post123',
        savesCount: 3,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostSave, 'findOne').and.returnValue(Promise.resolve(null));
      spyOn(PostSave, 'create').and.returnValue(Promise.resolve({ _id: 'save123' }));

      const res = mockResponse();
      await savePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.isSaved).toBe(true);
      expect(mockPost.savesCount).toBe(4);
      expect(mockPost.save).toHaveBeenCalled();
      expect(PostSave.create).toHaveBeenCalledWith({ user: 'user123', post: 'post123' });
    });

    it('should return 404 if post not found', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await savePost(mockRequest, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post not found');
    });

    it('should return 400 if post already saved', async () => {
      const mockPost = {
        _id: 'post123',
        savesCount: 3
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostSave, 'findOne').and.returnValue(Promise.resolve({ _id: 'save123' }));

      const res = mockResponse();
      await savePost(mockRequest, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post already saved');
    });

    it('should handle database errors', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

      const res = mockResponse();
      await savePost(mockRequest, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Failed to save post');
    });
  });

  describe('unsavePost', () => {
    it('should unsave a post successfully', async () => {
      const mockPost = {
        _id: 'post123',
        savesCount: 3,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostSave, 'findOne').and.returnValue(Promise.resolve({ _id: 'save123' }));
      spyOn(PostSave, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));

      const res = mockResponse();
      await unsavePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.isSaved).toBe(false);
      expect(mockPost.savesCount).toBe(2);
      expect(mockPost.save).toHaveBeenCalled();
      expect(PostSave.deleteOne).toHaveBeenCalledWith({ user: 'user123', post: 'post123' });
    });

    it('should return 404 if post not found', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await unsavePost(mockRequest, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post not found');
    });

    it('should return 400 if post not saved', async () => {
      const mockPost = {
        _id: 'post123',
        savesCount: 3
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostSave, 'findOne').and.returnValue(Promise.resolve(null));

      const res = mockResponse();
      await unsavePost(mockRequest, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Post not saved');
    });

    it('should not allow negative saves count', async () => {
      const mockPost = {
        _id: 'post123',
        savesCount: 0,
        save: jasmine.createSpy().and.returnValue(Promise.resolve())
      };

      spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
      spyOn(PostSave, 'findOne').and.returnValue(Promise.resolve({ _id: 'save123' }));
      spyOn(PostSave, 'deleteOne').and.returnValue(Promise.resolve({ deletedCount: 1 }));

      const res = mockResponse();
      await unsavePost(mockRequest, res);

      expect(res.statusCode).toBe(200);
      expect(mockPost.savesCount).toBe(0);
    });

    it('should handle database errors', async () => {
      spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

      const res = mockResponse();
      await unsavePost(mockRequest, res);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toBe('Failed to unsave post');
    });
  });
});
