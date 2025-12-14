const joinCommunity = require('../../../controllers/community/joinCommunityController');
const leaveCommunity = require('../../../controllers/community/leaveCommunityController');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('Join/Leave Community Controllers', () => {
  let testUser;
  let testCommunity;
  let ownerUser;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    ownerUser = await User.create({
      username: 'owner',
      fullName: 'Owner User',
      email: 'owner@example.com',
      password: 'password123'
    });

    testUser = await User.create({
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    testCommunity = await Community.create({
      name: 'Tech Community',
      description: 'A community for tech enthusiasts',
      tags: ['Technology'],
      memberCount: 1,
      owners: [ownerUser._id],
      moderators: [ownerUser._id]
    });

    await CommunityMember.create({
      user: ownerUser._id,
      community: testCommunity._id,
      role: 'owner'
    });
  });

  describe('POST /communities/:id/join', () => {
    it('should allow user to join a community', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await joinCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/joined/i);
    });

    it('should create membership record', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await joinCommunity(req, res);

      const membership = await CommunityMember.findOne({
        user: testUser._id,
        community: testCommunity._id
      });
      
      expect(membership).toBeDefined();
      expect(membership.role).toBe('member');
    });

    it('should increment member count', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await joinCommunity(req, res);

      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(2);
    });

    it('should be idempotent when already joined', async () => {
      await CommunityMember.create({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await joinCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/already/i);
    });

    it('should return 404 for non-existent community', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await joinCommunity(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const req = {
        params: { id: 'invalid-id' },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await joinCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /communities/:id/leave', () => {
    beforeEach(async () => {
      await CommunityMember.create({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });
      testCommunity.memberCount = 2;
      await testCommunity.save();
    });

    it('should allow user to leave a community', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await leaveCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/left/i);
    });

    it('should delete membership record', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await leaveCommunity(req, res);

      const membership = await CommunityMember.findOne({
        user: testUser._id,
        community: testCommunity._id
      });
      
      expect(membership).toBeNull();
    });

    it('should decrement member count', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await leaveCommunity(req, res);

      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(1);
    });

    it('should prevent only owner from leaving', async () => {
      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: ownerUser._id }
      };
      const res = responseMock();

      await leaveCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only owner/i);
    });

    it('should be idempotent when not a member', async () => {
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

      await leaveCommunity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/not a member/i);
    });

    it('should remove moderator from moderators list when leaving', async () => {
      const modUser = await User.create({
        username: 'moderator',
        fullName: 'Moderator User',
        email: 'mod@example.com',
        password: 'password123'
      });

      await CommunityMember.create({
        user: modUser._id,
        community: testCommunity._id,
        role: 'moderator'
      });

      testCommunity.moderators.push(modUser._id);
      await testCommunity.save();

      const req = {
        params: { id: testCommunity._id.toString() },
        user: { _id: modUser._id }
      };
      const res = responseMock();

      await leaveCommunity(req, res);

      const updated = await Community.findById(testCommunity._id);
      expect(updated.moderators.map(id => id.toString())).not.toContain(modUser._id.toString());
    });

    it('should return 404 for non-existent community', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await leaveCommunity(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const req = {
        params: { id: 'invalid-id' },
        user: { _id: testUser._id }
      };
      const res = responseMock();

      await leaveCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
