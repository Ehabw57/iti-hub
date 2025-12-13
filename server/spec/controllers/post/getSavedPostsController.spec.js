const getSavedPosts = require('../../../controllers/post/getSavedPostsController');
const PostSave = require('../../../models/PostSave');
const Post = require('../../../models/Post');

describe('Get Saved Posts Controller', () => {
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
      query: {},
      user: {
        _id: 'user123'
      }
    };
  });

  it('should return saved posts with default pagination', async () => {
    const mockSaves = [
      { _id: 'save1', post: 'post1', user: 'user123' },
      { _id: 'save2', post: 'post2', user: 'user123' }
    ];

    const mockPosts = [
      {
        _id: 'post1',
        content: 'Saved Post 1',
        author: { _id: 'author1', username: 'author1' },
        toObject: jasmine.createSpy().and.returnValue({ _id: 'post1', content: 'Saved Post 1' })
      },
      {
        _id: 'post2',
        content: 'Saved Post 2',
        author: { _id: 'author2', username: 'author2' },
        toObject: jasmine.createSpy().and.returnValue({ _id: 'post2', content: 'Saved Post 2' })
      }
    ];

    const mockSaveQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            select: jasmine.createSpy().and.returnValue(Promise.resolve(mockSaves))
          })
        })
      })
    };

    const mockPostQuery = {
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPosts))
      })
    };

    spyOn(PostSave, 'find').and.returnValue(mockSaveQuery);
    spyOn(PostSave, 'countDocuments').and.returnValue(Promise.resolve(2));
    spyOn(Post, 'find').and.returnValue(mockPostQuery);

    const PostLike = require('../../../models/PostLike');
    spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getSavedPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.posts.length).toBe(2);
    expect(res.jsonData.data.pagination.page).toBe(1);
    expect(res.jsonData.data.pagination.limit).toBe(20);
    expect(res.jsonData.data.pagination.pages).toBe(1);
  });

  it('should return saved posts with custom pagination', async () => {
    mockRequest.query = { page: '3', limit: '5' };

    const mockSaves = [
      { _id: 'save11', post: 'post11', user: 'user123' }
    ];

    const mockPosts = [
      {
        _id: 'post11',
        content: 'Saved Post 11',
        author: { _id: 'author1', username: 'author1' },
        toObject: jasmine.createSpy().and.returnValue({ _id: 'post11', content: 'Saved Post 11' })
      }
    ];

    const mockSaveQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            select: jasmine.createSpy().and.returnValue(Promise.resolve(mockSaves))
          })
        })
      })
    };

    const mockPostQuery = {
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPosts))
      })
    };

    spyOn(PostSave, 'find').and.returnValue(mockSaveQuery);
    spyOn(PostSave, 'countDocuments').and.returnValue(Promise.resolve(11));
    spyOn(Post, 'find').and.returnValue(mockPostQuery);

    const PostLike = require('../../../models/PostLike');
    spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getSavedPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.pagination.page).toBe(3);
    expect(res.jsonData.data.pagination.limit).toBe(5);
    expect(res.jsonData.data.pagination.pages).toBe(3);
  });

  it('should include isLiked and isSaved flags', async () => {
    const mockSaves = [
      { _id: 'save1', post: 'post1', user: 'user123' }
    ];

    const mockPosts = [
      {
        _id: 'post1',
        content: 'Saved Post 1',
        author: { _id: 'author1', username: 'author1' },
        toObject: jasmine.createSpy().and.returnValue({
          _id: 'post1',
          content: 'Saved Post 1'
        })
      }
    ];

    const mockSaveQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            select: jasmine.createSpy().and.returnValue(Promise.resolve(mockSaves))
          })
        })
      })
    };

    const mockPostQuery = {
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPosts))
      })
    };

    spyOn(PostSave, 'find').and.returnValue(mockSaveQuery);
    spyOn(PostSave, 'countDocuments').and.returnValue(Promise.resolve(1));
    spyOn(Post, 'find').and.returnValue(mockPostQuery);

    const PostLike = require('../../../models/PostLike');
    spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve({ _id: 'like1' }));

    const res = mockResponse();
    await getSavedPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.data.posts[0].isLiked).toBe(true);
    expect(res.jsonData.data.posts[0].isSaved).toBe(true);
  });

  it('should return empty array if no saved posts', async () => {
    const mockSaveQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            select: jasmine.createSpy().and.returnValue(Promise.resolve([]))
          })
        })
      })
    };

    const mockPostQuery = {
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve([]))
      })
    };

    spyOn(PostSave, 'find').and.returnValue(mockSaveQuery);
    spyOn(PostSave, 'countDocuments').and.returnValue(Promise.resolve(0));
    spyOn(Post, 'find').and.returnValue(mockPostQuery);

    const res = mockResponse();
    await getSavedPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.posts.length).toBe(0);
    expect(res.jsonData.data.pagination.pages).toBe(0);
  });

  it('should filter out saved posts with null post references', async () => {
    const mockSaves = [
      { _id: 'save1', post: 'post1', user: 'user123' },
      { _id: 'save2', post: 'deletedPost', user: 'user123' },
      { _id: 'save3', post: 'post2', user: 'user123' }
    ];

    const mockPosts = [
      {
        _id: 'post1',
        content: 'Saved Post 1',
        author: { _id: 'author1', username: 'author1' },
        toObject: jasmine.createSpy().and.returnValue({
          _id: 'post1',
          content: 'Saved Post 1'
        })
      },
      {
        _id: 'post2',
        content: 'Saved Post 2',
        author: { _id: 'author2', username: 'author2' },
        toObject: jasmine.createSpy().and.returnValue({
          _id: 'post2',
          content: 'Saved Post 2'
        })
      }
    ];

    const mockSaveQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            select: jasmine.createSpy().and.returnValue(Promise.resolve(mockSaves))
          })
        })
      })
    };

    const mockPostQuery = {
      populate: jasmine.createSpy().and.returnValue({
        populate: jasmine.createSpy().and.returnValue(Promise.resolve(mockPosts))
      })
    };

    spyOn(PostSave, 'find').and.returnValue(mockSaveQuery);
    spyOn(PostSave, 'countDocuments').and.returnValue(Promise.resolve(3));
    spyOn(Post, 'find').and.returnValue(mockPostQuery);

    const PostLike = require('../../../models/PostLike');
    spyOn(PostLike, 'findOne').and.returnValue(Promise.resolve(null));

    const res = mockResponse();
    await getSavedPosts(mockRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.data.posts.length).toBe(2);
    expect(res.jsonData.data.posts.every(p => p._id)).toBe(true);
  });

  it('should handle database errors', async () => {
    const mockSaveQuery = {
      sort: jasmine.createSpy().and.returnValue({
        skip: jasmine.createSpy().and.returnValue({
          limit: jasmine.createSpy().and.returnValue({
            select: jasmine.createSpy().and.returnValue(Promise.reject(new Error('Database error')))
          })
        })
      })
    };

    spyOn(PostSave, 'find').and.returnValue(mockSaveQuery);

    const res = mockResponse();
    await getSavedPosts(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to retrieve saved posts');
  });
});
