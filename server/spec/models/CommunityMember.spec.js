const mongoose = require('mongoose');
const mongoHelper = require('../helpers/DBUtils');
const CommunityMember = require('../../models/CommunityMember');
const Community = require('../../models/Community');
const User = require('../../models/User');

describe('CommunityMember Model', () => {
  let testUser;
  let testCommunity;

  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    await mongoHelper.clearDatabase();
    
    // Create test user
    testUser = await User.create({
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Create test community
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'A test community',
      tags: ['Technology'],
      owners: [testUser._id],
      moderators: [testUser._id]
    });
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  describe('Schema Validation', () => {
    it('should create a valid enrollment with required fields', async () => {
      const enrollment = new CommunityMember({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      const savedEnrollment = await enrollment.save();

      expect(savedEnrollment._id).toBeDefined();
      expect(savedEnrollment.user.toString()).toBe(testUser._id.toString());
      expect(savedEnrollment.community.toString()).toBe(testCommunity._id.toString());
      expect(savedEnrollment.role).toBe('member');
    });

    it('should require user field', async () => {
      const enrollment = new CommunityMember({
        community: testCommunity._id,
        role: 'member'
      });

      let error;
      try {
        await enrollment.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    it('should require community field', async () => {
      const enrollment = new CommunityMember({
        user: testUser._id,
        role: 'member'
      });

      let error;
      try {
        await enrollment.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.community).toBeDefined();
    });

    it('should default role to member', async () => {
      const enrollment = new CommunityMember({
        user: testUser._id,
        community: testCommunity._id
      });

      const savedEnrollment = await enrollment.save();
      expect(savedEnrollment.role).toBe('member');
    });

    it('should accept owner role', async () => {
      const enrollment = new CommunityMember({
        user: testUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      const savedEnrollment = await enrollment.save();
      expect(savedEnrollment.role).toBe('owner');
    });

    it('should accept moderator role', async () => {
      const enrollment = new CommunityMember({
        user: testUser._id,
        community: testCommunity._id,
        role: 'moderator'
      });

      const savedEnrollment = await enrollment.save();
      expect(savedEnrollment.role).toBe('moderator');
    });

    it('should reject invalid roles', async () => {
      const enrollment = new CommunityMember({
        user: testUser._id,
        community: testCommunity._id,
        role: 'invalid_role'
      });

      let error;
      try {
        await enrollment.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    it('should enforce unique user-community combination', async () => {
      await CommunityMember.create({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      let error;
      try {
        await CommunityMember.create({
          user: testUser._id,
          community: testCommunity._id,
          role: 'moderator'
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await CommunityMember.create({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });
    });

    it('should have isEnrolled method that returns true for enrolled users', async () => {
      const isEnrolled = await CommunityMember.isEnrolled(testUser._id, testCommunity._id);
      expect(isEnrolled).toBe(true);
    });

    it('should have isEnrolled method that returns false for non-enrolled users', async () => {
      const anotherUser = new mongoose.Types.ObjectId();
      const isEnrolled = await CommunityMember.isEnrolled(anotherUser, testCommunity._id);
      expect(isEnrolled).toBe(false);
    });

    it('should have getRole method that returns user role', async () => {
      const role = await CommunityMember.getRole(testUser._id, testCommunity._id);
      expect(role).toBe('member');
    });

    it('should have getRole method that returns null for non-enrolled users', async () => {
      const anotherUser = new mongoose.Types.ObjectId();
      const role = await CommunityMember.getRole(anotherUser, testCommunity._id);
      expect(role).toBeNull();
    });

    it('should have getRole method that works for owners', async () => {
      const ownerUser = await User.create({
        username: 'owner',
        fullName: 'Owner User',
        email: 'owner@example.com',
        password: 'password123'
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      const role = await CommunityMember.getRole(ownerUser._id, testCommunity._id);
      expect(role).toBe('owner');
    });

    it('should have getRole method that works for moderators', async () => {
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

      const role = await CommunityMember.getRole(modUser._id, testCommunity._id);
      expect(role).toBe('moderator');
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt timestamp', async () => {
      const enrollment = await CommunityMember.create({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      expect(enrollment.createdAt).toBeDefined();
      expect(enrollment.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically add updatedAt timestamp', async () => {
      const enrollment = await CommunityMember.create({
        user: testUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      expect(enrollment.updatedAt).toBeDefined();
      expect(enrollment.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Indexes', () => {
    it('should have compound unique index on user and community', async () => {
      const indexes = CommunityMember.schema.indexes();
      const compoundIndex = indexes.find(index => 
        index[0].user === 1 && index[0].community === 1
      );
      expect(compoundIndex).toBeDefined();
      expect(compoundIndex[1].unique).toBe(true);
    });

    it('should have index on community field', async () => {
      const indexes = CommunityMember.schema.indexes();
      const communityIndex = indexes.find(index => 
        index[0].community === 1 && !index[0].user
      );
      expect(communityIndex).toBeDefined();
    });

    it('should have index on user field', async () => {
      const indexes = CommunityMember.schema.indexes();
      const userIndex = indexes.find(index => 
        index[0].user === 1 && !index[0].community
      );
      expect(userIndex).toBeDefined();
    });
  });
});
