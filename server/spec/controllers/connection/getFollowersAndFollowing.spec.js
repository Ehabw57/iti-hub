const getFollowers = require('../../../controllers/connection/getFollowersController');
const getFollowing = require('../../../controllers/connection/getFollowingController');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const { DEFAULT_LIMIT, MAX_LIMIT } = require('../../../utils/constants');

describe('getFollowers and getFollowing Controllers', () => {
  let user1, user2, user3, user4, user5;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test users
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

    user4 = await User.create({
      username: 'user4',
      email: 'user4@test.com',
      password: 'password123',
      fullName: 'User Four'
    });

    user5 = await User.create({
      username: 'user5',
      email: 'user5@test.com',
      password: 'password123',
      fullName: 'User Five'
    });
  });

  describe('GET /users/:userId/followers', () => {
    beforeEach(async () => {
      // user2, user3, user4 follow user1
      await Connection.createFollow(user2._id, user1._id);
      await Connection.createFollow(user3._id, user1._id);
      await Connection.createFollow(user4._id, user1._id);
    });

    it('should return list of followers', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.followers).toBeDefined();
      expect(res.body.data.followers.length).toBe(3);
    });

    it('should include follower user information', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      const follower = res.body.data.followers[0];
      expect(follower.username).toBeDefined();
      expect(follower.fullName).toBeDefined();
      expect(follower.profilePicture).toBeDefined();
      expect(follower.bio).toBeDefined();
      expect(follower.followersCount).toBeDefined();
      expect(follower.followingCount).toBeDefined();
      expect(follower.connectedAt).toBeDefined();
    });

    it('should return followers in reverse chronological order', async () => {
      // Add user5 as follower (most recent)
      await new Promise(resolve => setTimeout(resolve, 10));
      await Connection.createFollow(user5._id, user1._id);

      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      const followers = res.body.data.followers;
      expect(followers[0].username).toBe('user5'); // Most recent first
    });

    it('should include isFollowing when requester is authenticated', async () => {
      // user1 follows user2 back
      await Connection.createFollow(user1._id, user2._id);

      const req = {
        params: { userId: user1._id.toString() },
        user: { _id: user1._id },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      const followers = res.body.data.followers;
      const user2Follower = followers.find(f => f.username === 'user2');
      
      expect(user2Follower.isFollowing).toBe(true);
    });

    it('should not include isFollowing when unauthenticated', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      const followers = res.body.data.followers;
      expect(followers[0].isFollowing).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { userId: '507f1f77bcf86cd799439011' },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should return empty array when user has no followers', async () => {
      const req = {
        params: { userId: user5._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.followers).toEqual([]);
      expect(res.body.data.pagination.totalCount).toBe(0);
    });

    it(`should use default pagination (limit: ${DEFAULT_LIMIT})`, async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      expect(res.body.data.pagination.pageSize).toBe(DEFAULT_LIMIT);
      expect(res.body.data.pagination.currentPage).toBe(1);
    });

    it('should support custom pagination', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: { page: '2', limit: '2' }
      };
      const res = responseMock();

      await getFollowers(req, res);

      expect(res.body.data.pagination.currentPage).toBe(2);
      expect(res.body.data.pagination.pageSize).toBe(2);
      expect(res.body.data.followers.length).toBe(1); // 3 total, page 2 with limit 2 = 1 result
    });

    it(`should enforce max limit of ${MAX_LIMIT}`, async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: { limit: (MAX_LIMIT + 10).toString() }
      };
      const res = responseMock();

      await getFollowers(req, res);

      expect(res.body.data.pagination.pageSize).toBe(MAX_LIMIT);
    });

    it('should include correct pagination metadata', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: { page: '1', limit: '2' }
      };
      const res = responseMock();

      await getFollowers(req, res);

      const pagination = res.body.data.pagination;
      expect(pagination.totalCount).toBe(3);
      expect(pagination.totalPages).toBe(2);
    });
  });

  describe('GET /users/:userId/following', () => {
    beforeEach(async () => {
      // user1 follows user2, user3, user4
      await Connection.createFollow(user1._id, user2._id);
      await Connection.createFollow(user1._id, user3._id);
      await Connection.createFollow(user1._id, user4._id);
    });

    it('should return list of users being followed', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowing(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.following).toBeDefined();
      expect(res.body.data.following.length).toBe(3);
    });

    it('should include followed user information', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowing(req, res);

      const followedUser = res.body.data.following[0];
      expect(followedUser.username).toBeDefined();
      expect(followedUser.fullName).toBeDefined();
      expect(followedUser.profilePicture).toBeDefined();
      expect(followedUser.bio).toBeDefined();
      expect(followedUser.followersCount).toBeDefined();
      expect(followedUser.followingCount).toBeDefined();
      expect(followedUser.connectedAt).toBeDefined();
    });

    it('should return following in reverse chronological order', async () => {
      // user1 follows user5 (most recent)
      await new Promise(resolve => setTimeout(resolve, 10));
      await Connection.createFollow(user1._id, user5._id);

      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowing(req, res);

      const following = res.body.data.following;
      expect(following[0].username).toBe('user5'); // Most recent first
    });

    it('should include isFollowing when requester is authenticated', async () => {
      // Requester (user5) also follows user2
      await Connection.createFollow(user5._id, user2._id);

      const req = {
        params: { userId: user1._id.toString() },
        user: { _id: user5._id },
        query: {}
      };
      const res = responseMock();

      await getFollowing(req, res);

      const following = res.body.data.following;
      const user2Following = following.find(f => f.username === 'user2');
      
      expect(user2Following.isFollowing).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { userId: '507f1f77bcf86cd799439011' },
        query: {}
      };
      const res = responseMock();

      await getFollowing(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should return empty array when user follows no one', async () => {
      const req = {
        params: { userId: user5._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowing(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.following).toEqual([]);
      expect(res.body.data.pagination.totalCount).toBe(0);
    });

    it('should support pagination', async () => {
      const req = {
        params: { userId: user1._id.toString() },
        query: { page: '2', limit: '2' }
      };
      const res = responseMock();

      await getFollowing(req, res);

      expect(res.body.data.pagination.currentPage).toBe(2);
      expect(res.body.data.pagination.pageSize).toBe(2);
      expect(res.body.data.following.length).toBe(1); // 3 total, page 2 with limit 2 = 1 result
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in getFollowers', async () => {
      spyOn(User, 'findById').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowers(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should handle database errors in getFollowing', async () => {
      spyOn(User, 'findById').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        params: { userId: user1._id.toString() },
        query: {}
      };
      const res = responseMock();

      await getFollowing(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });
  });
});
