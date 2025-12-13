const { blockUser, unblockUser } = require('../../../controllers/user/blockController');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('blockController', () => {
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

  describe('POST /users/:userId/block', () => {
    it('should successfully block a user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Successfully blocked user');
      expect(res.body.data.blockedUserId).toBe(user2._id.toString());
      expect(res.body.data.blockedAt).toBeDefined();
    });

    it('should create block connection in database', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'block'
      });

      expect(connection).toBeDefined();
      expect(connection.follower.toString()).toBe(user1._id.toString());
      expect(connection.following.toString()).toBe(user2._id.toString());
      expect(connection.type).toBe('block');
    });

    it('should reject blocking yourself', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user1._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot block yourself');
    });

    it('should reject blocking non-existent user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: '507f1f77bcf86cd799439011' }
      };
      const res = responseMock();

      await blockUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should reject duplicate block', async () => {
      // First block
      await Connection.createBlock(user1._id, user2._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Already blocking this user');
    });

    it('should remove follow relationship when blocking', async () => {
      // User1 follows User2
      await Connection.createFollow(user1._id, user2._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      // Follow should be removed
      const followExists = await Connection.isFollowing(user1._id, user2._id);
      expect(followExists).toBe(false);

      // Check counts were updated
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      expect(updatedUser1.followingCount).toBe(0);
      expect(updatedUser2.followersCount).toBe(0);
    });

    it('should remove follow relationships in both directions', async () => {
      // Mutual follows
      await Connection.createFollow(user1._id, user2._id);
      await Connection.createFollow(user2._id, user1._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      // Both follows should be removed
      const user1FollowsUser2 = await Connection.isFollowing(user1._id, user2._id);
      const user2FollowsUser1 = await Connection.isFollowing(user2._id, user1._id);
      
      expect(user1FollowsUser2).toBe(false);
      expect(user2FollowsUser1).toBe(false);

      // Check all counts are zero
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      expect(updatedUser1.followingCount).toBe(0);
      expect(updatedUser1.followersCount).toBe(0);
      expect(updatedUser2.followingCount).toBe(0);
      expect(updatedUser2.followersCount).toBe(0);
    });

    it('should not affect other follows when blocking', async () => {
      // User1 follows both User2 and User3
      await Connection.createFollow(user1._id, user2._id);
      await Connection.createFollow(user1._id, user3._id);

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      // User1 should still follow User3
      const stillFollowing = await Connection.isFollowing(user1._id, user3._id);
      expect(stillFollowing).toBe(true);
    });
  });

  describe('DELETE /users/:userId/block', () => {
    beforeEach(async () => {
      // Create a block relationship for unblock tests
      await Connection.createBlock(user1._id, user2._id);
    });

    it('should successfully unblock a user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unblockUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Successfully unblocked user');
      expect(res.body.data.unblockedUserId).toBe(user2._id.toString());
    });

    it('should remove block connection from database', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unblockUser(req, res);

      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'block'
      });

      expect(connection).toBeNull();
    });

    it('should reject unblocking yourself', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user1._id.toString() }
      };
      const res = responseMock();

      await unblockUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot unblock yourself');
    });

    it('should reject unblocking non-existent user', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: '507f1f77bcf86cd799439011' }
      };
      const res = responseMock();

      await unblockUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should reject unblocking when not blocking', async () => {
      const req = {
        user: { _id: user1._id },
        params: { userId: user3._id.toString() } // Never blocked user3
      };
      const res = responseMock();

      await unblockUser(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not blocking this user');
    });

    it('should allow following after unblocking', async () => {
      // Unblock
      const unblockReq = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const unblockRes = responseMock();
      await unblockUser(unblockReq, unblockRes);

      // Now follow should work
      await Connection.createFollow(user1._id, user2._id);

      const followExists = await Connection.isFollowing(user1._id, user2._id);
      expect(followExists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in blockUser', async () => {
      spyOn(User, 'findById').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await blockUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should handle database errors in unblockUser', async () => {
      await Connection.createBlock(user1._id, user2._id);

      spyOn(User, 'findById').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const res = responseMock();

      await unblockUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });
  });

  describe('Block-Unblock Cycle', () => {
    it('should allow re-blocking after unblocking', async () => {
      // Block
      const blockReq = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const blockRes = responseMock();
      await blockUser(blockReq, blockRes);

      // Unblock
      const unblockReq = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const unblockRes = responseMock();
      await unblockUser(unblockReq, unblockRes);

      // Block again
      const reblockReq = {
        user: { _id: user1._id },
        params: { userId: user2._id.toString() }
      };
      const reblockRes = responseMock();
      await blockUser(reblockReq, reblockRes);

      expect(reblockRes.statusCode).toBe(200);

      const blockExists = await Connection.isBlocking(user1._id, user2._id);
      expect(blockExists).toBe(true);
    });
  });
});
