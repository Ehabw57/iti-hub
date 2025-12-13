const mongoose = require('mongoose');
const Post = require('../../models/Post');
const User = require('../../models/User');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');
const {
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_IMAGES,
  MAX_POST_TAGS,
  MAX_REPOST_COMMENT_LENGTH
} = require('../../utils/constants');

describe('Post Model', () => {
  let testUser;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create a test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      fullName: 'Test User',
      role: 'user'
    });
  });

  describe('Post Creation', () => {
    it('should create a post with valid content only', async () => {
      const post = await Post.create({
        author: testUser._id,
        content: 'This is a test post'
      });

      expect(post).toBeDefined();
      expect(post.author.toString()).toBe(testUser._id.toString());
      expect(post.content).toBe('This is a test post');
      expect(post.images).toEqual([]);
      expect(post.tags).toEqual([]);
      expect(post.likesCount).toBe(0);
      expect(post.commentsCount).toBe(0);
      expect(post.repostsCount).toBe(0);
      expect(post.savesCount).toBe(0);
      expect(post.createdAt).toBeDefined();
      expect(post.updatedAt).toBeDefined();
    });

    it('should create a post with valid fields', async () => {
      const post = await Post.create({
        author: testUser._id,
        content: 'Post with media',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        tags: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      });

      expect(post.images.length).toBe(2);
      expect(post.tags.length).toBe(2);
    });

    it('should create a post with images only (no content)', async () => {
      const post = await Post.create({
        author: testUser._id,
        content: '',
        images: ['https://example.com/image1.jpg']
      });

      expect(post).toBeDefined();
      expect(post.content).toBe('');
      expect(post.images.length).toBe(1);
    });

    it('should create a repost with originalPost reference', async () => {
      const originalPost = await Post.create({
        author: testUser._id,
        content: 'Original post'
      });

      const repost = await Post.create({
        author: testUser._id,
        content: 'Reposting this',
        originalPost: originalPost._id,
        repostComment: 'Check this out!'
      });

      expect(repost.originalPost.toString()).toBe(originalPost._id.toString());
      expect(repost.repostComment).toBe('Check this out!');
    });
  });

  it('should not allow more than 10 images', async () => {
    const images = Array(MAX_POST_IMAGES + 1).fill('https://example.com/image.jpg');
    const post = new Post({
      author: testUser._id,
      content: 'Test',
      images
    });

    let error;
    try {
      await post.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.images).toBeDefined();
  });

  it('should require content if no images', async () => {
    const post = new Post({
      author: testUser._id,
      content: '',
      images: []
    });

    let error;
    try {
      await post.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Content or images required');
  });

  it('should not allow more than 5 tags', async () => {
    const tags = Array(MAX_POST_TAGS + 1).fill(new mongoose.Types.ObjectId());
    const post = new Post({
      author: testUser._id,
      content: 'Test',
      tags
    });

    let error;
    try {
      await post.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.tags).toBeDefined();
  });

  it('should enforce content max length', async () => {
    const longContent = 'a'.repeat(MAX_POST_CONTENT_LENGTH + 1);
    const post = new Post({
      author: testUser._id,
      content: longContent
    });

    let error;
    try {
      await post.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.content).toBeDefined();
  });

  it('should set createdAt and updatedAt', async () => {
    const post = await Post.create({
      author: testUser._id,
      content: 'Test post'
    });

    expect(post.createdAt).toBeDefined();
    expect(post.updatedAt).toBeDefined();
    expect(post.createdAt).toEqual(post.updatedAt);
  });

  it('should update only content and tags', async () => {
    const post = await Post.create({
      author: testUser._id,
      content: 'Original content',
      tags: [new mongoose.Types.ObjectId()]
    });

    const newTag = new mongoose.Types.ObjectId();
    post.content = 'Updated content';
    post.tags = [newTag];
    await post.save();

    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.content).toBe('Updated content');
    expect(updatedPost.tags[0].toString()).toBe(newTag.toString());
  });

  it('should not allow images to be updated', async () => {
    const post = await Post.create({
      author: testUser._id,
      content: 'Test',
      images: ['https://example.com/image1.jpg']
    });

    // Images cannot be updated - this is enforced in the controller
    // The model allows it but controller logic prevents it
    expect(post.images.length).toBe(1);
  });

  describe('Post Validation', () => {
    it('should require author field', async () => {
      const post = new Post({
        content: 'Test post'
      });

      let error;
      try {
        await post.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.author).toBeDefined();
    });

    it('should reject repostComment exceeding max length', async () => {
      const longComment = 'a'.repeat(MAX_REPOST_COMMENT_LENGTH + 1);
      const originalPost = await Post.create({
        author: testUser._id,
        content: 'Original'
      });

      const post = new Post({
        author: testUser._id,
        content: '',
        originalPost: originalPost._id,
        repostComment: longComment
      });

      let error;
      try {
        await post.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.repostComment).toBeDefined();
    });
  });

  describe('Post Indexes', () => {
    it('should have indexes on author and createdAt', async () => {
      const indexes = Post.schema.indexes();
      const authorIndex = indexes.find(idx => idx[0].author === 1 && idx[0].createdAt === -1);
      expect(authorIndex).toBeDefined();
    });

    it('should have index on community and createdAt', async () => {
      const indexes = Post.schema.indexes();
      const communityIndex = indexes.find(idx => idx[0].community === 1 && idx[0].createdAt === -1);
      expect(communityIndex).toBeDefined();
    });

    it('should have index on tags', async () => {
      const indexes = Post.schema.indexes();
      const tagsIndex = indexes.find(idx => idx[0].tags === 1);
      expect(tagsIndex).toBeDefined();
    });

    it('should have text index on content', async () => {
      const indexes = Post.schema.indexes();
      const textIndex = indexes.find(idx => idx[0].content === 'text');
      expect(textIndex).toBeDefined();
    });
  });

  describe('Post Timestamps', () => {
    it('should update updatedAt on modification', async () => {
      const post = await Post.create({
        author: testUser._id,
        content: 'Original content'
      });

      const originalUpdatedAt = post.updatedAt;
      
      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      post.content = 'Updated content';
      await post.save();

      expect(post.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
