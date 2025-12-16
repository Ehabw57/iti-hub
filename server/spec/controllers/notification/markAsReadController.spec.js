const { markAsRead } = require('../../../controllers/notification/markAsReadController');
const User = require('../../../models/User');
const Post = require('../../../models/Post');
const Notification = require('../../../models/Notification');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('markAsReadController', () => {
  let user1, user2, post1, notification1;

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

    post1 = await Post.create({
      author: user1._id,
      content: 'Test post',
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      savesCount: 0
    });

    notification1 = await Notification.createOrUpdateNotification(
      user1._id,
      user2._id,
      'like',
      post1._id
    );
  });

  describe('PUT /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const req = {
        user: { _id: user1._id },
        params: { id: notification1._id.toString() }
      };
      const res = responseMock();

      await markAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notification marked as read');
      expect(res.body.data.notification.isRead).toBe(true);
    });

    it('should update notification in database', async () => {
      const req = {
        user: { _id: user1._id },
        params: { id: notification1._id.toString() }
      };
      const res = responseMock();

      await markAsRead(req, res);

      const updatedNotification = await Notification.findById(notification1._id);
      expect(updatedNotification.isRead).toBe(true);
    });

    it('should not affect other notifications', async () => {
      // Create another notification
      const notification2 = await Notification.createOrUpdateNotification(
        user1._id,
        user2._id,
        'follow',
        null
      );

      const req = {
        user: { _id: user1._id },
        params: { id: notification1._id.toString() }
      };
      const res = responseMock();

      await markAsRead(req, res);

      // Check that notification2 is still unread
      const stillUnread = await Notification.findById(notification2._id);
      expect(stillUnread.isRead).toBe(false);
    });

    it('should be idempotent (marking already read notification)', async () => {
      // Mark as read first time
      await Notification.markAsRead(notification1._id, user1._id);

      const req = {
        user: { _id: user1._id },
        params: { id: notification1._id.toString() }
      };
      const res = responseMock();

      await markAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notification.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const req = {
        user: { _id: user1._id },
        params: { id: '507f1f77bcf86cd799439011' }
      };
      const res = responseMock();

      await markAsRead(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Notification not found');
    });

    it('should return 403 when trying to mark another user\'s notification', async () => {
      // notification1 belongs to user1, try to mark it with user2
      const req = {
        user: { _id: user2._id },
        params: { id: notification1._id.toString() }
      };
      const res = responseMock();

      await markAsRead(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Notification not found');
      
      // Verify notification is still unread
      const unchangedNotification = await Notification.findById(notification1._id);
      expect(unchangedNotification.isRead).toBe(false);
    });

    it('should return 400 for invalid notification ID format', async () => {
      const req = {
        user: { _id: user1._id },
        params: { id: 'invalid-id' }
      };
      const res = responseMock();

      await markAsRead(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid notification ID');
    });

    it('should handle database errors', async () => {
      spyOn(Notification, 'markAsRead').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id },
        params: { id: notification1._id.toString() }
      };
      const res = responseMock();

      await markAsRead(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should populate actor and target in response', async () => {
      const req = {
        user: { _id: user1._id },
        params: { id: notification1._id.toString() }
      };
      const res = responseMock();

      await markAsRead(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.notification.actor).toBeDefined();
      expect(res.body.data.notification.target).toBeDefined();
    });
  });
});
