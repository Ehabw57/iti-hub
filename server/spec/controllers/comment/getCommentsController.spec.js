const getComments = require('../../../controllers/comment/getCommentsController');
const Comment = require('../../../models/Comment');
const Post = require('../../../models/Post');

describe('Get Comments Controller', () => {
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
      query: {},
      user: null
    };
  });

  it('should return top-level comments with pagination', async () => {
    const mockPost = { _id: 'post123' };
    
    const mockComments = [
      {
        _id: 'comment1',
        content: 'Comment 1',
        author: { _id: 'user1', username: 'user1' },
        parentComment: null,
        toObject: jasmine.createSpy().and.returnValue({ _id: 'comment1', content: 'Comment 1' })
      },
      {
        _id: 'comment2',
        content: 'Comment 2',
        author: { _id: 'user2', username: 'user2' },
        parentComment: null,
        toObject: jasmine.createSpy().and.returnValue({ _id: 'comment2', content: 'Comment 2' })
      }
    ];

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockComments))
          })
        })
      })
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'find').and.returnValue(mockQuery);
    spyOn(Comment, 'countDocuments').and.returnValue(Promise.resolve(2));

    const res = mockResponse();
    await getComments(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.comments.length).toBe(2);
    expect(res.jsonData.data.pagination.page).toBe(1);
    expect(res.jsonData.data.pagination.limit).toBe(20);
    expect(res.jsonData.data.pagination.pages).toBe(1);
  });

  it('should return replies for a specific parent comment', async () => {
    mockRequest.query.parentCommentId = 'parent123';

    const mockPost = { _id: 'post123' };
    const mockParentComment = { _id: 'parent123', post: 'post123' };

    const mockReplies = [
      {
        _id: 'reply1',
        content: 'Reply 1',
        parentComment: 'parent123',
        toObject: jasmine.createSpy().and.returnValue({ _id: 'reply1', content: 'Reply 1' })
      }
    ];

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockReplies))
          })
        })
      })
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(mockParentComment));
    spyOn(Comment, 'find').and.returnValue(mockQuery);
    spyOn(Comment, 'countDocuments').and.returnValue(Promise.resolve(1));

    const res = mockResponse();
    await getComments(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.comments.length).toBe(1);
  });

  it('should include isLiked flag for authenticated user', async () => {
    mockRequest.user = { _id: 'currentUser' };

    const mockPost = { _id: 'post123' };
    
    const mockComments = [
      {
        _id: 'comment1',
        content: 'Comment 1',
        parentComment: null,
        toObject: jasmine.createSpy().and.returnValue({ _id: 'comment1', content: 'Comment 1' })
      }
    ];

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockComments))
          })
        })
      })
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'find').and.returnValue(mockQuery);
    spyOn(Comment, 'countDocuments').and.returnValue(Promise.resolve(1));

    const CommentLike = require('../../../models/CommentLike');
    spyOn(CommentLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like1' }));

    const res = mockResponse();
    await getComments(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.data.comments[0].isLiked).toBe(true);
  });

  it('should return 404 if post not found', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getComments(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Post not found');
  });

  it('should return 404 if parent comment not found', async () => {
    mockRequest.query.parentCommentId = 'parent123';

    const mockPost = { _id: 'post123' };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'findById').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getComments(mockRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Parent comment not found');
  });

  it('should return empty array if no comments', async () => {
    const mockPost = { _id: 'post123' };

    const mockQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            populate: jasmine.createSpy().and.returnValue(Promise.resolve([]))
          })
        })
      })
    };

    spyOn(Post, 'findById').and.returnValue(Promise.resolve(mockPost));
    spyOn(Comment, 'find').and.returnValue(mockQuery);
    spyOn(Comment, 'countDocuments').and.returnValue(Promise.resolve(0));

    const res = mockResponse();
    await getComments(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.comments.length).toBe(0);
    expect(res.jsonData.data.pagination.pages).toBe(0);
  });

  it('should handle database errors', async () => {
    spyOn(Post, 'findById').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await getComments(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to retrieve comments');
  });
});
