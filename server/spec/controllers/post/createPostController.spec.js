const createPost = require('../../../controllers/post/createPostController');
const Post = require('../../../models/Post');
const { validatePostContent, validatePostImages, validatePostTags } = require('../../../utils/postHelpers');

describe('Create Post Controller', () => {
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
      body: {},
      user: {
        _id: 'user123'
      }
    };
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create a post with valid content', async () => {
    mockRequest.body = {
      content: 'This is a test post'
    };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'This is a test post',
      images: [],
      tags: [],
      likesCount: 0,
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'post123',
        author: { _id: 'user123', username: 'testuser' },
        content: 'This is a test post',
        images: [],
        tags: []
      }))
    };

    spyOn(Post, 'create').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await createPost(mockRequest, res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.message).toBe('Post created successfully');
    expect(res.jsonData.data.post).toBeDefined();
  });

  it('should create a post with images and tags', async () => {
    mockRequest.body = {
      content: 'Post with media',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      tags: ['tag1', 'tag2']
    };

    const mockPost = {
      _id: 'post123',
      author: 'user123',
      content: 'Post with media',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      tags: ['tag1', 'tag2'],
      populate: jasmine.createSpy().and.returnValue(Promise.resolve({
        _id: 'post123',
        author: { _id: 'user123', username: 'testuser' },
        content: 'Post with media',
        images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        tags: ['tag1', 'tag2']
      }))
    };

    spyOn(Post, 'create').and.returnValue(Promise.resolve(mockPost));

    const res = mockResponse();
    await createPost(mockRequest, res);

    expect(res.statusCode).toBe(201);
    expect(Post.create).toHaveBeenCalledWith({
      author: 'user123',
      content: 'Post with media',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      tags: ['tag1', 'tag2'],
      community: null
    });
  });

  it('should return 400 if content and images are missing', async () => {
    mockRequest.body = {
      content: '',
      images: []
    };

    const res = mockResponse();
    await createPost(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Content or images required');
  });

  it('should return 400 if too many images', async () => {
    mockRequest.body = {
      content: 'Test',
      images: Array(11).fill('https://example.com/img.jpg')
    };

    const res = mockResponse();
    await createPost(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Cannot upload more than');
  });

  it('should return 400 if too many tags', async () => {
    mockRequest.body = {
      content: 'Test',
      tags: Array(6).fill('tag')
    };

    const res = mockResponse();
    await createPost(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('Cannot add more than');
  });

  it('should return 400 if content exceeds max length', async () => {
    mockRequest.body = {
      content: 'a'.repeat(5001)
    };

    const res = mockResponse();
    await createPost(mockRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
  });

  it('should handle database errors', async () => {
    mockRequest.body = {
      content: 'Test post'
    };

    spyOn(Post, 'create').and.returnValue(Promise.reject(new Error('Database error')));

    const res = mockResponse();
    await createPost(mockRequest, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toBe('Failed to create post');
  });
});
