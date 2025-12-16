const mongoose = require('mongoose');
const mongoHelper = require('../helpers/DBUtils');
const {
  isParticipant,
  canSendMessage,
  formatConversation,
  formatMessage
} = require('../../utils/messageHelpers');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');
const Connection = require('../../models/Connection');
const { CONVERSATION_TYPES, MESSAGE_STATUS } = require('../../utils/constants');

describe('Message Helpers', () => {
  let user1, user2, user3, user4;
  let conversation, groupConversation;
  let message;

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
      password: 'password123',
      profilePicture: 'https://example.com/user1.jpg',
      lastSeen: new Date()
    });

    user2 = await User.create({
      username: 'user2',
      fullName: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
      profilePicture: 'https://example.com/user2.jpg',
      lastSeen: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
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

    // Create conversations
    conversation = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id],
      unreadCount: new Map([
        [user1._id.toString(), 2],
        [user2._id.toString(), 0]
      ])
    });

    groupConversation = await Conversation.create({
      type: CONVERSATION_TYPES.GROUP,
      name: 'Test Group',
      image: 'https://example.com/group.jpg',
      admin: user1._id,
      participants: [user1._id, user2._id, user3._id],
      unreadCount: new Map([
        [user1._id.toString(), 0],
        [user2._id.toString(), 3],
        [user3._id.toString(), 1]
      ])
    });

    // Create a test message
    message = await Message.create({
      conversation: conversation._id,
      sender: user2._id,
      content: 'Test message',
      status: MESSAGE_STATUS.SENT
    });
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  describe('isParticipant', () => {
    it('should return true if user in participants', async () => {
      const result = await isParticipant(conversation._id, user1._id);
      expect(result).toBe(true);
    });

    it('should return false if user not in participants', async () => {
      const result = await isParticipant(conversation._id, user3._id);
      expect(result).toBe(false);
    });

    it('should handle invalid conversation ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await isParticipant(fakeId, user1._id);
      expect(result).toBe(false);
    });

    it('should work for group conversations', async () => {
      const result = await isParticipant(groupConversation._id, user3._id);
      expect(result).toBe(true);
    });
  });

  describe('canSendMessage', () => {
    it('should allow if not blocked', async () => {
      const result = await canSendMessage(user1._id, user2._id);
      
      expect(result.canSend).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should prevent if blocked by recipient', async () => {
      // User2 blocks User1
      await Connection.create({
        follower: user2._id,
        following: user1._id,
        type: 'block'
      });

      const result = await canSendMessage(user1._id, user2._id);
      
      expect(result.canSend).toBe(false);
      expect(result.reason).toBe('User has blocked you');
    });

    it('should prevent if blocker', async () => {
      // User1 blocks User2
      await Connection.create({
        follower: user1._id,
        following: user2._id,
        type: 'block'
      });

      const result = await canSendMessage(user1._id, user2._id);
      
      expect(result.canSend).toBe(false);
      expect(result.reason).toBe('You have blocked this user');
    });

    it('should handle non-existent users gracefully', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await canSendMessage(user1._id, fakeId);
      
      expect(result.canSend).toBe(true);
      expect(result.reason).toBeNull();
    });
  });

  describe('formatConversation', () => {
    it('should include unread count for current user', async () => {
      const formatted = await formatConversation(conversation, user1._id);
      
      expect(formatted.unreadCount).toBe(2);
    });

    it('should format individual conversation', async () => {
      const formatted = await formatConversation(conversation, user1._id);
      
      expect(formatted._id).toBeDefined();
      expect(formatted.type).toBe(CONVERSATION_TYPES.INDIVIDUAL);
      expect(formatted.participants).toBeDefined();
      expect(Array.isArray(formatted.participants)).toBe(true);
      expect(formatted.unreadCount).toBe(2);
      expect(formatted.createdAt).toBeDefined();
      expect(formatted.updatedAt).toBeDefined();
    });

    it('should format group conversation', async () => {
      const formatted = await formatConversation(groupConversation, user2._id);
      
      expect(formatted._id).toBeDefined();
      expect(formatted.type).toBe(CONVERSATION_TYPES.GROUP);
      expect(formatted.name).toBe('Test Group');
      expect(formatted.image).toBe('https://example.com/group.jpg');
      expect(formatted.admin).toBeDefined();
      expect(formatted.unreadCount).toBe(3);
      expect(formatted.participants).toBeDefined();
    });

    it('should include online status for participants', async () => {
      const formatted = await formatConversation(conversation, user1._id);
      
      expect(formatted.participants).toBeDefined();
      expect(formatted.participants.length).toBeGreaterThan(0);
      
      const participant = formatted.participants[0];
      expect(participant.isOnline).toBeDefined();
      expect(typeof participant.isOnline).toBe('boolean');
    });

    it('should populate participant details', async () => {
      const formatted = await formatConversation(conversation, user1._id);
      
      const participant = formatted.participants[0];
      expect(participant.username).toBeDefined();
      expect(participant.fullName).toBeDefined();
    });

    it('should handle conversation without unreadCount', async () => {
      const simpleConv = await Conversation.create({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user3._id, user4._id]
      });

      const formatted = await formatConversation(simpleConv, user3._id);
      
      expect(formatted.unreadCount).toBe(0);
    });
  });

  describe('formatMessage', () => {
    it('should format message with populated sender', async () => {
      // Populate sender first
      await message.populate('sender', 'username fullName profilePicture');
      
      const formatted = formatMessage(message);
      
      expect(formatted.sender).toBeDefined();
      expect(formatted.sender.username).toBe('user2');
      expect(formatted.sender.fullName).toBe('User Two');
      expect(formatted.sender.profilePicture).toBeDefined();
    });

    it('should include seenBy information', () => {
      // Add seenBy data
      message.seenBy.push({
        userId: user1._id,
        seenAt: new Date()
      });

      const formatted = formatMessage(message);
      
      expect(formatted.seenBy).toBeDefined();
      expect(Array.isArray(formatted.seenBy)).toBe(true);
      expect(formatted.seenBy.length).toBe(1);
    });

    it('should format message with content', async () => {
      const formatted = await formatMessage(message);
      
      expect(formatted._id).toBeDefined();
      expect(formatted.content).toBe('Test message');
      expect(formatted.status).toBe(MESSAGE_STATUS.SENT);
      expect(formatted.createdAt).toBeDefined();
    });

    it('should format message with image', async () => {
      const imageMessage = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        image: 'https://example.com/test.jpg'
      });

      const formatted = await formatMessage(imageMessage);
      
      expect(formatted.image).toBe('https://example.com/test.jpg');
    });

    it('should format message with both content and image', async () => {
      const fullMessage = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: 'Check this out',
        image: 'https://example.com/test.jpg'
      });

      const formatted = await formatMessage(fullMessage);
      
      expect(formatted.content).toBe('Check this out');
      expect(formatted.image).toBe('https://example.com/test.jpg');
    });

    it('should handle message without populated sender', async () => {
      const rawMessage = await Message.findById(message._id);
      const formatted = await formatMessage(rawMessage);
      
      expect(formatted.sender).toBeDefined();
    });
  });
});
