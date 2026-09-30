const joinCommunity = require('../../../controllers/community/joinCommunityController');
const leaveCommunity = require('../../../controllers/community/leaveCommunityController');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const CommunityJoinRequest = require('../../../models/CommunityJoinRequest');
const User = require('../../../models/User');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

/**
 * Invoke an asyncHandler-wrapped controller deterministically.
 * asyncHandler does not return the handler's promise, so plain
 * `await handler(req, res)` returns before the response is sent. This
 * helper resolves only once res.json/res.send is called (or next(err)).
 */
const invoke = (handler, req) =>
  new Promise((resolve) => {
    const res = responseMock();
    let nextError = null;
    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        resolve({ res, nextError });
      }
    };
    const origJson = res.json.bind(res);
    const origSend = res.send.bind(res);
    res.json = (obj) => {
      origJson(obj);
      settle();
      return res;
    };
    res.send = (data) => {
      origSend(data);
      settle();
      return res;
    };
    const next = (err) => {
      nextError = err;
      settle();
    };
    handler(req, res, next);
  });

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

  describe('POST /communities/:id/join (pending-request flow)', () => {
    it('should create a pending join request', async () => {
      const { res } = await invoke(joinCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/waiting|request/i);
      expect(res.body.data.request.status).toBe('pending');
    });

    it('should NOT create a membership record on join request', async () => {
      await invoke(joinCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      const membership = await CommunityMember.findOne({
        user: testUser._id,
        community: testCommunity._id
      });
      expect(membership).toBeNull();

      const joinRequest = await CommunityJoinRequest.findOne({
        user: testUser._id,
        community: testCommunity._id
      });
      expect(joinRequest).toBeDefined();
      expect(joinRequest.status).toBe('pending');
    });

    it('should NOT increment member count on join request', async () => {
      await invoke(joinCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(1);
    });

    it('should reject a duplicate pending request (409)', async () => {
      await CommunityJoinRequest.create({
        user: testUser._id,
        community: testCommunity._id
      });

      const { nextError } = await invoke(joinCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(409);
      expect(nextError.message).toMatch(/pending/i);
    });

    it('should reject joining when already a member (409)', async () => {
      await CommunityMember.create({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      const { nextError } = await invoke(joinCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(409);
      expect(nextError.message).toMatch(/already/i);
    });

    it('should return 404 for non-existent community', async () => {
      const { nextError } = await invoke(joinCommunity, {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { _id: testUser._id }
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(404);
    });

    it('should return 400 for invalid ID', async () => {
      const { nextError } = await invoke(joinCommunity, {
        params: { id: 'invalid-id' },
        user: { _id: testUser._id }
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(400);
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
      const { res } = await invoke(leaveCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/left/i);
    });

    it('should delete membership record', async () => {
      await invoke(leaveCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      const membership = await CommunityMember.findOne({
        user: testUser._id,
        community: testCommunity._id
      });

      expect(membership).toBeNull();
    });

    it('should decrement member count', async () => {
      await invoke(leaveCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: testUser._id }
      });

      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(1);
    });

    it('should prevent only owner from leaving', async () => {
      const { nextError } = await invoke(leaveCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: ownerUser._id }
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(400);
      expect(nextError.message).toMatch(/only owner|transfer ownership/i);
    });

    it('should be idempotent when not a member', async () => {
      const anotherUser = await User.create({
        username: 'another',
        fullName: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      });

      const { res } = await invoke(leaveCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: anotherUser._id }
      });

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

      await invoke(leaveCommunity, {
        params: { id: testCommunity._id.toString() },
        user: { _id: modUser._id }
      });

      const updated = await Community.findById(testCommunity._id);
      expect(updated.moderators.map(id => id.toString())).not.toContain(modUser._id.toString());
    });

    it('should return 404 for non-existent community', async () => {
      const { nextError } = await invoke(leaveCommunity, {
        params: { id: '507f1f77bcf86cd799439011' },
        user: { _id: testUser._id }
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(404);
    });

    it('should return 400 for invalid ID', async () => {
      const { nextError } = await invoke(leaveCommunity, {
        params: { id: 'invalid-id' },
        user: { _id: testUser._id }
      });

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(400);
    });
  });
});
