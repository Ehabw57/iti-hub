const { getUnreadCount } = require('../../../controllers/notification/getUnreadCountController');
const User = require('../../../models/User');
const Post = require('../../../models/Post');
const Notification = require('../../../models/Notification');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('getUnreadCountController', () => {
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

  describe('GET /notifications/unread/count', () => {
    it('should return 0 when user has no notifications', async () => {
      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await getUnreadCount(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('should return 0 when all notifications are read', async () => {
      // Create notifications and mark them as read
      const notif1 = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );
      const notif2 = await Notification.createOrUpdateNotification(
        user1._id,
        user3._id,
        'like',
        post1._id
      );

      await Notification.markAsRead(notif1._id, user1._id);
      await Notification.markAsRead(notif2._id, user1._id);

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await getUnreadCount(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('should return correct count when user has unread notifications', async () => {
      // Create multiple unread notifications
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
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'like',
        post1._id
      );

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await getUnreadCount(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.unreadCount).toBe(3);
    });

    it('should return correct count when user has mix of read and unread', async () => {
      // Create notifications
      const notif1 = await Notification.createOrUpdateNotification(
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
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'like',
        post1._id
      );

      // Mark one as read
      await Notification.markAsRead(notif1._id, user1._id);

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await getUnreadCount(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('should only count notifications for authenticated user', async () => {
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
      await Notification.createOrUpdateNotification(
        user2._id,
        user1._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await getUnreadCount(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.unreadCount).toBe(1); // Only user1's notification
    });

    it('should handle database errors', async () => {
      spyOn(Notification, 'getUnreadCount').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id }
      };
      const res = responseMock();

      await getUnreadCount(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should return lightweight response (no heavy data)', async () => {
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

      await getUnreadCount(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual({
        unreadCount: 1
      });
      // Should not include notifications array or other heavy data
      expect(res.body.data.notifications).toBeUndefined();
    });

    it('should update count after new notification is created', async () => {
      // Initial count
      let req = {
        user: { _id: user1._id }
      };
      let res = responseMock();
      await getUnreadCount(req, res);
      expect(res.body.data.unreadCount).toBe(0);

      // Create notification
      await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );

      // Check count again
      req = {
        user: { _id: user1._id }
      };
      res = responseMock();
      await getUnreadCount(req, res);
      expect(res.body.data.unreadCount).toBe(1);
    });
  });
});
