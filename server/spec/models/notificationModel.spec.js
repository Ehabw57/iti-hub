const mongoHelper = require('../helpers/DBUtils');
const mongoose = require('mongoose');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const { NOTIFICATION_TYPES } = require('../../utils/constants');

describe('Notification Model', () => {
  let testUser1, testUser2, testPost, testComment;

  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    // Create test users
    testUser1 = await User.create({
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'Password123!',
      fullName: 'Test User 1'
    });

    testUser2 = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'Password123!',
      fullName: 'Test User 2'
    });

    // Create test post
    testPost = await Post.create({
      author: testUser1._id,
      content: 'Test post for notifications'
    });

    // Create test comment
    testComment = await Comment.create({
      author: testUser1._id,
      post: testPost._id,
      content: 'Test comment'
    });
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  describe('Schema Validation', () => {
    it('should require recipient field', async () => {
      const notification = new Notification({
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id
      });

      let error;
      try {
        await notification.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.recipient).toBeDefined();
    });

    it('should require actor field', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id
      });

      let error;
      try {
        await notification.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.actor).toBeDefined();
    });

    it('should require type field', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        target: testPost._id
      });

      let error;
      try {
        await notification.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    it('should validate type enum values', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: 'invalid_type',
        target: testPost._id
      });

      let error;
      try {
        await notification.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    it('should require target for like type', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.LIKE
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.target).toBeDefined();
    });

    it('should require target for comment type', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.COMMENT
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.target).toBeDefined();
    });

    it('should require target for reply type', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.REPLY
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.target).toBeDefined();
    });

    it('should require target for repost type', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.REPOST
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.target).toBeDefined();
    });

    it('should require target for comment_like type', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.COMMENT_LIKE
      });

      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.target).toBeDefined();
    });

    it('should not require target for follow type', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.FOLLOW
      });

      let error;
      try {
        await notification.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeUndefined();
    });

    it('should default isRead to false', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id
      });

      expect(notification.isRead).toBe(false);
    });

    it('should default actorCount to 1', async () => {
      const notification = new Notification({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id
      });

      expect(notification.actorCount).toBe(1);
    });

    it('should auto-set createdAt and updatedAt', async () => {
      const notification = await Notification.create({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id
      });

      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Static Method: isGroupableType', () => {
    it('should return true for like type', () => {
      expect(Notification.isGroupableType(NOTIFICATION_TYPES.LIKE)).toBe(true);
    });

    it('should return true for comment type', () => {
      expect(Notification.isGroupableType(NOTIFICATION_TYPES.COMMENT)).toBe(true);
    });

    it('should return true for reply type', () => {
      expect(Notification.isGroupableType(NOTIFICATION_TYPES.REPLY)).toBe(true);
    });

    it('should return true for comment_like type', () => {
      expect(Notification.isGroupableType(NOTIFICATION_TYPES.COMMENT_LIKE)).toBe(true);
    });

    it('should return false for repost type', () => {
      expect(Notification.isGroupableType(NOTIFICATION_TYPES.REPOST)).toBe(false);
    });

    it('should return false for follow type', () => {
      expect(Notification.isGroupableType(NOTIFICATION_TYPES.FOLLOW)).toBe(false);
    });
  });

  describe('Static Method: createOrUpdateNotification', () => {
    describe('Like notifications', () => {
      it('should create like notification (first time)', async () => {
        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        expect(notification).toBeDefined();
        expect(notification.recipient.toString()).toBe(testUser1._id.toString());
        // Actor may be populated as an object or just an ID
        const actorId = notification.actor._id || notification.actor;
        expect(actorId.toString()).toBe(testUser2._id.toString());
        expect(notification.type).toBe(NOTIFICATION_TYPES.LIKE);
        // Target may be populated as an object or just an ID
        const targetId = notification.target._id || notification.target;
        expect(targetId.toString()).toBe(testPost._id.toString());
        expect(notification.actorCount).toBe(1);
        expect(notification.isRead).toBe(false);
      });

      it('should update existing like notification (group)', async () => {
        // First like
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        // Create another user
        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        // Second like from different user
        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        expect(notification.actorCount).toBe(2);
        // Actor may be populated as an object or just an ID
        const actorId = notification.actor._id || notification.actor;
        expect(actorId.toString()).toBe(testUser3._id.toString());
        expect(notification.isRead).toBe(false);

        // Verify only one notification exists
        const count = await Notification.countDocuments({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.LIKE,
          target: testPost._id
        });
        expect(count).toBe(1);
      });

      it('should increment actorCount on grouping', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        const users = [];
        for (let i = 0; i < 3; i++) {
          const user = await User.create({
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: 'Password123!',
            fullName: `User ${i}`
          });
          users.push(user);
          
          await Notification.createOrUpdateNotification(
            testUser1._id,
            user._id,
            NOTIFICATION_TYPES.LIKE,
            testPost._id
          );
        }

        const notification = await Notification.findOne({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.LIKE,
          target: testPost._id
        });

        expect(notification.actorCount).toBe(4); // 1 initial + 3 new
      });

      it('should update actor to most recent', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        const notification = await Notification.findOne({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.LIKE,
          target: testPost._id
        });

        expect(notification.actor.toString()).toBe(testUser3._id.toString());
      });

      it('should update timestamps on grouping', async () => {
        const firstNotification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        const firstUpdatedAt = firstNotification.updatedAt;

        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 100));

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        const updatedNotification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        expect(updatedNotification.updatedAt.getTime()).toBeGreaterThan(firstUpdatedAt.getTime());
      });

      it('should set isRead to false on grouping', async () => {
        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        // Mark as read
        notification.isRead = true;
        await notification.save();

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        // New like should make it unread again
        const updatedNotification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        expect(updatedNotification.isRead).toBe(false);
      });

      it('should group notifications for same post', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        const count = await Notification.countDocuments({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.LIKE,
          target: testPost._id
        });

        expect(count).toBe(1);
      });

      it('should not group notifications for different posts', async () => {
        const testPost2 = await Post.create({
          author: testUser1._id,
          content: 'Second test post'
        });

        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost2._id
        );

        const count = await Notification.countDocuments({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.LIKE
        });

        expect(count).toBe(2);
      });
    });

    describe('Comment notifications', () => {
      it('should create comment notification', async () => {
        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.COMMENT,
          testPost._id
        );

        expect(notification).toBeDefined();
        expect(notification.type).toBe(NOTIFICATION_TYPES.COMMENT);
        expect(notification.actorCount).toBe(1);
      });

      it('should group comment notifications', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.COMMENT,
          testPost._id
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.COMMENT,
          testPost._id
        );

        expect(notification.actorCount).toBe(2);
      });
    });

    describe('Reply notifications', () => {
      it('should create reply notification', async () => {
        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.REPLY,
          testComment._id
        );

        expect(notification).toBeDefined();
        expect(notification.type).toBe(NOTIFICATION_TYPES.REPLY);
        // Target may be populated as an object or just an ID
        const targetId = notification.target._id || notification.target;
        expect(targetId.toString()).toBe(testComment._id.toString());
      });

      it('should group reply notifications', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.REPLY,
          testComment._id
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.REPLY,
          testComment._id
        );

        expect(notification.actorCount).toBe(2);

        const count = await Notification.countDocuments({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.REPLY,
          target: testComment._id
        });
        expect(count).toBe(1);
      });
    });

    describe('Comment like notifications', () => {
      it('should create comment_like notification', async () => {
        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.COMMENT_LIKE,
          testComment._id
        );

        expect(notification).toBeDefined();
        expect(notification.type).toBe(NOTIFICATION_TYPES.COMMENT_LIKE);
      });

      it('should group comment_like notifications', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.COMMENT_LIKE,
          testComment._id
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.COMMENT_LIKE,
          testComment._id
        );

        expect(notification.actorCount).toBe(2);
      });
    });

    describe('Repost notifications (non-groupable)', () => {
      it('should NOT group repost notifications', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.REPOST,
          testPost._id
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.REPOST,
          testPost._id
        );

        const count = await Notification.countDocuments({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.REPOST
        });

        expect(count).toBe(2);
      });

      it('should create separate notification for each repost', async () => {
        const notification1 = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.REPOST,
          testPost._id
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        const notification2 = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.REPOST,
          testPost._id
        );

        expect(notification1._id.toString()).not.toBe(notification2._id.toString());
        expect(notification1.actorCount).toBe(1);
        expect(notification2.actorCount).toBe(1);
      });
    });

    describe('Follow notifications (non-groupable)', () => {
      it('should NOT group follow notifications', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.FOLLOW,
          null
        );

        const testUser3 = await User.create({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'Password123!',
          fullName: 'Test User 3'
        });

        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser3._id,
          NOTIFICATION_TYPES.FOLLOW,
          null
        );

        const count = await Notification.countDocuments({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.FOLLOW
        });

        expect(count).toBe(2);
      });
    });

    describe('Edge cases', () => {
      it('should prevent self-notification', async () => {
        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser1._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        expect(notification).toBeNull();
      });

      it('should prevent duplicate from same actor', async () => {
        await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        const notification = await Notification.createOrUpdateNotification(
          testUser1._id,
          testUser2._id,
          NOTIFICATION_TYPES.LIKE,
          testPost._id
        );

        // Should return existing notification without changing actorCount
        expect(notification.actorCount).toBe(1);

        const count = await Notification.countDocuments({
          recipient: testUser1._id,
          type: NOTIFICATION_TYPES.LIKE,
          target: testPost._id
        });
        expect(count).toBe(1);
      });

      it('should validate required fields per type', async () => {
        // Like without target should fail
        let error;
        try {
          await Notification.createOrUpdateNotification(
            testUser1._id,
            testUser2._id,
            NOTIFICATION_TYPES.LIKE,
            null
          );
        } catch (err) {
          error = err;
        }
        
        expect(error).toBeDefined();
      });

      it('should reject invalid recipient', async () => {
        let error;
        try {
          await Notification.createOrUpdateNotification(
            'invalid_id',
            testUser2._id,
            NOTIFICATION_TYPES.LIKE,
            testPost._id
          );
        } catch (err) {
          error = err;
        }
        
        expect(error).toBeDefined();
      });

      it('should reject invalid actor', async () => {
        let error;
        try {
          await Notification.createOrUpdateNotification(
            testUser1._id,
            'invalid_id',
            NOTIFICATION_TYPES.LIKE,
            testPost._id
          );
        } catch (err) {
          error = err;
        }
        
        expect(error).toBeDefined();
      });
    });
  });

  describe('Static Method: getUnreadCount', () => {
    it('should return correct count', async () => {
      await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id,
        isRead: false
      });

      await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.FOLLOW,
        isRead: false
      });

      const count = await Notification.getUnreadCount(testUser1._id);
      expect(count).toBe(2);
    });

    it('should return 0 if no unread', async () => {
      await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id,
        isRead: true
      });

      const count = await Notification.getUnreadCount(testUser1._id);
      expect(count).toBe(0);
    });
  });

  describe('Static Method: markAsRead', () => {
    it('should update isRead to true', async () => {
      const notification = await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id,
        isRead: false
      });

      const result = await Notification.markAsRead(notification._id, testUser1._id);
      
      expect(result).toBeDefined();
      expect(result.isRead).toBe(true);
    });

    it('should only mark user\'s notification', async () => {
      const notification = await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id,
        isRead: false
      });

      // Try to mark as read by different user
      const result = await Notification.markAsRead(notification._id, testUser2._id);
      
      expect(result).toBeNull();

      // Verify it's still unread
      const unchangedNotification = await Notification.findById(notification._id);
      expect(unchangedNotification.isRead).toBe(false);
    });
  });

  describe('Static Method: markAllAsRead', () => {
    it('should mark all user notifications', async () => {
      await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id,
        isRead: false
      });

      await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.FOLLOW,
        isRead: false
      });

      const result = await Notification.markAllAsRead(testUser1._id);
      
      expect(result.modifiedCount).toBe(2);

      const unreadCount = await Notification.countDocuments({
        recipient: testUser1._id,
        isRead: false
      });
      expect(unreadCount).toBe(0);
    });

    it('should not affect other users', async () => {
      await Notification.create({
        recipient: testUser1._id,
        actor: testUser2._id,
        type: NOTIFICATION_TYPES.LIKE,
        target: testPost._id,
        isRead: false
      });

      await Notification.create({
        recipient: testUser2._id,
        actor: testUser1._id,
        type: NOTIFICATION_TYPES.FOLLOW,
        isRead: false
      });

      await Notification.markAllAsRead(testUser1._id);

      const user2UnreadCount = await Notification.countDocuments({
        recipient: testUser2._id,
        isRead: false
      });
      expect(user2UnreadCount).toBe(1);
    });
  });
});
