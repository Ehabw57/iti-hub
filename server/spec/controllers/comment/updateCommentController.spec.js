const updateComment = require('../../../controllers/comment/updateCommentController');
const Comment = require('../../../models/Comment');

describe('Update Comment Controller', () => {
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
      body: { content: 'Updated content' },
      user: {
        _id: 'user123',
        role: 'user'
      }
    };
  });

  it('should update comment content successfully', async () => {
    const mockComment = {
      _id: 'comment123',
      author: {
        toString: () => 'user123'
      },
      content: 'Old content',
      editedAt: null,
      save: jasmine.createSpy().and.returnValue(Promise.resolve()),
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'comment123',
        author: { _id: 'user123', username: 'testuser' },
        content: 'Updated content',
        editedAt: new Date()
      }))
    };

    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));

    const res = mockResponse();
    await updateComment(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.message).toBe('Comment updated successfully');
    expect(mockComment.content).toBe('Updated content');
    expect(mockComment.editedAt).toBeDefined();
    expect(mockComment.save).toHaveBeenCalled();
  });

  it('should allow admin to update any comment', async () => {
    mockRequest.user.role = 'admin';

    const mockComment = {
      _id: 'comment123',
      author: {
        toString: () => 'differentUser456'
      },
      content: 'Old content',
      save: jasmine.createSpy().and.returnValue(Promise.resolve()),
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'comment123',
        content: 'Updated content'
      }))
    };

    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));

    const res = mockResponse();
    await updateComment(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  it('should return 404 if comment not found', async () => {
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await updateComment(mockRequest, res);

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
    await updateComment(mockRequest, res);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Not authorized to update this comment');
  });

  it('should return 400 if trying to update invalid fields', async () => {
    mockRequest.body = { 
      content: 'Updated content',
      author: 'newAuthor', // Invalid field
      likesCount: 100 // Invalid field
    };

    const mockComment = {
      _id: 'comment123',
      author: {
        toString: () => 'user123'
      }
    };

    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));

    const res = mockResponse();
    await updateComment(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Cannot update fields');
  });

  it('should return 400 if content is invalid', async () => {
    mockRequest.body.content = ''; // Empty content

    const mockComment = {
      _id: 'comment123',
      author: {
        toString: () => 'user123'
      }
    };

    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockComment));

    const res = mockResponse();
    await updateComment(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Content must be at least');
  });

  it('should handle database errors', async () => {
    spyOn(Comment, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await updateComment(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to update comment');
  });
});
