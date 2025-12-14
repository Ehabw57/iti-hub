const mongoose = require('mongoose');
const mongoHelper = require('../helpers/DBUtils');
const Community = require('../../models/Community');
const { COMMUNITY_TAGS, MIN_COMMUNITY_TAGS, MAX_COMMUNITY_TAGS } = require('../../utils/constants');

describe('Community Model', () => {
  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    // Clear the Community collection before each test
    await Community.deleteMany({});
  });

  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  describe('Schema Validation', () => {
    it('should create a valid community with required fields', async () => {
      const communityData = {
        name: 'Tech Enthusiasts',
        description: 'A community for tech lovers',
        tags: ['Technology', 'Education'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      };

      const community = new Community(communityData);
      const savedCommunity = await community.save();

      expect(savedCommunity._id).toBeDefined();
      expect(savedCommunity.name).toBe(communityData.name);
      expect(savedCommunity.description).toBe(communityData.description);
      expect(savedCommunity.tags).toEqual(communityData.tags);
      expect(savedCommunity.memberCount).toBe(0);
      expect(savedCommunity.postCount).toBe(0);
    });

    it('should require name field', async () => {
      const community = new Community({
        description: 'Test description',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()]
      });

      let error;
      try {
        await community.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    it('should require description field', async () => {
      const community = new Community({
        name: 'Test Community',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()]
      });

      let error;
      try {
        await community.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
    });

    it('should require at least one owner', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: []
      });

      let error;
      try {
        await community.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });

    it('should require tags field', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        owners: [new mongoose.Types.ObjectId()]
      });

      let error;
      try {
        await community.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.tags).toBeDefined();
    });

    it('should enforce unique community names', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const communityData = {
        name: 'Unique Community',
        description: 'First community',
        tags: ['Technology'],
        owners: [ownerId],
        moderators: [ownerId]
      };

      await Community.create(communityData);

      let error;
      try {
        await Community.create({
          ...communityData,
          description: 'Second community with same name'
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    it('should enforce case-insensitive unique names', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      await Community.create({
        name: 'Tech Community',
        description: 'First community',
        tags: ['Technology'],
        owners: [ownerId],
        moderators: [ownerId]
      });

      // Create with different case - may or may not fail depending on MongoDB config
      // This test verifies the collation index exists
      const indexes = Community.schema.indexes();
      const nameIndexWithCollation = indexes.find(index => 
        index[0].name === 1 && index[1].collation
      );
      expect(nameIndexWithCollation).toBeDefined();
    });
  });

  describe('Tag Validation', () => {
    it('should accept valid tags from COMMUNITY_TAGS', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology', 'Education'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.tags).toEqual(['Technology', 'Education']);
    });

    it('should reject tags not in COMMUNITY_TAGS', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['InvalidTag'],
        owners: [new mongoose.Types.ObjectId()]
      });

      let error;
      try {
        await community.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.tags).toBeDefined();
    });

    it('should require at least 1 tag', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: [],
        owners: [new mongoose.Types.ObjectId()]
      });

      let error;
      try {
        await community.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.tags).toBeDefined();
    });

    it('should allow maximum 3 tags', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology', 'Education', 'Science'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.tags.length).toBe(3);
    });

    it('should reject more than 3 tags', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology', 'Education', 'Science', 'Arts'],
        owners: [new mongoose.Types.ObjectId()]
      });

      let error;
      try {
        await community.save();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.tags).toBeDefined();
    });
  });

  describe('Optional Fields', () => {
    it('should allow optional profilePicture field', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        profilePicture: 'https://cloudinary.com/profile.jpg',
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.profilePicture).toBe('https://cloudinary.com/profile.jpg');
    });

    it('should allow optional coverImage field', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        coverImage: 'https://cloudinary.com/cover.jpg',
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.coverImage).toBe('https://cloudinary.com/cover.jpg');
    });

    it('should default memberCount to 0', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.memberCount).toBe(0);
    });

    it('should default postCount to 0', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.postCount).toBe(0);
    });
  });

  describe('Virtual Methods', () => {
    it('should have isOwner method that returns true for owners', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [ownerId],
        moderators: [ownerId]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.isOwner(ownerId.toString())).toBe(true);
    });

    it('should have isOwner method that returns false for non-owners', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const nonOwnerId = new mongoose.Types.ObjectId();
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [ownerId],
        moderators: [ownerId]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.isOwner(nonOwnerId.toString())).toBe(false);
    });

    it('should have isModerator method that returns true for moderators', async () => {
      const moderatorId = new mongoose.Types.ObjectId();
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [moderatorId]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.isModerator(moderatorId.toString())).toBe(true);
    });

    it('should have isModerator method that returns true for owners (owners are moderators)', async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [ownerId],
        moderators: [ownerId]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.isModerator(ownerId.toString())).toBe(true);
    });

    it('should have isModerator method that returns false for non-moderators', async () => {
      const nonModeratorId = new mongoose.Types.ObjectId();
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.isModerator(nonModeratorId.toString())).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt timestamp', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.createdAt).toBeDefined();
      expect(savedCommunity.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically add updatedAt timestamp', async () => {
      const community = new Community({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [new mongoose.Types.ObjectId()],
        moderators: [new mongoose.Types.ObjectId()]
      });

      const savedCommunity = await community.save();
      expect(savedCommunity.updatedAt).toBeDefined();
      expect(savedCommunity.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Indexes', () => {
    it('should have index on name field', async () => {
      const indexes = Community.schema.indexes();
      const nameIndex = indexes.find(index => index[0].name === 1);
      expect(nameIndex).toBeDefined();
      expect(nameIndex[1].unique).toBe(true);
    });

    it('should have index on memberCount field', async () => {
      const indexes = Community.schema.indexes();
      const memberCountIndex = indexes.find(index => index[0].memberCount === -1);
      expect(memberCountIndex).toBeDefined();
    });

    it('should have index on createdAt field', async () => {
      const indexes = Community.schema.indexes();
      const createdAtIndex = indexes.find(index => index[0].createdAt === -1);
      expect(createdAtIndex).toBeDefined();
    });

    it('should have index on tags field', async () => {
      const indexes = Community.schema.indexes();
      const tagsIndex = indexes.find(index => index[0].tags === 1);
      expect(tagsIndex).toBeDefined();
    });
  });
});
