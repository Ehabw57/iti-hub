const getCommunity = require('../../../controllers/community/getCommunityController');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('getCommunityController', () => {
  let testUser;
  let testCommunity;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    testUser = await User.create({
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    testCommunity = await Community.create({
      name: 'Tech Community',
      description: 'A community for tech enthusiasts',
      tags: ['Technology', 'Education'],
      profilePicture: 'https://cloudinary.com/profile.jpg',
      coverImage: 'https://cloudinary.com/cover.jpg',
      memberCount: 100,
      postCount: 50,
      owners: [testUser._id],
      moderators: [testUser._id]
    });

    await CommunityMember.create({
      user: testUser._id,
      community: testCommunity._id,
      role: 'owner'
    });
  });

  describe('GET /communities/:id', () => {
    it('should return community details for authenticated users', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await getCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.community).toBeDefined();
      expect(res.body.data.community.name).toBe('Tech Community');
      expect(res.body.data.community.description).toBe('A community for tech enthusiasts');
    });

    it('should include isJoined flag for authenticated users who are members', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await getCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.community.isJoined).toBe(true);
    });

    it('should include role for authenticated members', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await getCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.community.role).toBe('owner');
    });

    it('should return isJoined false for non-members', async () => {
      const anotherUser = await User.create({
        username: 'another',
        fullName: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      });

      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: anotherUser._id }
      };
      const res = responseMock();

      await getCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.community.isJoined).toBe(false);
      expect(res.body.data.community.role).toBeNull();
    });

    it('should work for unauthenticated users', async () => {
      const req = {
        params: { id: testCommunity._id.toString() }
      };
      const res = responseMock();

      await getCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.community.name).toBe('Tech Community');
      expect(res.body.data.community.isJoined).toBeUndefined();
      expect(res.body.data.community.role).toBeUndefined();
    });

    it('should return 404 for non-existent community', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await getCommunity(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should return 400 for invalid community ID', async () => {
      const req = {
        params: { id: 'invalid-id' },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await getCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should include all community fields', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await getCommunity(req, res);

      const community = res.body.data.community;
      expect(community._id).toBeDefined();
      expect(community.name).toBeDefined();
      expect(community.description).toBeDefined();
      expect(community.profilePicture).toBeDefined();
      expect(community.coverImage).toBeDefined();
      expect(community.tags).toBeDefined();
      expect(community.memberCount).toBe(100);
      expect(community.postCount).toBe(50);
      expect(community.createdAt).toBeDefined();
    });
  });
});
