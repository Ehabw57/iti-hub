const mongoose = require('mongoose');
const mongoHelper = require('../helpers/DBUtils');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const Connection = require('../../models/Connection');
const {
  CONVERSATION_TYPES,
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MIN_CONVERSATION_PARTICIPANTS,
  MAX_GROUP_PARTICIPANTS
} = require('../../utils/constants');

describe('Conversation Model', () => {
  let user1, user2, user3, user4;

  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    await mongoHelper.clearDatabase();

    // Create test users
    user1 = await User.create({
      username: 'user1',
      fullName: 'User One',
      email: 'user1@example.com',
      password: 'password123'
    });

    user2 = await User.create({
      username: 'user2',
      fullName: 'User Two',
      email: 'user2@example.com',
      password: 'password123'
    });

    user3 = await User.create({
      username: 'user3',
      fullName: 'User Three',
      email: 'user3@example.com',
      password: 'password123'
    });

    user4 = await User.create({
      username: 'user4',
      fullName: 'User Four',
      email: 'user4@example.com',
      password: 'password123'
    });
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  // Schema Validation Tests
  describe('Schema Validation', () => {
    it('should require type field', async () => {
      const conversation = new Conversation({
        participants: [user1._id, user2._id]
      });

      try {
        await conversation.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should validate type enum (individual | group)', async () => {
      const conversation = new Conversation({
        type: 'invalid',
        participants: [user1._id, user2._id]
      });

      try {
        await conversation.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should require participants array with min 2 users', async () => {
      const conversation = new Conversation({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user1._id]
      });

      try {
        await conversation.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should reject more than 100 participants', async () => {
      const manyUsers = Array(101).fill(user1._id);
      const conversation = new Conversation({
        type: CONVERSATION_TYPES.GROUP,
        name: 'Big Group',
        admin: user1._id,
        participants: manyUsers
      });

      try {
        await conversation.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should require name if type is group', async () => {
      const conversation = new Conversation({
        type: CONVERSATION_TYPES.GROUP,
        participants: [user1._id, user2._id, user3._id],
        admin: user1._id
      });

      try {
        await conversation.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Group name is required');
      }
    });

    it('should require admin if type is group', async () => {
      const conversation = new Conversation({
        type: CONVERSATION_TYPES.GROUP,
        name: 'Test Group',
        participants: [user1._id, user2._id, user3._id]
      });

      try {
        await conversation.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Group admin is required');
      }
    });

    it('should validate image URL format if provided', async () => {
      const conversation = new Conversation({
        type: CONVERSATION_TYPES.GROUP,
        name: 'Test Group',
        admin: user1._id,
        participants: [user1._id, user2._id, user3._id],
        image: 'not-a-url'
      });

      try {
        await conversation.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should initialize unreadCount as empty Map', async () => {
      const conversation = await Conversation.create({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user1._id, user2._id]
      });

      expect(conversation.unreadCount).toBeInstanceOf(Map);
      expect(conversation.unreadCount.size).toBe(0);
    });

    it('should auto-set createdAt and updatedAt', async () => {
      const conversation = await Conversation.create({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user1._id, user2._id]
      });

      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });

    it('should allow creating individual conversation without name and admin', async () => {
      const conversation = await Conversation.create({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user1._id, user2._id]
      });

      expect(conversation).toBeDefined();
      expect(conversation.name).toBeUndefined();
      expect(conversation.admin).toBeUndefined();
    });

    it('should allow creating group with valid data', async () => {
      const conversation = await Conversation.create({
        type: CONVERSATION_TYPES.GROUP,
        name: 'Test Group',
        admin: user1._id,
        participants: [user1._id, user2._id, user3._id]
      });

      expect(conversation).toBeDefined();
      expect(conversation.type).toBe(CONVERSATION_TYPES.GROUP);
      expect(conversation.name).toBe('Test Group');
    });
  });

  // Static Method Tests
  describe('Static Methods', () => {
    describe('findByParticipants', () => {
      it('should find individual conversation by 2 participants', async () => {
        const created = await Conversation.create({
          type: CONVERSATION_TYPES.INDIVIDUAL,
          participants: [user1._id, user2._id]
        });

        const found = await Conversation.findByParticipants(
          [user1._id, user2._id],
          CONVERSATION_TYPES.INDIVIDUAL
        );

        expect(found).toBeDefined();
        expect(found._id.toString()).toBe(created._id.toString());
      });

      it('should find group conversation by participants', async () => {
        const created = await Conversation.create({
          type: CONVERSATION_TYPES.GROUP,
          name: 'Test Group',
          admin: user1._id,
          participants: [user1._id, user2._id, user3._id]
        });

        const found = await Conversation.findByParticipants(
          [user1._id, user2._id, user3._id],
          CONVERSATION_TYPES.GROUP
        );

        expect(found).toBeDefined();
        expect(found._id.toString()).toBe(created._id.toString());
      });

      it('should return null if not found', async () => {
        const found = await Conversation.findByParticipants(
          [user1._id, user2._id],
          CONVERSATION_TYPES.INDIVIDUAL
        );

        expect(found).toBeNull();
      });
    });

    describe('createIndividual', () => {
      it('should create new individual conversation', async () => {
        const conversation = await Conversation.createIndividual(user1._id, user2._id);

        expect(conversation).toBeDefined();
        expect(conversation.type).toBe(CONVERSATION_TYPES.INDIVIDUAL);
        expect(conversation.participants.length).toBe(2);
        expect(conversation.participants.map(p => p.toString())).toContain(user1._id.toString());
        expect(conversation.participants.map(p => p.toString())).toContain(user2._id.toString());
      });

      it('should return existing conversation if already exists', async () => {
        const first = await Conversation.createIndividual(user1._id, user2._id);
        const second = await Conversation.createIndividual(user1._id, user2._id);

        expect(second._id.toString()).toBe(first._id.toString());
      });

      it('should prevent self-conversation', async () => {
        try {
          await Conversation.createIndividual(user1._id, user1._id);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toBe('Cannot create conversation with yourself');
        }
      });

      it('should check for blocking before creating', async () => {
        // User1 blocks User2
        await Connection.create({
          follower: user1._id,
          following: user2._id,
          type: 'block'
        });

        try {
          await Conversation.createIndividual(user1._id, user2._id);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toBe('Cannot create conversation with blocked user');
        }
      });

      it('should check if blocked by other user', async () => {
        // User2 blocks User1
        await Connection.create({
          follower: user2._id,
          following: user1._id,
          type: 'block'
        });

        try {
          await Conversation.createIndividual(user1._id, user2._id);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toBe('Cannot create conversation with blocked user');
        }
      });

      it('should sort participants array consistently', async () => {
        const conv1 = await Conversation.createIndividual(user1._id, user2._id);
        const conv2 = await Conversation.createIndividual(user2._id, user1._id);

        expect(conv1._id.toString()).toBe(conv2._id.toString());
      });
    });

    describe('createGroup', () => {
      it('should create group with valid data', async () => {
        const group = await Conversation.createGroup(
          user1._id,
          'Test Group',
          [user2._id, user3._id],
          null
        );

        expect(group).toBeDefined();
        expect(group.type).toBe(CONVERSATION_TYPES.GROUP);
        expect(group.name).toBe('Test Group');
        expect(group.admin.toString()).toBe(user1._id.toString());
        expect(group.participants.length).toBe(3);
      });

      it('should reject invalid participant count (< 3 total)', async () => {
        try {
          await Conversation.createGroup(user1._id, 'Test Group', [user2._id], null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toBe('Group must have at least 3 participants');
        }
      });

      it('should reject too many participants (> 100)', async () => {
        // Create 100 unique user IDs (since creator is added automatically, that makes 101)
        const manyUsers = [];
        for (let i = 0; i < 100; i++) {
          manyUsers.push(new mongoose.Types.ObjectId());
        }
        
        try {
          await Conversation.createGroup(user1._id, 'Test Group', manyUsers, null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toBe('Group cannot have more than 100 participants');
        }
      });

      it('should set creator as admin', async () => {
        const group = await Conversation.createGroup(
          user1._id,
          'Test Group',
          [user2._id, user3._id],
          null
        );

        expect(group.admin.toString()).toBe(user1._id.toString());
      });

      it('should reject missing name', async () => {
        try {
          await Conversation.createGroup(user1._id, '', [user2._id, user3._id], null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toBe('Group name is required');
        }
      });

      it('should reject name too short', async () => {
        try {
          await Conversation.createGroup(user1._id, 'a', [user2._id, user3._id], null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toContain('at least');
        }
      });

      it('should reject name too long', async () => {
        const longName = 'a'.repeat(MAX_GROUP_NAME_LENGTH + 1);
        
        try {
          await Conversation.createGroup(user1._id, longName, [user2._id, user3._id], null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toContain('must not exceed');
        }
      });

      it('should include creator in participants automatically', async () => {
        const group = await Conversation.createGroup(
          user1._id,
          'Test Group',
          [user2._id, user3._id],
          null
        );

        expect(group.participants.map(p => p.toString())).toContain(user1._id.toString());
      });

      it('should sort participants array', async () => {
        const group = await Conversation.createGroup(
          user1._id,
          'Test Group',
          [user3._id, user2._id],
          null
        );

        const sortedIds = [user1._id, user2._id, user3._id]
          .map(id => id.toString())
          .sort();
        
        const groupIds = group.participants
          .map(p => p.toString())
          .sort();

        expect(groupIds).toEqual(sortedIds);
      });

      it('should initialize unreadCount for all participants', async () => {
        const group = await Conversation.createGroup(
          user1._id,
          'Test Group',
          [user2._id, user3._id],
          null
        );

        expect(group.unreadCount).toBeInstanceOf(Map);
        expect(group.unreadCount.get(user1._id.toString())).toBe(0);
        expect(group.unreadCount.get(user2._id.toString())).toBe(0);
        expect(group.unreadCount.get(user3._id.toString())).toBe(0);
      });

      it('should allow creating without image', async () => {
        const group = await Conversation.createGroup(
          user1._id,
          'Test Group',
          [user2._id, user3._id],
          null
        );

        expect(group.image).toBeUndefined();
      });

      it('should accept valid image URL', async () => {
        const group = await Conversation.createGroup(
          user1._id,
          'Test Group',
          [user2._id, user3._id],
          'https://example.com/image.jpg'
        );

        expect(group.image).toBe('https://example.com/image.jpg');
      });
    });

    describe('updateUnreadCount', () => {
      let conversation;

      beforeEach(async () => {
        conversation = await Conversation.create({
          type: CONVERSATION_TYPES.GROUP,
          name: 'Test Group',
          admin: user1._id,
          participants: [user1._id, user2._id, user3._id],
          unreadCount: new Map([
            [user1._id.toString(), 0],
            [user2._id.toString(), 0],
            [user3._id.toString(), 0]
          ])
        });
      });

      it('should increment count for user', async () => {
        await Conversation.updateUnreadCount(conversation._id, user2._id, 1);

        const updated = await Conversation.findById(conversation._id);
        expect(updated.unreadCount.get(user2._id.toString())).toBe(1);
      });

      it('should decrement count (reset to 0)', async () => {
        conversation.unreadCount.set(user2._id.toString(), 5);
        await conversation.save();

        await Conversation.updateUnreadCount(conversation._id, user2._id, -5);

        const updated = await Conversation.findById(conversation._id);
        expect(updated.unreadCount.get(user2._id.toString())).toBe(0);
      });

      it('should handle multiple users', async () => {
        await Conversation.updateUnreadCount(conversation._id, user2._id, 3);
        await Conversation.updateUnreadCount(conversation._id, user3._id, 2);

        const updated = await Conversation.findById(conversation._id);
        expect(updated.unreadCount.get(user2._id.toString())).toBe(3);
        expect(updated.unreadCount.get(user3._id.toString())).toBe(2);
      });

      it('should not go below 0', async () => {
        await Conversation.updateUnreadCount(conversation._id, user2._id, -10);

        const updated = await Conversation.findById(conversation._id);
        expect(updated.unreadCount.get(user2._id.toString())).toBe(0);
      });
    });
  });
});
