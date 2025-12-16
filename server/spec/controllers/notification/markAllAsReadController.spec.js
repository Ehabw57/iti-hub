const { markAllAsRead } = require('../../../controllers/notification/markAllAsReadController');
const User = require('../../../models/User');
const Post = require('../../../models/Post');
const Notification = require('../../../models/Notification');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('markAllAsReadController', () => {
  let user1, user2, user3, post1;

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
  });

  describe('PUT /notifications/read', () => {
    it('should mark all notifications as read', async () => {
      // Create multiple unread notifications
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
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All notifications marked as read');
      expect(res.body.data.modifiedCount).toBe(3);
    });

    it('should update all notifications in database', async () => {
      // Create notifications
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
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      // Verify all notifications are read
      const unreadCount = await Notification.getUnreadCount(user1._id);
      expect(unreadCount).toBe(0);
    });

    it('should only affect authenticated user\'s notifications', async () => {
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
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      // User1's notifications should be read
      const user1UnreadCount = await Notification.getUnreadCount(user1._id);
      expect(user1UnreadCount).toBe(0);

      // User2's notifications should still be unread
      const user2UnreadCount = await Notification.getUnreadCount(user2._id);
      expect(user2UnreadCount).toBe(1);
    });

    it('should return 0 modified when no unread notifications exist', async () => {
      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.modifiedCount).toBe(0);
    });

    it('should return 0 modified when all notifications already read', async () => {
      // Create and mark as read
      const notif = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );
      await Notification.markAsRead(notif._id, user1._id);

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.modifiedCount).toBe(0);
    });

    it('should be idempotent (calling multiple times)', async () => {
      // Create notifications
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id }
      };
      
      // First call
      let res = responseMock();
      await markAllAsRead(req, res);
      expect(res.body.data.modifiedCount).toBe(1);

      // Second call - should modify 0
      res = responseMock();
      await markAllAsRead(req, res);
      expect(res.body.data.modifiedCount).toBe(0);
    });

    it('should not affect read notifications', async () => {
      // Create and immediately mark one as read
      const notif1 = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'like',
        post1._id
      );
      await Notification.markAsRead(notif1._id, user1._id);

      // Create unread notification
      await Notification.createOrUpdateNotification(
        user1._id,
        user3._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      // Should only modify the one unread notification
      expect(res.body.data.modifiedCount).toBe(1);
      
      // Both should be read now
      const unreadCount = await Notification.getUnreadCount(user1._id);
      expect(unreadCount).toBe(0);
    });

    it('should handle database errors', async () => {
      spyOn(Notification, 'markAllAsRead').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should work with large number of notifications', async () => {
      // Create many notifications
      for (let i = 0; i < 50; i++) {
        await Notification.createOrUpdateNotification(
          user1._id,
          user2._id,
          'follow',
          null
        );
      }

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.modifiedCount).toBe(50);
      
      const unreadCount = await Notification.getUnreadCount(user1._id);
      expect(unreadCount).toBe(0);
    });

    it('should include unread count in response', async () => {
      // Create notifications
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );
      await Notification.createOrUpdateNotification(
        user1._id,
        user3._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await markAllAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.unreadCount).toBe(0);
    });
  });
});
