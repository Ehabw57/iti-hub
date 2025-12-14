const mongoose = require('mongoose');
const mongoHelper = require('../helpers/DBUtils');
const {
  isMember,
  canModerate,
  canPostToCommunity,
  updateMemberCount,
  updatePostCount,
  updateModeratorList
} = require('../../utils/communityHelpers');
const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const User = require('../../models/User');

describe('Community Helpers', () => {
  let testUser;
  let testCommunity;
  let ownerUser;
  let moderatorUser;

  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    await mongoHelper.clearDatabase();

    // Create test users
    testUser = await User.create({
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    ownerUser = await User.create({
      username: 'owner',
      fullName: 'Owner User',
      email: 'owner@example.com',
      password: 'password123'
    });

    moderatorUser = await User.create({
      username: 'moderator',
      fullName: 'Moderator User',
      email: 'mod@example.com',
      password: 'password123'
    });

    // Create test community
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'A test community',
      tags: ['Technology'],
      owners: [ownerUser._id],
      moderators: [ownerUser._id, moderatorUser._id]
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
      user: testUser._id,
      community: testCommunity._id,
      role: 'member'
    });
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  describe('isMember', () => {
    it('should return true for enrolled members', async () => {
      const result = await isMember(testUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return true for moderators', async () => {
      const result = await isMember(moderatorUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return true for owners', async () => {
      const result = await isMember(ownerUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return false for non-enrolled users', async () => {
      const nonMember = new mongoose.Types.ObjectId();
      const result = await isMember(nonMember, testCommunity._id);
      expect(result).toBe(false);
    });

    it('should handle string IDs', async () => {
      const result = await isMember(testUser._id.toString(), testCommunity._id.toString());
      expect(result).toBe(true);
    });
  });

  describe('canModerate', () => {
    it('should return true for owners', async () => {
      const result = await canModerate(ownerUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return true for moderators', async () => {
      const result = await canModerate(moderatorUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return false for regular members', async () => {
      const result = await canModerate(testUser._id, testCommunity._id);
      expect(result).toBe(false);
    });

    it('should return false for non-members', async () => {
      const nonMember = new mongoose.Types.ObjectId();
      const result = await canModerate(nonMember, testCommunity._id);
      expect(result).toBe(false);
    });

    it('should handle string IDs', async () => {
      const result = await canModerate(ownerUser._id.toString(), testCommunity._id.toString());
      expect(result).toBe(true);
    });
  });

  describe('canPostToCommunity', () => {
    it('should return true for members', async () => {
      const result = await canPostToCommunity(testUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return true for moderators', async () => {
      const result = await canPostToCommunity(moderatorUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return true for owners', async () => {
      const result = await canPostToCommunity(ownerUser._id, testCommunity._id);
      expect(result).toBe(true);
    });

    it('should return false for non-members', async () => {
      const nonMember = new mongoose.Types.ObjectId();
      const result = await canPostToCommunity(nonMember, testCommunity._id);
      expect(result).toBe(false);
    });
  });

  describe('updateMemberCount', () => {
    it('should increment member count', async () => {
      const originalCount = testCommunity.memberCount;
      await updateMemberCount(testCommunity._id, 1);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(originalCount + 1);
    });

    it('should decrement member count', async () => {
      // Set initial count
      testCommunity.memberCount = 5;
      await testCommunity.save();

      await updateMemberCount(testCommunity._id, -1);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(4);
    });

    it('should not allow negative member count', async () => {
      testCommunity.memberCount = 0;
      await testCommunity.save();

      await updateMemberCount(testCommunity._id, -1);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(0);
    });

    it('should handle string IDs', async () => {
      const originalCount = testCommunity.memberCount;
      await updateMemberCount(testCommunity._id.toString(), 2);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.memberCount).toBe(originalCount + 2);
    });
  });

  describe('updatePostCount', () => {
    it('should increment post count', async () => {
      const originalCount = testCommunity.postCount;
      await updatePostCount(testCommunity._id, 1);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.postCount).toBe(originalCount + 1);
    });

    it('should decrement post count', async () => {
      testCommunity.postCount = 10;
      await testCommunity.save();

      await updatePostCount(testCommunity._id, -1);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.postCount).toBe(9);
    });

    it('should not allow negative post count', async () => {
      testCommunity.postCount = 0;
      await testCommunity.save();

      await updatePostCount(testCommunity._id, -1);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.postCount).toBe(0);
    });

    it('should handle large increments', async () => {
      await updatePostCount(testCommunity._id, 100);
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.postCount).toBe(100);
    });
  });

  describe('updateModeratorList', () => {
    it('should add a user to moderators list', async () => {
      const newMod = await User.create({
        username: 'newmod',
        fullName: 'New Moderator',
        email: 'newmod@example.com',
        password: 'password123'
      });

      await CommunityMember.create({
        user: newMod._id,
        community: testCommunity._id,
        role: 'member'
      });

      await updateModeratorList(testCommunity._id, newMod._id, 'add');
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.moderators.map(id => id.toString())).toContain(newMod._id.toString());

      const membership = await CommunityMember.findOne({ user: newMod._id, community: testCommunity._id });
      expect(membership.role).toBe('moderator');
    });

    it('should remove a user from moderators list', async () => {
      await updateModeratorList(testCommunity._id, moderatorUser._id, 'remove');
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.moderators.map(id => id.toString())).not.toContain(moderatorUser._id.toString());

      const membership = await CommunityMember.findOne({ user: moderatorUser._id, community: testCommunity._id });
      expect(membership.role).toBe('member');
    });

    it('should be idempotent when adding existing moderator', async () => {
      const originalLength = testCommunity.moderators.length;
      
      await updateModeratorList(testCommunity._id, moderatorUser._id, 'add');
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.moderators.length).toBe(originalLength);
    });

    it('should be idempotent when removing non-moderator', async () => {
      const originalLength = testCommunity.moderators.length;
      
      await updateModeratorList(testCommunity._id, testUser._id, 'remove');
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.moderators.length).toBe(originalLength);
    });

    it('should not remove owners from moderators list', async () => {
      await updateModeratorList(testCommunity._id, ownerUser._id, 'remove');
      
      const updated = await Community.findById(testCommunity._id);
      expect(updated.moderators.map(id => id.toString())).toContain(ownerUser._id.toString());

      const membership = await CommunityMember.findOne({ user: ownerUser._id, community: testCommunity._id });
      expect(membership.role).toBe('owner');
    });
  });
});
