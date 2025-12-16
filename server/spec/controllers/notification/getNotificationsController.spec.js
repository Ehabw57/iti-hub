const { getNotifications } = require('../../../controllers/notification/getNotificationsController');
const User = require('../../../models/User');
const Post = require('../../../models/Post');
const Comment = require('../../../models/Comment');
const Notification = require('../../../models/Notification');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('getNotificationsController', () => {
  let user1, user2, user3, post1, comment1;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    user1 = await User.create({
      username: 'user1',
      email: 'user1@test.com',
      password: 'password123',
      fullName: 'User One'
    });

    user2 = await User.create({
      username: 'user2',
      email: 'user2@test.com',
      password: 'password123',
      fullName: 'User Two'
    });

    user3 = await User.create({
      username: 'user3',
      email: 'user3@test.com',
      password: 'password123',
      fullName: 'User Three'
    });

    post1 = await Post.create({
      author: user1._id,
      content: 'Test post',
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      savesCount: 0
    });

    comment1 = await Comment.create({
      author: user1._id,
      post: post1._id,
      content: 'Test comment',
      likesCount: 0
    });
  });

  describe('GET /notifications', () => {
    it('should return empty array when user has no notifications', async () => {
      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(20);
    });

    it('should return notifications for the authenticated user', async () => {
      // Create some notifications for user1
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'like',
        post1._id
      );
      await Notification.createOrUpdateNotification(
        user1._id,
        user3._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should populate actor information', async () => {
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'like',
        post1._id
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      const notification = res.body.data.notifications[0];
      expect(notification.actor).toBeDefined();
      expect(notification.actor.username).toBe('user2');
      expect(notification.actor.fullName).toBe('User Two');
      expect(notification.actor.password).toBeUndefined(); // Should not include password
    });

    it('should populate target post information', async () => {
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'like',
        post1._id
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      const notification = res.body.data.notifications[0];
      expect(notification.target).toBeDefined();
      expect(notification.target.content).toBe('Test post');
      expect(notification.targetModel).toBe('Post');
    });

    it('should populate target comment information', async () => {
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'comment_like',
        comment1._id
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      const notification = res.body.data.notifications[0];
      expect(notification.target).toBeDefined();
      expect(notification.target.content).toBe('Test comment');
      expect(notification.targetModel).toBe('Comment');
    });

    it('should return notifications in descending order by createdAt', async () => {
      // Create notifications with small delays to ensure different timestamps
      const notif1 = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const notif2 = await Notification.createOrUpdateNotification(
        user1._id,
        user3._id,
        'like',
        post1._id
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      const notifications = res.body.data.notifications;
      expect(notifications.length).toBe(2);
      // Most recent notification should be first
      expect(new Date(notifications[0].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(notifications[1].createdAt).getTime());
    });

    it('should support pagination with custom page and limit', async () => {
      // Create 5 notifications
      for (let i = 0; i < 5; i++) {
        await Notification.createOrUpdateNotification(
          user1._id,
          user2._id,
          'follow',
          null
        );
      }

      const req = {
        user: { _id: user1._id },
        query: { page: '2', limit: '2' }
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.notifications.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBe(5);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('should return empty array for page beyond available data', async () => {
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id },
        query: { page: '10', limit: '20' }
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.notifications).toEqual([]);
      expect(res.body.data.pagination.page).toBe(10);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('should use default pagination values when not provided', async () => {
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(20); // Default limit
    });

    it('should cap limit at maximum value', async () => {
      const req = {
        user: { _id: user1._id },
        query: { limit: '1000' } // Very large limit
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.pagination.limit).toBeLessThanOrEqual(50); // Should be capped at 50
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id },
        query: { page: 'invalid', limit: 'bad' }
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.pagination.page).toBe(1); // Default to 1
      expect(res.body.data.pagination.limit).toBe(20); // Default to 20
    });

    it('should only return notifications for authenticated user', async () => {
      // Create notifications for different users
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );
      await Notification.createOrUpdateNotification(
        user2._id,
        user3._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.notifications.length).toBe(1);
      expect(res.body.data.notifications[0].recipient.toString()).toBe(user1._id.toString());
    });

    it('should handle database errors', async () => {
      spyOn(Notification, 'countDocuments').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should include unread notifications count in response', async () => {
      // Create mix of read and unread notifications
      // Use like notification which is groupable, so we get exactly 2 notifications
      const notif1 = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'like',
        post1._id
      );
      
      // Create another like from different user on same post (will be grouped)
      await Notification.createOrUpdateNotification(
        user1._id,
        user3._id,
        'like',
        post1._id
      );
      
      // Create a follow notification (not grouped, separate notification)
      const notif2 = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );
      
      // Mark the grouped like notification as read
      await Notification.markAsRead(notif1._id, user1._id);

      const req = {
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getNotifications(req, res);

      expect(res.statusCode).toBe(200);
      // Should have 2 notifications: 1 grouped like (read), 1 follow (unread)
      expect(res.body.data.notifications.length).toBe(2);
      // Only the follow notification should be unread
      expect(res.body.data.unreadCount).toBe(1);
    });
  });
});
