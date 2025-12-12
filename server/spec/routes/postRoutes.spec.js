const express = require("express");
const request = require("supertest");

const mongoHelper = require("../helpers/DBUtils");
const authHelper = require("../helpers/authHelper");
const postTestHelper = require("../helpers/postTestHelper");

const Post = require("../../models/Post");
const PostLike = require("../../models/PostLike");
const User = require("../../models/User");
const postRoutes = require("../../routes/postRoutes");

describe("Post routes integration", () => {
  let app;
  let testUser;
  let testUser2;
  let testPost;
  let testUserToken;
  let testUser2Token;

  beforeAll(async () => {
    await mongoHelper.connectToDB();
    
    // Create Express app with post routes
    app = express();
    app.use(express.json());
    app.use(postRoutes);
  });

  beforeEach(async () => {
    // Create test users with real JWT tokens
    const { user: user1, token: token1 } = await authHelper.createTestUser({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    });
    testUser = user1;
    testUserToken = token1;

    const { user: user2, token: token2 } = await authHelper.createTestUser({
      first_name: "Jane",
      last_name: "Smith", 
      email: "jane@example.com",
    });
    testUser2 = user2;
    testUser2Token = token2;

    // Create a test post
    testPost = await postTestHelper.createTestPost(testUser._id, {
      content: "Original test post content",
    });
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  describe("GET /posts - getAllPosts", () => {
    it("should return empty array when no posts exist", async () => {
      await mongoHelper.clearDatabase();

      const res = await request(app).get("/posts");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it("should return all posts when posts exist", async () => {
      // Create additional posts
      await postTestHelper.createMultipleTestPosts(testUser._id, 2);
      await postTestHelper.createTestPost(testUser2._id);

      const res = await request(app).get("/posts");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(4); // 1 from beforeEach + 2 + 1
    });

    it("should handle database errors gracefully", async () => {
      // Mock Post.find to throw an error
      const originalFind = Post.find;
      Post.find = jasmine.createSpy("find").and.throwError(new Error("Database error"));

      const res = await request(app).get("/posts");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Database error");

      // Restore original method
      Post.find = originalFind;
    });
  });

  describe("GET /posts/:id - getPostById", () => {
    it("should return post when valid ID is provided", async () => {
      const res = await request(app).get(`/posts/${testPost._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(testPost._id.toString());
      expect(res.body.data.content).toBe(testPost.content);
    });

    it("should return 404 when post does not exist", async () => {
      const nonExistentId = postTestHelper.generateNonExistentObjectId();

      const res = await request(app).get(`/posts/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("this post not found");
    });

    it("should return 500 when invalid ObjectId is provided", async () => {
      const invalidId = postTestHelper.generateInvalidObjectId();

      const res = await request(app).get(`/posts/${invalidId}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("this post not found");
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /posts - createPost", () => {
    it("should create post successfully with authentication", async () => {
      const postData = {
        content: "New test post content",
      };

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).post("/posts"),
        testUserToken
      ).send(postData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(postData.content);
      expect(res.body.data.author_id).toBe(testUser._id.toString());
      expect(res.body.data.likes_count).toBe(0);
      expect(res.body.data.comments_count).toBe(0);
    });

    it("should create post with media successfully", async () => {
      const postData = {
        content: "Post with media",
        media: [
          { url: "https://example.com/image.jpg", type: "photo" },
          { url: "https://example.com/video.mp4", type: "video" },
        ],
      };

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).post("/posts"),
        testUserToken
      ).send(postData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(postData.content);
      expect(res.body.data.media.length).toBe(2);
      expect(res.body.data.media[0].url).toBe(postData.media[0].url);
      expect(res.body.data.media[0].type).toBe(postData.media[0].type);
      expect(res.body.data.media[1].url).toBe(postData.media[1].url);
      expect(res.body.data.media[1].type).toBe(postData.media[1].type);
    });

    it("should return 400 when required content is missing", async () => {
      const postData = {}; // Missing required content

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).post("/posts"),
        testUserToken
      ).send(postData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid Data");
    });

    it("should fail without authentication", async () => {
      const postData = {
        content: "New test post content",
      };

      const res = await request(app).post("/posts").send(postData);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("No token provided");
    });
  });

  describe("PUT /posts/:id - updatePost", () => {
    it("should update post successfully by author", async () => {
      const updateData = {
        content: "Updated post content",
      };

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).put(`/posts/${testPost._id}`),
        testUserToken
      ).send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(updateData.content);
      expect(res.body.data._id).toBe(testPost._id.toString());
    });

    it("should return 403 when non-author tries to update", async () => {
      const updateData = {
        content: "Updated by different user",
      };

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).put(`/posts/${testPost._id}`),
        testUser2Token // Different user
      ).send(updateData);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized to update this post");
    });

    it("should return 404 when post does not exist", async () => {
      const nonExistentId = postTestHelper.generateNonExistentObjectId();
      const updateData = {
        content: "Updated content",
      };

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).put(`/posts/${nonExistentId}`),
        testUserToken
      ).send(updateData);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("this post not found");
    });

    it("should fail without authentication", async () => {
      const updateData = {
        content: "Updated content",
      };

      const res = await request(app)
        .put(`/posts/${testPost._id}`)
        .send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("No token provided");
    });
  });

  describe("DELETE /posts/:id - deletePost", () => {
    it("should delete post successfully by author", async () => {
      const res = await authHelper.makeAuthenticatedRequest(
        request(app).delete(`/posts/${testPost._id}`),
        testUserToken
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Post deleted successfully");

      // Verify post is actually deleted
      const deletedPost = await Post.findById(testPost._id);
      expect(deletedPost).toBe(null);
    });

    it("should return 403 when non-author tries to delete", async () => {
      const res = await authHelper.makeAuthenticatedRequest(
        request(app).delete(`/posts/${testPost._id}`),
        testUser2Token // Different user
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Unauthorized to delete this post");

      // Verify post still exists
      const existingPost = await Post.findById(testPost._id);
      expect(existingPost).not.toBe(null);
    });

    it("should return 404 when post does not exist", async () => {
      const nonExistentId = postTestHelper.generateNonExistentObjectId();

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).delete(`/posts/${nonExistentId}`),
        testUserToken
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Post not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app).delete(`/posts/${testPost._id}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("No token provided");
    });
  });

  describe("POST /posts/:id/like - toggleLikePost", () => {
    it("should like post successfully", async () => {
      const res = await authHelper.makeAuthenticatedRequest(
        request(app).post(`/posts/${testPost._id}/like`),
        testUser2Token // Different user liking
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Post liked successfully");
      expect(res.body.likes_count).toBe(1);

      // Verify like was created
      const like = await PostLike.findOne({
        post_id: testPost._id,
        user_id: testUser2._id,
      });
      expect(like).not.toBe(null);

      // Verify post likes_count was updated
      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.likes_count).toBe(1);
    });

    it("should unlike post when already liked", async () => {
      // First, create a like
      await postTestHelper.createPostLike(testPost._id, testUser2._id);

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).post(`/posts/${testPost._id}/like`),
        testUser2Token
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Post unliked successfully");
      expect(res.body.likes_count).toBe(0);

      // Verify like was removed
      const like = await PostLike.findOne({
        post_id: testPost._id,
        user_id: testUser2._id,
      });
      expect(like).toBe(null);

      // Verify post likes_count was updated
      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.likes_count).toBe(0);
    });

    it("should return 404 when post does not exist", async () => {
      const nonExistentId = postTestHelper.generateNonExistentObjectId();

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).post(`/posts/${nonExistentId}/like`),
        testUser2Token
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Post not found");
    });

    it("should handle likes_count properly when it becomes negative", async () => {
      // Set post likes_count to 0 and create a like record manually
      await Post.findByIdAndUpdate(testPost._id, { likes_count: 0 });
      await PostLike.create({ post_id: testPost._id, user_id: testUser2._id });

      const res = await authHelper.makeAuthenticatedRequest(
        request(app).post(`/posts/${testPost._id}/like`),
        testUser2Token
      );

      expect(res.status).toBe(200);
      expect(res.body.likes_count).toBe(0); // Should not go negative due to Math.max
    });

    it("should fail without authentication", async () => {
      const res = await request(app).post(`/posts/${testPost._id}/like`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("No token provided");
    });
  });

  describe("GET /posts/:id/likes - getPostLikes", () => {
    it("should return empty array when post has no likes", async () => {
      const res = await request(app).get(`/posts/${testPost._id}/likes`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it("should return likes with user information when likes exist", async () => {
      // Create likes from multiple users
      const users = await authHelper.createMultipleTestUsers(2);
      await postTestHelper.createMultiplePostLikes(testPost._id, [
        users[0].user._id,
        users[1].user._id,
      ]);

      const res = await request(app).get(`/posts/${testPost._id}/likes`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);

      // Check if user data is populated
      res.body.data.forEach((like) => {
        expect(like.user_id).toBeDefined();
        expect(like.user_id.first_name).toBeDefined();
        expect(like.user_id.last_name).toBeDefined();
        expect(like.user_id.password).toBeUndefined(); // Should not include password
      });
    });

    it("should handle non-existent post gracefully", async () => {
      const nonExistentId = postTestHelper.generateNonExistentObjectId();

      const res = await request(app).get(`/posts/${nonExistentId}/likes`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      // Mock PostLike.find to throw an error
      const originalFind = PostLike.find;
      PostLike.find = jasmine.createSpy("find").and.returnValue({
        populate: jasmine.createSpy("populate").and.throwError(new Error("Database error"))
      });

      const res = await request(app).get(`/posts/${testPost._id}/likes`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Database error");

      // Restore original method
      PostLike.find = originalFind;
    });
  });
});