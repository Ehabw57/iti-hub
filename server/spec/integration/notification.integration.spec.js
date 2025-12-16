const request = require("supertest");
const mongoose = require("mongoose");
const {
  connectToDB,
  disconnectFromDB,
  clearDatabase,
} = require("../helpers/DBUtils");
const Notification = require("../../models/Notification");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");

// Set JWT_SECRET for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "testts";
}

const app = require("../../app");

describe("Notification Integration Tests", () => {
  let user1Token, user2Token, user3Token;
  let user1, user2, user3;
  let testPost;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test users
    const user1Res = await request(app).post("/auth/register").send({
      email: "user1@test.com",
      password: "Password123",
      username: "user1",
      fullName: "User One",
    });
    user1Token = user1Res.body.data.token;
    user1 = user1Res.body.data.user;

    const user2Res = await request(app).post("/auth/register").send({
      email: "user2@test.com",
      password: "Password123",
      username: "user2",
      fullName: "User Two",
    });
    user2Token = user2Res.body.data.token;
    user2 = user2Res.body.data.user;

    const user3Res = await request(app).post("/auth/register").send({
      email: "user3@test.com",
      password: "Password123",
      username: "user3",
      fullName: "User Three",
    });
    user3Token = user3Res.body.data.token;
    user3 = user3Res.body.data.user;

    // Create a test post by user1
    const postRes = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        content: "Test post for notifications",
      });
    testPost = postRes.body.data.post;
  });

  describe("GET /notifications - Get Notifications", () => {
    it("should return empty array when user has no notifications", async () => {
      const res = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toEqual([]);
      expect(res.body.data.unreadCount).toBe(0);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it("should return notifications with populated actor and target", async () => {
      // User2 likes user1's post
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(1);
      
      const notification = res.body.data.notifications[0];
      expect(notification.type).toBe("like");
      expect(notification.actor.username).toBe("user2");
      expect(notification.target.content).toBe("Test post for notifications");
      expect(notification.isRead).toBe(false);
    });

    it("should support pagination", async () => {
      // Create multiple notifications by having user2 follow user1 multiple times
      // (follow creates individual notifications)
      for (let i = 0; i < 25; i++) {
        await Notification.createOrUpdateNotification(
          user1._id,
          user2._id,
          'follow',
          null
        );
      }

      // Get first page
      const res1 = await request(app)
        .get("/notifications?page=1&limit=10")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.notifications.length).toBe(10);
      expect(res1.body.data.pagination.page).toBe(1);
      expect(res1.body.data.pagination.totalPages).toBe(3);

      // Get second page
      const res2 = await request(app)
        .get("/notifications?page=2&limit=10")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.notifications.length).toBe(10);
      expect(res2.body.data.pagination.page).toBe(2);
    });

    it("should cap limit at 50", async () => {
      const res = await request(app)
        .get("/notifications?limit=100")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBeLessThanOrEqual(50);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/notifications");

      expect(res.status).toBe(401);
    });

    it("should only return notifications for authenticated user", async () => {
      // Create notification for user1
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user2Token}`);

      // User2 should not see user1's notifications
      const res = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(0);
    });
  });

  describe("GET /notifications/unread/count - Get Unread Count", () => {
    it("should return 0 when no unread notifications", async () => {
      const res = await request(app)
        .get("/notifications/unread/count")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it("should return correct unread count", async () => {
      // User2 likes the post
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user2Token}`);

      // User3 also likes the post (should be grouped)
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user3Token}`);

      const res = await request(app)
        .get("/notifications/unread/count")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(1); // Grouped notification
    });

    it("should not count read notifications", async () => {
      // Create and mark as read
      const notification = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );
      await Notification.markAsRead(notification._id, user1._id);

      const res = await request(app)
        .get("/notifications/unread/count")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/notifications/unread/count");

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /notifications/:id/read - Mark Notification as Read", () => {
    let notification;

    beforeEach(async () => {
      // User2 likes user1's post
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Get the notification
      const notificationsRes = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${user1Token}`);
      notification = notificationsRes.body.data.notifications[0];
    });

    it("should mark notification as read", async () => {
      const res = await request(app)
        .put(`/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notification.isRead).toBe(true);
    });

    it("should populate actor and target in response", async () => {
      const res = await request(app)
        .put(`/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.actor).toBeDefined();
      expect(res.body.data.notification.target).toBeDefined();
    });

    it("should return 404 for non-existent notification", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/notifications/${fakeId}/read`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 for invalid notification ID", async () => {
      const res = await request(app)
        .put("/notifications/invalid-id/read")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should not allow marking another user's notification", async () => {
      const res = await request(app)
        .put(`/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .put(`/notifications/${notification._id}/read`);

      expect(res.status).toBe(401);
    });

    it("should be idempotent", async () => {
      // Mark as read first time
      const res1 = await request(app)
        .put(`/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(res1.status).toBe(200);

      // Mark as read second time
      const res2 = await request(app)
        .put(`/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data.notification.isRead).toBe(true);
    });
  });

  describe("PUT /notifications/read - Mark All Notifications as Read", () => {
    beforeEach(async () => {
      // Create multiple notifications
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user2Token}`);

      await request(app)
        .post(`/users/${user1._id}/follow`)
        .set("Authorization", `Bearer ${user3Token}`);
    });

    it("should mark all notifications as read", async () => {
      const res = await request(app)
        .put("/notifications/read")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.modifiedCount).toBeGreaterThan(0);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it("should verify all notifications are read", async () => {
      await request(app)
        .put("/notifications/read")
        .set("Authorization", `Bearer ${user1Token}`);

      // Check unread count
      const countRes = await request(app)
        .get("/notifications/unread/count")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it("should return 0 modified when no unread notifications", async () => {
      // Mark all as read first
      await request(app)
        .put("/notifications/read")
        .set("Authorization", `Bearer ${user1Token}`);

      // Try again
      const res = await request(app)
        .put("/notifications/read")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.modifiedCount).toBe(0);
    });

    it("should only affect authenticated user's notifications", async () => {
      // User1 marks their notifications as read
      await request(app)
        .put("/notifications/read")
        .set("Authorization", `Bearer ${user1Token}`);

      // Create notification for user2
      await request(app)
        .post(`/users/${user2._id}/follow`)
        .set("Authorization", `Bearer ${user1Token}`);

      // User2 should still have unread notifications
      const countRes = await request(app)
        .get("/notifications/unread/count")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(countRes.body.data.unreadCount).toBeGreaterThan(0);
    });

    it("should require authentication", async () => {
      const res = await request(app).put("/notifications/read");

      expect(res.status).toBe(401);
    });
  });

  describe("Notification Triggers - End-to-End", () => {
    describe("Like Notifications", () => {
      it("should create notification when post is liked", async () => {
        await request(app)
          .post(`/posts/${testPost._id}/like`)
          .set("Authorization", `Bearer ${user2Token}`);

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(1);
        expect(notifications[0].type).toBe('like');
        expect(notifications[0].actor.toString()).toBe(user2._id);
      });

      it("should group like notifications on same post", async () => {
        // User2 likes
        await request(app)
          .post(`/posts/${testPost._id}/like`)
          .set("Authorization", `Bearer ${user2Token}`);

        // User3 likes
        await request(app)
          .post(`/posts/${testPost._id}/like`)
          .set("Authorization", `Bearer ${user3Token}`);

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(1);
        expect(notifications[0].actorCount).toBe(2);
        expect(notifications[0].actor.toString()).toBe(user3._id); // Most recent
      });

      it("should not create notification when user likes own post", async () => {
        await request(app)
          .post(`/posts/${testPost._id}/like`)
          .set("Authorization", `Bearer ${user1Token}`);

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(0);
      });
    });

    describe("Comment Notifications", () => {
      it("should create notification when post is commented on", async () => {
        await request(app)
          .post(`/posts/${testPost._id}/comments`)
          .set("Authorization", `Bearer ${user2Token}`)
          .send({ content: "Great post!" });

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(1);
        expect(notifications[0].type).toBe('comment');
      });

      it("should group comment notifications on same post", async () => {
        // User2 comments
        await request(app)
          .post(`/posts/${testPost._id}/comments`)
          .set("Authorization", `Bearer ${user2Token}`)
          .send({ content: "Nice!" });

        // User3 comments
        await request(app)
          .post(`/posts/${testPost._id}/comments`)
          .set("Authorization", `Bearer ${user3Token}`)
          .send({ content: "Cool!" });

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(1);
        expect(notifications[0].actorCount).toBe(2);
      });
    });

    describe("Reply Notifications", () => {
      it("should create notification when comment is replied to", async () => {
        // User2 comments on user1's post
        const commentRes = await request(app)
          .post(`/posts/${testPost._id}/comments`)
          .set("Authorization", `Bearer ${user2Token}`)
          .send({ content: "Nice post!" });

        const comment = commentRes.body.data.comment;

        // User3 replies to user2's comment
        await request(app)
          .post(`/posts/${testPost._id}/comments`)
          .set("Authorization", `Bearer ${user3Token}`)
          .send({
            content: "I agree!",
            parentCommentId: comment._id
          });

        const notifications = await Notification.find({ recipient: user2._id });
        expect(notifications.length).toBe(1);
        expect(notifications[0].type).toBe('reply');
      });
    });

    describe("Follow Notifications", () => {
      it("should create notification when user is followed", async () => {
        await request(app)
          .post(`/users/${user1._id}/follow`)
          .set("Authorization", `Bearer ${user2Token}`);

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(1);
        expect(notifications[0].type).toBe('follow');
        expect(notifications[0].target).toBeUndefined();
      });

      it("should NOT group follow notifications", async () => {
        // User2 follows user1
        await request(app)
          .post(`/users/${user1._id}/follow`)
          .set("Authorization", `Bearer ${user2Token}`);

        // User3 follows user1
        await request(app)
          .post(`/users/${user1._id}/follow`)
          .set("Authorization", `Bearer ${user3Token}`);

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(2); // Two separate notifications
      });
    });

    describe("Repost Notifications", () => {
      it("should create notification when post is reposted", async () => {
        await request(app)
          .post(`/posts/${testPost._id}/repost`)
          .set("Authorization", `Bearer ${user2Token}`);

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(1);
        expect(notifications[0].type).toBe('repost');
      });

      it("should NOT group repost notifications", async () => {
        // User2 reposts
        await request(app)
          .post(`/posts/${testPost._id}/repost`)
          .set("Authorization", `Bearer ${user2Token}`);

        // User3 reposts
        await request(app)
          .post(`/posts/${testPost._id}/repost`)
          .set("Authorization", `Bearer ${user3Token}`);

        const notifications = await Notification.find({ recipient: user1._id });
        expect(notifications.length).toBe(2); // Two separate notifications
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid notification ID format", async () => {
      const res = await request(app)
        .put("/notifications/invalid-id/read")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
    });

    it("should handle non-existent notification", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/notifications/${fakeId}/read`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
    });

    it("should handle invalid pagination parameters gracefully", async () => {
      const res = await request(app)
        .get("/notifications?page=invalid&limit=bad")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(20);
    });
  });

  describe("Mixed Notification Scenarios", () => {
    it("should handle complex interaction sequence", async () => {
      // User2 likes the post
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user2Token}`);

      // User3 comments on the post
      await request(app)
        .post(`/posts/${testPost._id}/comments`)
        .set("Authorization", `Bearer ${user3Token}`)
        .send({ content: "Nice!" });

      // User2 follows user1
      await request(app)
        .post(`/users/${user1._id}/follow`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBe(3);
      expect(res.body.data.unreadCount).toBe(3);
    });

    it("should handle marking some notifications as read", async () => {
      // Create multiple notifications
      await request(app)
        .post(`/posts/${testPost._id}/like`)
        .set("Authorization", `Bearer ${user2Token}`);

      await request(app)
        .post(`/users/${user1._id}/follow`)
        .set("Authorization", `Bearer ${user3Token}`);

      // Get notifications
      const listRes = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${user1Token}`);

      // Mark first one as read
      await request(app)
        .put(`/notifications/${listRes.body.data.notifications[0]._id}/read`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Check unread count
      const countRes = await request(app)
        .get("/notifications/unread/count")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(countRes.body.data.unreadCount).toBe(1);
    });
  });
});
