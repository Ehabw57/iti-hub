const mongoose = require('mongoose');
const mongoHelper = require('../helpers/DBUtils');
const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const {
  MESSAGE_STATUS,
  CONVERSATION_TYPES,
  MAX_MESSAGE_CONTENT_LENGTH
} = require('../../utils/constants');

describe('Message Model', () => {
  let user1, user2, user3;
  let conversation, groupConversation;

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

    // Create test conversations
    conversation = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    groupConversation = await Conversation.create({
      type: CONVERSATION_TYPES.GROUP,
      name: 'Test Group',
      admin: user1._id,
      participants: [user1._id, user2._id, user3._id]
    });
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  // Schema Validation Tests
  describe('Schema Validation', () => {
    it('should require conversation field', async () => {
      const message = new Message({
        sender: user1._id,
        content: 'Test message'
      });

      try {
        await message.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should require sender field', async () => {
      const message = new Message({
        conversation: conversation._id,
        content: 'Test message'
      });

      try {
        await message.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should require either content or image', async () => {
      const message = new Message({
        conversation: conversation._id,
        sender: user1._id
      });

      try {
        await message.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('Message must have content or image');
      }
    });

    it('should validate content max length (2000 chars)', async () => {
      const longContent = 'a'.repeat(MAX_MESSAGE_CONTENT_LENGTH + 1);
      const message = new Message({
        conversation: conversation._id,
        sender: user1._id,
        content: longContent
      });

      try {
        await message.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should validate image URL format', async () => {
      const message = new Message({
        conversation: conversation._id,
        sender: user1._id,
        image: 'not-a-url'
      });

      try {
        await message.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should default status to "sent"', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: 'Test message'
      });

      expect(message.status).toBe(MESSAGE_STATUS.SENT);
    });

    it('should validate status enum', async () => {
      const message = new Message({
        conversation: conversation._id,
        sender: user1._id,
        content: 'Test message',
        status: 'invalid'
      });

      try {
        await message.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should initialize seenBy as empty array', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: 'Test message'
      });

      expect(Array.isArray(message.seenBy)).toBe(true);
      expect(message.seenBy.length).toBe(0);
    });

    it('should auto-set createdAt and updatedAt', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: 'Test message'
      });

      expect(message.createdAt).toBeDefined();
      expect(message.updatedAt).toBeDefined();
    });
  });

  // Create with content/image variations
  describe('Content Variations', () => {
    it('should create with content only', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: 'Test message'
      });

      expect(message.content).toBe('Test message');
      expect(message.image).toBeUndefined();
    });

    it('should create with image only', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        image: 'https://example.com/image.jpg'
      });

      expect(message.image).toBe('https://example.com/image.jpg');
      expect(message.content).toBeUndefined();
    });

    it('should create with both content and image', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: 'Check this out',
        image: 'https://example.com/image.jpg'
      });

      expect(message.content).toBe('Check this out');
      expect(message.image).toBe('https://example.com/image.jpg');
    });
  });

  // Static Method Tests
  describe('Static Methods', () => {
    describe('createMessage', () => {
      it('should create message with content', async () => {
        const message = await Message.createMessage(
          conversation._id,
          user1._id,
          'Test message',
          null
        );

        expect(message).toBeDefined();
        expect(message.content).toBe('Test message');
        expect(message.sender.toString()).toBe(user1._id.toString());
        expect(message.conversation.toString()).toBe(conversation._id.toString());
      });

      it('should create message with image', async () => {
        const message = await Message.createMessage(
          conversation._id,
          user1._id,
          null,
          'https://example.com/image.jpg'
        );

        expect(message.image).toBe('https://example.com/image.jpg');
      });

      it('should create with both content and image', async () => {
        const message = await Message.createMessage(
          conversation._id,
          user1._id,
          'Check this',
          'https://example.com/image.jpg'
        );

        expect(message.content).toBe('Check this');
        expect(message.image).toBe('https://example.com/image.jpg');
      });

      it('should reject without content or image', async () => {
        try {
          await Message.createMessage(conversation._id, user1._id, null, null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toContain('Message must have content or image');
        }
      });

      it('should reject invalid conversation', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        
        try {
          await Message.createMessage(fakeId, user1._id, 'Test', null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toContain('Conversation not found');
        }
      });

      it('should reject invalid sender', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        
        try {
          await Message.createMessage(conversation._id, fakeId, 'Test', null);
          fail('Should have thrown error');
        } catch (error) {
          expect(error.message).toContain('User not found');
        }
      });
    });

    describe('markAsSeen', () => {
      let message1, message2, message3;

      beforeEach(async () => {
        message1 = await Message.create({
          conversation: conversation._id,
          sender: user1._id,
          content: 'Message 1'
        });

        message2 = await Message.create({
          conversation: conversation._id,
          sender: user1._id,
          content: 'Message 2'
        });

        message3 = await Message.create({
          conversation: conversation._id,
          sender: user1._id,
          content: 'Message 3'
        });
      });

      it('should update status to "seen"', async () => {
        await Message.markAsSeen(conversation._id, user2._id);

        const updated = await Message.find({ conversation: conversation._id });
        updated.forEach(msg => {
          expect(msg.status).toBe(MESSAGE_STATUS.SEEN);
        });
      });

      it('should add userId to seenBy array', async () => {
        await Message.markAsSeen(conversation._id, user2._id);

        const updated = await Message.findById(message1._id);
        expect(updated.seenBy.length).toBe(1);
        expect(updated.seenBy[0].userId.toString()).toBe(user2._id.toString());
        expect(updated.seenBy[0].seenAt).toBeDefined();
      });

      it('should not duplicate userId in seenBy', async () => {
        await Message.markAsSeen(conversation._id, user2._id);
        await Message.markAsSeen(conversation._id, user2._id);

        const updated = await Message.findById(message1._id);
        expect(updated.seenBy.length).toBe(1);
      });

      it('should handle multiple users', async () => {
        await Message.markAsSeen(groupConversation._id, user2._id);
        await Message.markAsSeen(groupConversation._id, user3._id);

        // Create a message in group conversation
        const groupMessage = await Message.create({
          conversation: groupConversation._id,
          sender: user1._id,
          content: 'Group message'
        });

        await Message.markAsSeen(groupConversation._id, user2._id);
        
        const updated = await Message.findById(groupMessage._id);
        expect(updated.seenBy.length).toBe(1);
        expect(updated.seenBy[0].userId.toString()).toBe(user2._id.toString());
      });

      it('should only mark unread messages', async () => {
        // Mark first message as seen
        message1.status = MESSAGE_STATUS.SEEN;
        await message1.save();

        await Message.markAsSeen(conversation._id, user2._id);

        const updated1 = await Message.findById(message1._id);
        const updated2 = await Message.findById(message2._id);

        // All should be seen
        expect(updated1.status).toBe(MESSAGE_STATUS.SEEN);
        expect(updated2.status).toBe(MESSAGE_STATUS.SEEN);
      });
    });

    describe('getConversationMessages', () => {
      let messages;

      beforeEach(async () => {
        messages = [];
        for (let i = 1; i <= 25; i++) {
          const msg = await Message.create({
            conversation: conversation._id,
            sender: user1._id,
            content: `Message ${i}`
          });
          messages.push(msg);
          // Small delay to ensure different timestamps
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });

      it('should return messages in chronological order (newest first)', async () => {
        const result = await Message.getConversationMessages(conversation._id);

        expect(result.length).toBeLessThanOrEqual(20);
        expect(result[0].content).toBe('Message 25');
      });

      it('should paginate correctly with default limit', async () => {
        const result = await Message.getConversationMessages(conversation._id);

        expect(result.length).toBe(20);
      });

      it('should filter by "before" cursor', async () => {
        const beforeTimestamp = messages[20].createdAt;
        
        const result = await Message.getConversationMessages(
          conversation._id,
          beforeTimestamp,
          20
        );

        expect(result.length).toBeLessThanOrEqual(20);
        result.forEach(msg => {
          expect(msg.createdAt.getTime()).toBeLessThan(beforeTimestamp.getTime());
        });
      });

      it('should respect custom limit', async () => {
        const result = await Message.getConversationMessages(conversation._id, null, 5);

        expect(result.length).toBe(5);
      });

      it('should return empty array if no messages', async () => {
        const emptyConv = await Conversation.create({
          type: CONVERSATION_TYPES.INDIVIDUAL,
          participants: [user2._id, user3._id]
        });

        const result = await Message.getConversationMessages(emptyConv._id);

        expect(result.length).toBe(0);
      });
    });
  });
});
