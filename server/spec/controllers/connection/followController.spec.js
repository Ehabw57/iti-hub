const { followUser, unfollowUser } = require('../../../controllers/connection/followController');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const Notification = require('../../../models/Notification');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('followController', () => {
  let user1, user2, user3;

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
      fullName: 'User One',
      followersCount: 0,
      followingCount: 0
    });

    user2 = await User.create({
      username: 'user2',
      email: 'user2@test.com',
      password: 'password123',
      fullName: 'User Two',
      followersCount: 0,
      followingCount: 0
    });

    user3 = await User.create({
      username: 'user3',
      email: 'user3@test.com',
      password: 'password123',
      fullName: 'User Three',
      followersCount: 0,
      followingCount: 0
    });
  });

  describe('POST /users/:userId/follow', () => {
    it('should successfully follow a user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Successfully followed user');
      expect(res.body.data.followedUserId).toBe(user2._id.toString());
      expect(res.body.data.followedAt).toBeDefined();
    });

    it('should create connection record in database', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });

      expect(connection).toBeDefined();
      expect(connection.follower.toString()).toBe(user1._id.toString());
      expect(connection.following.toString()).toBe(user2._id.toString());
    });

    it('should increment follower and following counts', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);

      expect(updatedUser1.followingCount).toBe(1);
      expect(updatedUser2.followersCount).toBe(1);
    });

    it('should reject following yourself', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user1._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot follow yourself');
    });

    it('should reject following non-existent user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: '507f1f77bcf86cd799439011' }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should reject duplicate follow', async () => {
      // First follow
      await Connection.createFollow(user1._id, user2._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Already following this user');
    });

    it('should reject following blocked user', async () => {
      // User2 blocks User1
      await Connection.createBlock(user2._id, user1._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot follow this user due to a block');
    });

    it('should reject following when requester has blocked target', async () => {
      // User1 blocks User2
      await Connection.createBlock(user1._id, user2._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Cannot follow this user due to a block');
    });

    it('should allow mutual follows', async () => {
      // User1 follows User2
      await Connection.createFollow(user1._id, user2._id);

      // User2 follows User1
      const req = {
        user: { _id: user2._id },
        params: { userId: user1._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(200);

      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);

      expect(updatedUser1.followersCount).toBe(1);
      expect(updatedUser1.followingCount).toBe(1);
      expect(updatedUser2.followersCount).toBe(1);
      expect(updatedUser2.followingCount).toBe(1);
    });

    it('should create a notification for the followed user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      const notification = await Notification.findOne({
        recipient: user2._id,
        type: 'follow'
      });

      expect(notification).toBeDefined();
      expect(notification.actor.toString()).toBe(user1._id.toString());
      expect(notification.type).toBe('follow');
      expect(notification.target).toBeUndefined();
      expect(notification.targetModel).toBeUndefined();
      expect(notification.actorCount).toBe(1);
      expect(notification.isRead).toBe(false);
    });

    it('should create individual notifications for each follow (not grouped)', async () => {
      // User1 follows User2
      const req1 = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res1 = responseMock();
      await followUser(req1, res1);

      // User3 also follows User2
      const req2 = {
        user: { _id: user3._id },
        params: { userId: user2._id.toString() }
      };
      const res2 = responseMock();
      await followUser(req2, res2);

      // Should have 2 separate notifications (follow is not grouped)
      const notifications = await Notification.find({
        recipient: user2._id,
        type: 'follow'
      });

      expect(notifications.length).toBe(2);
      expect(notifications[0].actor.toString()).toBe(user1._id.toString());
      expect(notifications[1].actor.toString()).toBe(user3._id.toString());
      expect(notifications[0].actorCount).toBe(1);
      expect(notifications[1].actorCount).toBe(1);
    });

    it('should still succeed even if notification creation fails', async () => {
      spyOn(Notification, 'createOrUpdateNotification').and.callFake(() => {
        return Promise.reject(new Error('Notification service down'));
      });

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Connection should still be created
      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id
      });
      expect(connection).toBeDefined();
    });
  });

  describe('DELETE /users/:userId/follow', () => {
    beforeEach(async () => {
      // Create a follow relationship for unfollow tests
      await Connection.createFollow(user1._id, user2._id);
    });

    it('should successfully unfollow a user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Successfully unfollowed user');
      expect(res.body.data.unfollowedUserId).toBe(user2._id.toString());
    });

    it('should remove connection record from database', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unfollowUser(req, res);

      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });

      expect(connection).toBeNull();
    });

    it('should decrement follower and following counts', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unfollowUser(req, res);

      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);

      expect(updatedUser1.followingCount).toBe(0);
      expect(updatedUser2.followersCount).toBe(0);
    });

    it('should reject unfollowing yourself', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user1._id.toString() }
      };
      const res = responseMock();

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot unfollow yourself');
    });

    it('should reject unfollowing non-existent user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: '507f1f77bcf86cd799439011' }
      };
      const res = responseMock();

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should reject unfollowing when not following', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user3._id.toString() } // Never followed user3
      };
      const res = responseMock();

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not following this user');
    });

    it('should not affect other relationships when unfollowing', async () => {
      // User1 also follows User3
      await Connection.createFollow(user1._id, user3._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unfollowUser(req, res);

      // Check User1 still follows User3
      const stillFollowing = await Connection.isFollowing(user1._id, user3._id);
      expect(stillFollowing).toBe(true);

      const updatedUser1 = await User.findById(user1._id);
      expect(updatedUser1.followingCount).toBe(1); // Should be 1, not 0
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in followUser', async () => {
      spyOn(User, 'findById').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await followUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should handle database errors in unfollowUser', async () => {
      await Connection.createFollow(user1._id, user2._id);

      spyOn(User, 'findById').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unfollowUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });
  });

  describe('Follow-Unfollow Cycle', () => {
    it('should allow re-following after unfollowing', async () => {
      // Follow
      const followReq = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const followRes = responseMock();
      await followUser(followReq, followRes);

      // Unfollow
      const unfollowReq = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const unfollowRes = responseMock();
      await unfollowUser(unfollowReq, unfollowRes);

      // Follow again
      const refollowReq = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const refollowRes = responseMock();
      await followUser(refollowReq, refollowRes);

      expect(refollowRes.statusCode).toBe(200);

      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);

      expect(updatedUser1.followingCount).toBe(1);
      expect(updatedUser2.followersCount).toBe(1);
    });
  });
});
