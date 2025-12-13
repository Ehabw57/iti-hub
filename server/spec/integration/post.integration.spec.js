const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const PostSave = require('../../models/PostSave');
const Comment = require('../../models/Comment');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');

// Set JWT_SECRET for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'testts';
}

const app = require('../../app');

describe('Post Integration Tests', () => {
  let authToken;
  let testUser;
  let anotherUser;
  let anotherToken;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test user and get auth token
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'Password123',
        username: 'testuser',
        fullName: 'Test User'
      });
    
    authToken = registerRes.body.data.token;
    testUser = registerRes.body.data.user;

    // Create another user for testing interactions
    const anotherRegisterRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'another@example.com',
        password: 'Password123',
        username: 'anotheruser',
        fullName: 'Another User'
      });
    
    anotherToken = anotherRegisterRes.body.data.token;
    anotherUser = anotherRegisterRes.body.data.user;
  });

  describe('POST /posts - Create Post', () => {
    it('should create a post with content only', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is my first post!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.content).toBe('This is my first post!');
      expect(res.body.data.post.author).toBeDefined();
      expect(res.body.data.post.likesCount).toBe(0);
      expect(res.body.data.post.commentsCount).toBe(0);
    });

    it('should create a post with content and images', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Check out these images!',
          images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body.data.post.images.length).toBe(2);
    });

    it('should create a post with images only (no content)', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
          images: ['https://example.com/img1.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body.data.post.images.length).toBe(1);
    });

    it('should create a post with tags', async () => {
      const tagId1 = new mongoose.Types.ObjectId();
      const tagId2 = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post with tags',
          tags: [tagId1, tagId2]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.post.tags.length).toBe(2);
    });

    it('should return 400 if no content and no images', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
          images: []
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if content exceeds max length', async () => {
      const longContent = 'a'.repeat(5001);
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 if more than 10 images', async () => {
      const images = Array(11).fill('https://example.com/img.jpg');
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Too many images',
          images
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 if more than 5 tags', async () => {
      const tags = Array(6).fill(new mongoose.Types.ObjectId());
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Too many tags',
          tags
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/posts')
        .send({
          content: 'Unauthorized post'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /posts/:id - Get Post by ID', () => {
    let testPost;

    beforeEach(async () => {
      // Create a test post
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post for retrieval'
        });
      testPost = createRes.body.data.post;
    });

    it('should get a post by ID', async () => {
      const res = await request(app)
        .get(`/posts/${testPost._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.post._id).toBe(testPost._id);
      expect(res.body.data.post.content).toBe('Test post for retrieval');
    });

    it('should include isLiked and isSaved for authenticated user', async () => {
      const res = await request(app)
        .get(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.post.isLiked).toBeDefined();
      expect(res.body.data.post.isSaved).toBeDefined();
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/posts/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /posts/:id - Update Post', () => {
    let testPost;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Original content',
          images: ['https://example.com/img.jpg']
        });
      testPost = createRes.body.data.post;
    });

    it('should update post content', async () => {
      const res = await request(app)
        .patch(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.post.content).toBe('Updated content');
      expect(res.body.data.post.editedAt).toBeDefined();
    });

    it('should update post tags', async () => {
      const newTags = [new mongoose.Types.ObjectId()];
      const res = await request(app)
        .patch(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tags: newTags
        });

      expect(res.status).toBe(200);
      expect(res.body.data.post.tags.length).toBe(1);
    });

    it('should return 400 if trying to update images', async () => {
      const res = await request(app)
        .patch(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          images: ['https://example.com/newimg.jpg']
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot update');
    });

    it('should return 403 if not post owner', async () => {
      const res = await request(app)
        .patch(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          content: 'Trying to update someone elses post'
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/posts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Update'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /posts/:id - Delete Post', () => {
    let testPost;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post to be deleted'
        });
      testPost = createRes.body.data.post;
    });

    it('should delete own post', async () => {
      const res = await request(app)
        .delete(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);

      // Verify post is deleted
      const getRes = await request(app)
        .get(`/posts/${testPost._id}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 403 if not post owner', async () => {
      const res = await request(app)
        .delete(`/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/posts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /posts/:id/like - Like Post', () => {
    let testPost;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post to be liked'
        });
      testPost = createRes.body.data.post;
    });

    it('should like a post', async () => {
      const res = await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isLiked).toBe(true);
      expect(res.body.data.likesCount).toBe(1);
    });

    it('should not allow liking a post twice', async () => {
      // Like once
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to like again
      const res = await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/posts/${fakeId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /posts/:id/like - Unlike Post', () => {
    let testPost;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post to be unliked'
        });
      testPost = createRes.body.data.post;

      // Like the post first
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should unlike a post', async () => {
      const res = await request(app)
        .delete(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isLiked).toBe(false);
      expect(res.body.data.likesCount).toBe(0);
    });

    it('should return 400 if post not liked', async () => {
      // Unlike once
      await request(app)
        .delete(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to unlike again
      const res = await request(app)
        .delete(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /posts/:id/save - Save Post', () => {
    let testPost;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post to be saved'
        });
      testPost = createRes.body.data.post;
    });

    it('should save a post', async () => {
      const res = await request(app)
        .post(`/posts/${testPost._id}/save`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isSaved).toBe(true);
    });

    it('should not allow saving a post twice', async () => {
      await request(app)
        .post(`/posts/${testPost._id}/save`)
        .set('Authorization', `Bearer ${authToken}`);

      const res = await request(app)
        .post(`/posts/${testPost._id}/save`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /posts/:id/save - Unsave Post', () => {
    let testPost;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post to be unsaved'
        });
      testPost = createRes.body.data.post;

      // Save the post first
      await request(app)
        .post(`/posts/${testPost._id}/save`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should unsave a post', async () => {
      const res = await request(app)
        .delete(`/posts/${testPost._id}/save`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isSaved).toBe(false);
    });
  });

  describe('POST /posts/:id/repost - Repost', () => {
    let originalPost;

    beforeEach(async () => {
      // Create original post by another user
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          content: 'Original post to be reposted'
        });
      originalPost = createRes.body.data.post;
    });

    it('should repost with comment', async () => {
      const res = await request(app)
        .post(`/posts/${originalPost._id}/repost`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comment: 'Check this out!'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.post.originalPost._id).toBe(originalPost._id);
      expect(res.body.data.post.repostComment).toBe('Check this out!');
    });

    it('should repost without comment', async () => {
      const res = await request(app)
        .post(`/posts/${originalPost._id}/repost`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.post.originalPost._id).toBe(originalPost._id);
    });

    it('should return 400 if reposting own post', async () => {
      const res = await request(app)
        .post(`/posts/${originalPost._id}/repost`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/posts/${fakeId}/repost`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /posts/saved - Get Saved Posts', () => {
    beforeEach(async () => {
      // Create and save multiple posts
      for (let i = 0; i < 3; i++) {
        const createRes = await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${anotherToken}`)
          .send({
            content: `Post ${i + 1}`
          });

        await request(app)
          .post(`/posts/${createRes.body.data.post._id}/save`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    });

    it('should get saved posts', async () => {
      const res = await request(app)
        .get('/posts/saved')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(3);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should return empty array if no saved posts', async () => {
      const res = await request(app)
        .get('/posts/saved')
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(0);
    });
  });

  describe('GET /users/:userId/posts - Get User Posts', () => {
    beforeEach(async () => {
      // Create multiple posts for test user
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: `User post ${i + 1}`
          });
      }
    });

    it('should get posts for a user', async () => {
      const res = await request(app)
        .get(`/users/${testUser._id}/posts`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(3);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`/users/${testUser._id}/posts?page=1&limit=2`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
    });
  });
});
