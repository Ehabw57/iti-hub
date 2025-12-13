const mongoose = require('mongoose');
const PostLike = require('../../models/PostLike');
const Post = require('../../models/Post');
const User = require('../../models/User');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');

describe('PostLike Model', () => {
  let testUser;
  let testPost;

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

    // Create a test post
    testPost = await Post.create({
      author: testUser._id,
      content: 'Test post'
    });
  });

  describe('PostLike Creation', () => {
    it('should create a postlike with valid fields', async () => {
      const postLike = await PostLike.create({
        user: testUser._id,
        post: testPost._id
      });

      expect(postLike).toBeDefined();
      expect(postLike.user.toString()).toBe(testUser._id.toString());
      expect(postLike.post.toString()).toBe(testPost._id.toString());
      expect(postLike.createdAt).toBeDefined();
    });
  });

  describe('PostLike Validation', () => {
    it('should require user field', async () => {
      const postLike = new PostLike({
        post: testPost._id
      });

      let error;
      try {
        await postLike.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    it('should require post field', async () => {
      const postLike = new PostLike({
        user: testUser._id
      });

      let error;
      try {
        await postLike.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.post).toBeDefined();
    });

    it('should enforce unique user-post combination', async () => {
      await PostLike.create({
        user: testUser._id,
        post: testPost._id
      });

      let error;
      try {
        await PostLike.create({
          user: testUser._id,
          post: testPost._id
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });
  });

  describe('PostLike Indexes', () => {
    it('should have unique compound index on user and post', async () => {
      const indexes = PostLike.schema.indexes();
      const compoundIndex = indexes.find(idx => 
        idx[0].user === 1 && idx[0].post === 1 && idx[1].unique === true
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have index on user and createdAt', async () => {
      const indexes = PostLike.schema.indexes();
      const userIndex = indexes.find(idx => idx[0].user === 1 && idx[0].createdAt === -1);
      expect(userIndex).toBeDefined();
    });

    it('should have index on post and createdAt', async () => {
      const indexes = PostLike.schema.indexes();
      const postIndex = indexes.find(idx => idx[0].post === 1 && idx[0].createdAt === -1);
      expect(postIndex).toBeDefined();
    });
  });
});
