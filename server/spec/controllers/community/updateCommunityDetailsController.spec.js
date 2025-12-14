const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const updateCommunityDetails = require('../../../controllers/community/updateCommunityDetailsController');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');

describe('updateCommunityDetailsController', () => {
  let ownerUser, moderatorUser, memberUser, testCommunity, req, res;

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

    // Create community
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'Original description',
      tags: ['Technology', 'Education'],
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
      user: ownerUser,
      body: {}
    };
    res = responseMock();
  });

  it('should update community description when user is owner', async () => {
    req.body = { description: 'Updated description by owner' };

    await updateCommunityDetails(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.community.description).toBe('Updated description by owner');
  });

  it('should persist changes to database', async () => {
    req.body = { description: 'New description' };

    await updateCommunityDetails(req, res);

    const updatedCommunity = await Community.findById(testCommunity._id);
    expect(updatedCommunity.description).toBe('New description');
  });

  it('should reject update when user is not owner', async () => {
    req.user = moderatorUser;
    req.body = { description: 'Unauthorized update' };

    await updateCommunityDetails(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('owner');
  });

  it('should reject update from regular member', async () => {
    req.user = memberUser;
    req.body = { description: 'Unauthorized update' };

    await updateCommunityDetails(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if description is missing', async () => {
    req.body = {};

    await updateCommunityDetails(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toContain('description');
  });

  it('should return 400 for invalid community ID', async () => {
    req.params.id = 'invalid-id';
    req.body = { description: 'Updated' };

    await updateCommunityDetails(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid community ID');
  });

  it('should return 404 if community does not exist', async () => {
    req.params.id = '507f1f77bcf86cd799439011';
    req.body = { description: 'Updated' };

    await updateCommunityDetails(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  it('should not change other fields when updating description', async () => {
    req.body = { description: 'Updated description only' };

    await updateCommunityDetails(req, res);

    const updatedCommunity = await Community.findById(testCommunity._id);
    expect(updatedCommunity.name).toBe('Test Community');
    expect(updatedCommunity.tags).toEqual(['Technology', 'Education']);
    expect(updatedCommunity.memberCount).toBe(3);
  });
});
