const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const CommentLike = require('../../models/CommentLike');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');

// Set JWT_SECRET for tests if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
}

const app = require('../../app');

describe('Comment Integration Tests', () => {
  let token1, token2, adminToken;
  let userId1, userId2, adminUserId;
  let testPost;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Register test users
    const user1Res = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'Password123',
        fullName: 'Test User 1'
      });
    
    token1 = user1Res.body.data.token;
    userId1 = user1Res.body.data.user._id;

    const user2Res = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'Password123',
        fullName: 'Test User 2'
      });
    
    token2 = user2Res.body.data.token;
    userId2 = user2Res.body.data.user._id;

    // Create admin user directly in DB
    const adminUser = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'Password123',
      fullName: 'Admin User',
      role: 'admin'
    });
    adminUserId = adminUser._id;

    // Login as admin to get token
    const adminLoginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123'
      });
    
    adminToken = adminLoginRes.body.data.token;

    // Create a test post
    testPost = await Post.create({
      author: userId1,
      content: 'Test post for comments'
    });
  });

  describe('POST /posts/:postId/comments - Create Comment', () => {
    it('should create a top-level comment', async () => {
      const res = await request(app)
        .post(`/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'This is a test comment' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Comment created successfully');
      expect(res.body.data.comment.content).toBe('This is a test comment');
      expect(res.body.data.comment.author._id.toString()).toBe(userId1.toString());
      expect(res.body.data.comment.parentComment).toBeNull();

      // Verify post commentsCount incremented
      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.commentsCount).toBe(1);
    });

    it('should create a reply to a comment', async () => {
      // Create parent comment first
      const parentComment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Parent comment'
      });

      const res = await request(app)
        .post(`/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ 
          content: 'This is a reply',
          parentCommentId: parentComment._id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('This is a reply');
      expect(res.body.data.comment.parentComment.toString()).toBe(parentComment._id.toString());

      // Verify parent repliesCount incremented
      const updatedParent = await Comment.findById(parentComment._id);
      expect(updatedParent.repliesCount).toBe(1);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/posts/${testPost._id}/comments`)
        .send({ content: 'Test comment' });

      expect(res.status).toBe(401);
    });

    it('should return 404 if post not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/posts/${fakeId}/comments`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test comment' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Post not found');
    });

    it('should return 400 if content is too short', async () => {
      const res = await request(app)
        .post(`/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Content must be at least');
    });

    it('should return 400 if trying to reply to a reply', async () => {
      // Create parent and reply
      const parentComment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Parent comment'
      });

      const replyComment = await Comment.create({
        author: userId2,
        post: testPost._id,
        content: 'Reply comment',
        parentComment: parentComment._id
      });

      // Try to reply to the reply
      const res = await request(app)
        .post(`/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
          content: 'Reply to reply',
          parentCommentId: replyComment._id
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot reply to a reply');
    });
  });

  describe('GET /posts/:postId/comments - Get Comments', () => {
    it('should get all top-level comments for a post', async () => {
      // Create comments
      await Comment.create([
        { author: userId1, post: testPost._id, content: 'Comment 1' },
        { author: userId2, post: testPost._id, content: 'Comment 2' }
      ]);

      const res = await request(app)
        .get(`/posts/${testPost._id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should get replies for a specific comment', async () => {
      // Create parent comment
      const parentComment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Parent comment'
      });

      // Create replies
      await Comment.create([
        { author: userId2, post: testPost._id, content: 'Reply 1', parentComment: parentComment._id },
        { author: userId1, post: testPost._id, content: 'Reply 2', parentComment: parentComment._id }
      ]);

      const res = await request(app)
        .get(`/posts/${testPost._id}/comments?parentCommentId=${parentComment._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments.length).toBe(2);
      expect(res.body.data.comments[0].parentComment.toString()).toBe(parentComment._id.toString());
    });

    it('should include isLiked flag for authenticated user', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      // Like the comment
      await CommentLike.create({
        user: userId2,
        comment: comment._id
      });

      const res = await request(app)
        .get(`/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.data.comments[0].isLiked).toBe(true);
    });

    it('should support pagination', async () => {
      // Create 25 comments
      const comments = Array.from({ length: 25 }, (_, i) => ({
        author: userId1,
        post: testPost._id,
        content: `Comment ${i + 1}`
      }));
      await Comment.create(comments);

      const res = await request(app)
        .get(`/posts/${testPost._id}/comments?page=2&limit=10`);

      expect(res.status).toBe(200);
      expect(res.body.data.comments.length).toBe(10);
      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.pagination.pages).toBe(3);
    });

    it('should return 404 if post not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/posts/${fakeId}/comments`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Post not found');
    });
  });

  describe('PUT /comments/:id - Update Comment', () => {
    it('should update own comment', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Original content'
      });

      const res = await request(app)
        .put(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Updated content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('Updated content');
      expect(res.body.data.comment.editedAt).toBeDefined();
    });

    it('should allow admin to update any comment', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Original content'
      });

      const res = await request(app)
        .put(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Updated by admin' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('Updated by admin');
    });

    it('should return 403 if not authorized', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Original content'
      });

      const res = await request(app)
        .put(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Trying to update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized to update this comment');
    });

    it('should return 400 if trying to update invalid fields', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Original content'
      });

      const res = await request(app)
        .put(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
          content: 'Updated content',
          likesCount: 100
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot update fields');
    });

    it('should return 404 if comment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/comments/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Updated content' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found');
    });
  });

  describe('DELETE /comments/:id - Delete Comment', () => {
    it('should delete own comment', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      const res = await request(app)
        .delete(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Comment deleted successfully');

      // Verify comment is deleted
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    it('should delete top-level comment and all its replies', async () => {
      const parentComment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Parent comment'
      });

      await Comment.create([
        { author: userId2, post: testPost._id, content: 'Reply 1', parentComment: parentComment._id },
        { author: userId1, post: testPost._id, content: 'Reply 2', parentComment: parentComment._id }
      ]);

      // Update post commentsCount
      await Post.findByIdAndUpdate(testPost._id, { commentsCount: 3 });

      const res = await request(app)
        .delete(`/comments/${parentComment._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);

      // Verify all replies are deleted
      const remainingComments = await Comment.countDocuments({ post: testPost._id });
      expect(remainingComments).toBe(0);

      // Verify post commentsCount updated
      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.commentsCount).toBe(0);
    });

    it('should delete reply and update parent repliesCount', async () => {
      const parentComment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Parent comment',
        repliesCount: 1
      });

      const replyComment = await Comment.create({
        author: userId2,
        post: testPost._id,
        content: 'Reply comment',
        parentComment: parentComment._id
      });

      // Update post commentsCount
      await Post.findByIdAndUpdate(testPost._id, { commentsCount: 2 });

      const res = await request(app)
        .delete(`/comments/${replyComment._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);

      // Verify parent repliesCount decremented
      const updatedParent = await Comment.findById(parentComment._id);
      expect(updatedParent.repliesCount).toBe(0);

      // Verify post commentsCount decremented
      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.commentsCount).toBe(1);
    });

    it('should delete all likes when deleting comment', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      // Create likes
      await CommentLike.create([
        { user: userId1, comment: comment._id },
        { user: userId2, comment: comment._id }
      ]);

      const res = await request(app)
        .delete(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);

      // Verify likes are deleted
      const remainingLikes = await CommentLike.countDocuments({ comment: comment._id });
      expect(remainingLikes).toBe(0);
    });

    it('should allow admin to delete any comment', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      const res = await request(app)
        .delete(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 if not authorized', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      const res = await request(app)
        .delete(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized to delete this comment');
    });

    it('should return 404 if comment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/comments/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found');
    });
  });

  describe('POST /comments/:id/like - Like Comment', () => {
    it('should like a comment', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      const res = await request(app)
        .post(`/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Comment liked successfully');
      expect(res.body.data.isLiked).toBe(true);
      expect(res.body.data.likesCount).toBe(1);

      // Verify like was created
      const like = await CommentLike.findOne({ user: userId2, comment: comment._id });
      expect(like).not.toBeNull();

      // Verify comment likesCount incremented
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likesCount).toBe(1);
    });

    it('should return 400 if already liked', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      await CommentLike.create({
        user: userId2,
        comment: comment._id
      });

      const res = await request(app)
        .post(`/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Comment already liked');
    });

    it('should return 404 if comment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/comments/${fakeId}/like`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found');
    });

    it('should return 401 if not authenticated', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      const res = await request(app)
        .post(`/comments/${comment._id}/like`);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /comments/:id/like - Unlike Comment', () => {
    it('should unlike a comment', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment',
        likesCount: 1
      });

      await CommentLike.create({
        user: userId2,
        comment: comment._id
      });

      const res = await request(app)
        .delete(`/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Comment unliked successfully');
      expect(res.body.data.isLiked).toBe(false);
      expect(res.body.data.likesCount).toBe(0);

      // Verify like was deleted
      const like = await CommentLike.findOne({ user: userId2, comment: comment._id });
      expect(like).toBeNull();

      // Verify comment likesCount decremented
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.likesCount).toBe(0);
    });

    it('should return 400 if not liked', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      const res = await request(app)
        .delete(`/comments/${comment._id}/like`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Comment not liked');
    });

    it('should return 404 if comment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/comments/${fakeId}/like`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found');
    });

    it('should return 401 if not authenticated', async () => {
      const comment = await Comment.create({
        author: userId1,
        post: testPost._id,
        content: 'Test comment'
      });

      const res = await request(app)
        .delete(`/comments/${comment._id}/like`);

      expect(res.status).toBe(401);
    });
  });
});
