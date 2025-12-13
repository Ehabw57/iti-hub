const mongoose = require('mongoose');
const Connection = require('../../models/Connection');
const User = require('../../models/User');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../helpers/DBUtils');

describe('Connection Model', () => {
  let user1, user2, user3;

  beforeAll(async () => {
    await connectToDB();
    await Connection.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    // Create test users
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

  afterEach(async () => {
    await Connection.deleteMany({});
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a follow connection with valid data', async () => {
      const connection = await Connection.create({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });

      expect(connection.follower.toString()).toBe(user1._id.toString());
      expect(connection.following.toString()).toBe(user2._id.toString());
      expect(connection.type).toBe('follow');
      expect(connection.createdAt).toBeDefined();
      expect(connection.updatedAt).toBeDefined();
    });

    it('should create a block connection with valid data', async () => {
      const connection = await Connection.create({
        follower: user1._id,
        following: user2._id,
        type: 'block'
      });

      expect(connection.type).toBe('block');
    });

    it('should require follower field', async () => {
      try {
        await Connection.create({
          following: user2._id,
          type: 'follow'
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.follower).toBeDefined();
      }
    });

    it('should require following field', async () => {
      try {
        await Connection.create({
          follower: user1._id,
          type: 'follow'
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.following).toBeDefined();
      }
    });

    it('should default type to follow', async () => {
      const connection = await Connection.create({
        follower: user1._id,
        following: user2._id
      });

      expect(connection.type).toBe('follow');
    });

    it('should reject invalid type values', async () => {
      try {
        await Connection.create({
          follower: user1._id,
          following: user2._id,
          type: 'invalid'
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should enforce unique constraint on follower-following-type combination', async () => {
      await Connection.create({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });

      try {
        await Connection.create({
          follower: user1._id,
          following: user2._id,
          type: 'follow'
        });
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).toBe(11000);
      }
    });
  });

  describe('createFollow', () => {
    it('should create a follow relationship successfully', async () => {
      const connection = await Connection.createFollow(user1._id, user2._id);

      expect(connection.follower.toString()).toBe(user1._id.toString());
      expect(connection.following.toString()).toBe(user2._id.toString());
      expect(connection.type).toBe('follow');
    });

    it('should increment followingCount for follower', async () => {
      await Connection.createFollow(user1._id, user2._id);

      const updatedUser1 = await User.findById(user1._id);
      expect(updatedUser1.followingCount).toBe(1);
    });

    it('should increment followersCount for followed user', async () => {
      await Connection.createFollow(user1._id, user2._id);

      const updatedUser2 = await User.findById(user2._id);
      expect(updatedUser2.followersCount).toBe(1);
    });

    it('should update counts correctly for multiple follows', async () => {
      await Connection.createFollow(user1._id, user2._id);
      await Connection.createFollow(user1._id, user3._id);

      const updatedUser1 = await User.findById(user1._id);
      expect(updatedUser1.followingCount).toBe(2);
    });

    it('should prevent following yourself', async () => {
      try {
        await Connection.createFollow(user1._id, user1._id);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Cannot follow yourself');
      }
    });

    it('should prevent duplicate follows', async () => {
      await Connection.createFollow(user1._id, user2._id);

      try {
        await Connection.createFollow(user1._id, user2._id);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Already following this user');
      }
    });

    it('should allow mutual follows (both users follow each other)', async () => {
      await Connection.createFollow(user1._id, user2._id);
      const connection2 = await Connection.createFollow(user2._id, user1._id);

      expect(connection2).toBeDefined();
      
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      
      expect(updatedUser1.followersCount).toBe(1);
      expect(updatedUser1.followingCount).toBe(1);
      expect(updatedUser2.followersCount).toBe(1);
      expect(updatedUser2.followingCount).toBe(1);
    });
  });

  describe('removeFollow', () => {
    beforeEach(async () => {
      await Connection.createFollow(user1._id, user2._id);
    });

    it('should remove an existing follow relationship', async () => {
      const result = await Connection.removeFollow(user1._id, user2._id);

      expect(result).toBe(true);
      
      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });
      
      expect(connection).toBeNull();
    });

    it('should decrement followingCount for follower', async () => {
      await Connection.removeFollow(user1._id, user2._id);

      const updatedUser1 = await User.findById(user1._id);
      expect(updatedUser1.followingCount).toBe(0);
    });

    it('should decrement followersCount for followed user', async () => {
      await Connection.removeFollow(user1._id, user2._id);

      const updatedUser2 = await User.findById(user2._id);
      expect(updatedUser2.followersCount).toBe(0);
    });

    it('should return false when removing non-existent follow', async () => {
      const result = await Connection.removeFollow(user1._id, user3._id);

      expect(result).toBe(false);
    });

    it('should not affect counts when removing non-existent follow', async () => {
      const user1Before = await User.findById(user1._id);
      const user3Before = await User.findById(user3._id);
      
      await Connection.removeFollow(user1._id, user3._id);

      const user1After = await User.findById(user1._id);
      const user3After = await User.findById(user3._id);
      
      expect(user1After.followingCount).toBe(user1Before.followingCount);
      expect(user3After.followersCount).toBe(user3Before.followersCount);
    });
  });

  describe('createBlock', () => {
    it('should create a block relationship successfully', async () => {
      const connection = await Connection.createBlock(user1._id, user2._id);

      expect(connection.follower.toString()).toBe(user1._id.toString());
      expect(connection.following.toString()).toBe(user2._id.toString());
      expect(connection.type).toBe('block');
    });

    it('should prevent blocking yourself', async () => {
      try {
        await Connection.createBlock(user1._id, user1._id);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Cannot block yourself');
      }
    });

    it('should remove existing follow relationship when blocking', async () => {
      await Connection.createFollow(user1._id, user2._id);
      
      const user1Before = await User.findById(user1._id);
      const user2Before = await User.findById(user2._id);
      expect(user1Before.followingCount).toBe(1);
      expect(user2Before.followersCount).toBe(1);

      await Connection.createBlock(user1._id, user2._id);

      const followConnection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'follow'
      });
      
      expect(followConnection).toBeNull();
      
      const user1After = await User.findById(user1._id);
      const user2After = await User.findById(user2._id);
      expect(user1After.followingCount).toBe(0);
      expect(user2After.followersCount).toBe(0);
    });

    it('should remove follow relationship in both directions when blocking', async () => {
      // Create mutual follows
      await Connection.createFollow(user1._id, user2._id);
      await Connection.createFollow(user2._id, user1._id);

      await Connection.createBlock(user1._id, user2._id);

      const followConnections = await Connection.find({
        $or: [
          { follower: user1._id, following: user2._id, type: 'follow' },
          { follower: user2._id, following: user1._id, type: 'follow' }
        ]
      });
      
      expect(followConnections.length).toBe(0);
      
      const user1After = await User.findById(user1._id);
      const user2After = await User.findById(user2._id);
      expect(user1After.followingCount).toBe(0);
      expect(user1After.followersCount).toBe(0);
      expect(user2After.followingCount).toBe(0);
      expect(user2After.followersCount).toBe(0);
    });

    it('should not affect counts if no follow relationship existed', async () => {
      const user1Before = await User.findById(user1._id);
      const user2Before = await User.findById(user2._id);

      await Connection.createBlock(user1._id, user2._id);

      const user1After = await User.findById(user1._id);
      const user2After = await User.findById(user2._id);
      
      expect(user1After.followingCount).toBe(user1Before.followingCount);
      expect(user1After.followersCount).toBe(user1Before.followersCount);
      expect(user2After.followingCount).toBe(user2Before.followingCount);
      expect(user2After.followersCount).toBe(user2Before.followersCount);
    });
  });

  describe('removeBlock', () => {
    beforeEach(async () => {
      await Connection.createBlock(user1._id, user2._id);
    });

    it('should remove an existing block relationship', async () => {
      const result = await Connection.removeBlock(user1._id, user2._id);

      expect(result).toBe(true);
      
      const connection = await Connection.findOne({
        follower: user1._id,
        following: user2._id,
        type: 'block'
      });
      
      expect(connection).toBeNull();
    });

    it('should return false when removing non-existent block', async () => {
      const result = await Connection.removeBlock(user1._id, user3._id);

      expect(result).toBe(false);
    });
  });

  describe('isFollowing', () => {
    it('should return true when user is following', async () => {
      await Connection.createFollow(user1._id, user2._id);

      const result = await Connection.isFollowing(user1._id, user2._id);

      expect(result).toBe(true);
    });

    it('should return false when user is not following', async () => {
      const result = await Connection.isFollowing(user1._id, user2._id);

      expect(result).toBe(false);
    });

    it('should return false when block relationship exists', async () => {
      await Connection.createBlock(user1._id, user2._id);

      const result = await Connection.isFollowing(user1._id, user2._id);

      expect(result).toBe(false);
    });

    it('should handle one-way follows correctly', async () => {
      await Connection.createFollow(user1._id, user2._id);

      const result1 = await Connection.isFollowing(user1._id, user2._id);
      const result2 = await Connection.isFollowing(user2._id, user1._id);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('isBlocking', () => {
    it('should return true when user is blocking', async () => {
      await Connection.createBlock(user1._id, user2._id);

      const result = await Connection.isBlocking(user1._id, user2._id);

      expect(result).toBe(true);
    });

    it('should return false when user is not blocking', async () => {
      const result = await Connection.isBlocking(user1._id, user2._id);

      expect(result).toBe(false);
    });

    it('should return false when follow relationship exists', async () => {
      await Connection.createFollow(user1._id, user2._id);

      const result = await Connection.isBlocking(user1._id, user2._id);

      expect(result).toBe(false);
    });

    it('should handle one-way blocks correctly', async () => {
      await Connection.createBlock(user1._id, user2._id);

      const result1 = await Connection.isBlocking(user1._id, user2._id);
      const result2 = await Connection.isBlocking(user2._id, user1._id);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle follow-unfollow-follow cycle correctly', async () => {
      await Connection.createFollow(user1._id, user2._id);
      await Connection.removeFollow(user1._id, user2._id);
      await Connection.createFollow(user1._id, user2._id);

      const user1Updated = await User.findById(user1._id);
      const user2Updated = await User.findById(user2._id);
      
      expect(user1Updated.followingCount).toBe(1);
      expect(user2Updated.followersCount).toBe(1);
    });

    it('should handle block-unblock-follow correctly', async () => {
      await Connection.createBlock(user1._id, user2._id);
      await Connection.removeBlock(user1._id, user2._id);
      await Connection.createFollow(user1._id, user2._id);

      const isBlocking = await Connection.isBlocking(user1._id, user2._id);
      const isFollowing = await Connection.isFollowing(user1._id, user2._id);
      
      expect(isBlocking).toBe(false);
      expect(isFollowing).toBe(true);
    });

    it('should handle multiple users following the same user', async () => {
      await Connection.createFollow(user1._id, user3._id);
      await Connection.createFollow(user2._id, user3._id);

      const user3Updated = await User.findById(user3._id);
      expect(user3Updated.followersCount).toBe(2);
    });

    it('should handle user following multiple users', async () => {
      await Connection.createFollow(user1._id, user2._id);
      await Connection.createFollow(user1._id, user3._id);

      const user1Updated = await User.findById(user1._id);
      expect(user1Updated.followingCount).toBe(2);
    });
  });
});
