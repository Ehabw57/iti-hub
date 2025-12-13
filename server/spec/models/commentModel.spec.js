const mongoose = require('mongoose');
const Comment = require('../../models/Comment');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');
const {
  MIN_COMMENT_CONTENT_LENGTH,
  MAX_COMMENT_CONTENT_LENGTH
} = require('../../utils/constants');

describe('Comment Model', () => {
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

  it('should create a comment with valid fields', async () => {
    const comment = await Comment.create({
      author: testUser._id,
      post: testPost._id,
      content: 'This is a test comment'
    });

    expect(comment).toBeDefined();
    expect(comment.author.toString()).toBe(testUser._id.toString());
    expect(comment.post.toString()).toBe(testPost._id.toString());
    expect(comment.content).toBe('This is a test comment');
    expect(comment.parentComment).toBeNull();
    expect(comment.likesCount).toBe(0);
    expect(comment.repliesCount).toBe(0);
    expect(comment.createdAt).toBeDefined();
    expect(comment.updatedAt).toBeDefined();
  });

  it('should require content (1-1000 chars)', async () => {
    // Test missing content
    const commentNoContent = new Comment({
      author: testUser._id,
      post: testPost._id,
      content: ''
    });

    let error;
    try {
      await commentNoContent.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.content).toBeDefined();

    // Test content too long
    const longContent = 'a'.repeat(MAX_COMMENT_CONTENT_LENGTH + 1);
    const commentTooLong = new Comment({
      author: testUser._id,
      post: testPost._id,
      content: longContent
    });

    let error2;
    try {
      await commentTooLong.validate();
    } catch (e) {
      error2 = e;
    }

    expect(error2).toBeDefined();
    expect(error2.errors.content).toBeDefined();
  });

  it('should not allow nested replies beyond one level', async () => {
    // Create a top-level comment
    const topComment = await Comment.create({
      author: testUser._id,
      post: testPost._id,
      content: 'Top level comment'
    });

    // Create a reply (one level)
    const reply = await Comment.create({
      author: testUser._id,
      post: testPost._id,
      content: 'First level reply',
      parentComment: topComment._id
    });

    // Try to create a nested reply (two levels) - should fail
    const nestedReply = new Comment({
      author: testUser._id,
      post: testPost._id,
      content: 'Nested reply',
      parentComment: reply._id
    });

    let error;
    try {
      await nestedReply.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('nested replies');
  });

  it('should set createdAt and updatedAt', async () => {
    const comment = await Comment.create({
      author: testUser._id,
      post: testPost._id,
      content: 'Test comment'
    });

    expect(comment.createdAt).toBeDefined();
    expect(comment.updatedAt).toBeDefined();
    expect(comment.createdAt).toEqual(comment.updatedAt);
  });

  it('should enforce that only top-level comments can have replies', async () => {
    const topComment = await Comment.create({
      author: testUser._id,
      post: testPost._id,
      content: 'Top level comment',
      parentComment: null
    });

    expect(topComment.parentComment).toBeNull();

    const reply = await Comment.create({
      author: testUser._id,
      post: testPost._id,
      content: 'Reply to top comment',
      parentComment: topComment._id
    });

    expect(reply.parentComment.toString()).toBe(topComment._id.toString());
  });

  it('should validate author and post references', async () => {
    const commentNoAuthor = new Comment({
      post: testPost._id,
      content: 'Comment without author'
    });

    let error1;
    try {
      await commentNoAuthor.save();
    } catch (e) {
      error1 = e;
    }

    expect(error1).toBeDefined();
    expect(error1.errors.author).toBeDefined();

    const commentNoPost = new Comment({
      author: testUser._id,
      content: 'Comment without post'
    });

    let error2;
    try {
      await commentNoPost.save();
    } catch (e) {
      error2 = e;
    }

    expect(error2).toBeDefined();
    expect(error2.errors.post).toBeDefined();
  });

  it('should apply all defined indexes', async () => {
    const indexes = Comment.schema.indexes();
    
    // Check for post and parentComment index
    const postParentIndex = indexes.find(idx => 
      idx[0].post === 1 && idx[0].parentComment === 1
    );
    expect(postParentIndex).toBeDefined();

    // Check for post and createdAt index
    const postCreatedIndex = indexes.find(idx => 
      idx[0].post === 1 && idx[0].createdAt === -1
    );
    expect(postCreatedIndex).toBeDefined();

    // Check for author index
    const authorIndex = indexes.find(idx => idx[0].author === 1);
    expect(authorIndex).toBeDefined();
  });
});
