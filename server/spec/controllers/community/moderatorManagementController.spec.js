const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const addModerator = require('../../../controllers/community/addModeratorController');
const removeModerator = require('../../../controllers/community/removeModeratorController');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');

describe('Moderator Management Controllers', () => {
  let ownerUser, moderatorUser, memberUser, nonMemberUser, testCommunity, req, res;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create users
    ownerUser = await User.create({
      username: 'owner',
      fullName: 'Owner User',
      email: 'owner@example.com',
      password: 'password123'
    });

    moderatorUser = await User.create({
      username: 'moderator',
      fullName: 'Moderator User',
      email: 'moderator@example.com',
      password: 'password123'
    });

    memberUser = await User.create({
      username: 'member',
      fullName: 'Member User',
      email: 'member@example.com',
      password: 'password123'
    });

    nonMemberUser = await User.create({
      username: 'nonmember',
      fullName: 'Non Member',
      email: 'nonmember@example.com',
      password: 'password123'
    });

    // Create community
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'Test description',
      tags: ['Technology'],
      owners: [ownerUser._id],
      moderators: [ownerUser._id, moderatorUser._id],
      memberCount: 3
    });

    // Create memberships
    await CommunityMember.create({
      user: ownerUser._id,
      community: testCommunity._id,
      role: 'owner'
    });

    await CommunityMember.create({
      user: moderatorUser._id,
      community: testCommunity._id,
      role: 'moderator'
    });

    await CommunityMember.create({
      user: memberUser._id,
      community: testCommunity._id,
      role: 'member'
    });

    req = {
      params: { id: testCommunity._id.toString() },
      body: {},
      user: ownerUser
    };
    res = responseMock();
  });

  describe('Add Moderator Controller', () => {
    it('should add member as moderator when user is owner', async () => {
      req.body = { userId: memberUser._id.toString() };

      await addModerator(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update community moderators list', async () => {
      req.body = { userId: memberUser._id.toString() };

      await addModerator(req, res);

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.moderators).toContain(memberUser._id);
    });

    it('should update member role to moderator', async () => {
      req.body = { userId: memberUser._id.toString() };

      await addModerator(req, res);

      const membership = await CommunityMember.findOne({
        user: memberUser._id,
        community: testCommunity._id
      });
      expect(membership.role).toBe('moderator');
    });

    it('should allow existing moderator to add new moderator', async () => {
      req.user = moderatorUser;
      req.body = { userId: memberUser._id.toString() };

      await addModerator(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject when user is not owner or moderator', async () => {
      req.user = memberUser;
      req.body = { userId: nonMemberUser._id.toString() };

      await addModerator(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject when target user is not a member', async () => {
      req.body = { userId: nonMemberUser._id.toString() };

      await addModerator(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('member');
    });

    it('should be idempotent - return success if already moderator', async () => {
      req.body = { userId: moderatorUser._id.toString() };

      await addModerator(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid community ID', async () => {
      req.params.id = 'invalid-id';
      req.body = { userId: memberUser._id.toString() };

      await addModerator(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid community ID');
    });

    it('should return 400 for invalid user ID', async () => {
      req.body = { userId: 'invalid-id' };

      await addModerator(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid user ID');
    });

    it('should return 404 when community does not exist', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { userId: memberUser._id.toString() };

      await addModerator(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Remove Moderator Controller', () => {
    beforeEach(async () => {
      // Make memberUser a moderator for removal tests
      await CommunityMember.findOneAndUpdate(
        { user: memberUser._id, community: testCommunity._id },
        { role: 'moderator' }
      );
      testCommunity.moderators.push(memberUser._id);
      await testCommunity.save();
    });

    it('should remove moderator when user is owner', async () => {
      req.params.userId = memberUser._id.toString();

      await removeModerator(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update community moderators list', async () => {
      req.params.userId = memberUser._id.toString();

      await removeModerator(req, res);

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.moderators.map(id => id.toString())).not.toContain(memberUser._id.toString());
    });

    it('should update member role back to member', async () => {
      req.params.userId = memberUser._id.toString();

      await removeModerator(req, res);

      const membership = await CommunityMember.findOne({
        user: memberUser._id,
        community: testCommunity._id
      });
      expect(membership.role).toBe('member');
    });

    it('should allow existing moderator to remove other moderator', async () => {
      req.user = moderatorUser;
      req.params.userId = memberUser._id.toString();

      await removeModerator(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject when user is not owner or moderator', async () => {
      // Create a regular member who is NOT a moderator
      const regularMember = await User.create({
        username: 'regular',
        fullName: 'Regular Member',
        email: 'regular@example.com',
        password: 'password123'
      });

      await CommunityMember.create({
        user: regularMember._id,
        community: testCommunity._id,
        role: 'member'
      });

      req.user = regularMember;
      req.params.userId = moderatorUser._id.toString();

      await removeModerator(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject removing an owner', async () => {
      req.params.userId = ownerUser._id.toString();

      await removeModerator(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('owner');
    });

    it('should be idempotent - return success if not moderator', async () => {
      // Remove moderator role first
      await CommunityMember.findOneAndUpdate(
        { user: memberUser._id, community: testCommunity._id },
        { role: 'member' }
      );
      
      req.params.userId = memberUser._id.toString();

      await removeModerator(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid community ID', async () => {
      req.params.id = 'invalid-id';
      req.params.userId = memberUser._id.toString();

      await removeModerator(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid community ID');
    });

    it('should return 400 for invalid user ID', async () => {
      req.params.userId = 'invalid-id';

      await removeModerator(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid user ID');
    });

    it('should return 404 when community does not exist', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      req.params.userId = memberUser._id.toString();

      await removeModerator(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });
});
