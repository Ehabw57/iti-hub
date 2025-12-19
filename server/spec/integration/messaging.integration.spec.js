const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../helpers/DBUtils');
const User = require('../../models/User');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { MESSAGE_STATUS } = require('../../utils/constants');

process.env.JWT_SECRET = 'test-secret-key';

describe('Messaging Integration Tests', () => {
  let user1, user2, user3, user4;
  let token1, token2, token3, token4;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test users
    user1 = await User.create({
      email: 'user1@test.com',
      password: 'password123',
      fullName: 'User One',
      username: 'user1'
    });

    user2 = await User.create({
      email: 'user2@test.com',
      password: 'password123',
      fullName: 'User Two',
      username: 'user2'
    });

    user3 = await User.create({
      email: 'user3@test.com',
      password: 'password123',
      fullName: 'User Three',
      username: 'user3'
    });

    user4 = await User.create({
      email: 'user4@test.com',
      password: 'password123',
      fullName: 'User Four',
      username: 'user4'
    });

    // Generate tokens
    token1 = jwt.sign({ userId: user1._id.toString() }, process.env.JWT_SECRET);
    token2 = jwt.sign({ userId: user2._id.toString() }, process.env.JWT_SECRET);
    token3 = jwt.sign({ userId: user3._id.toString() }, process.env.JWT_SECRET);
    token4 = jwt.sign({ userId: user4._id.toString() }, process.env.JWT_SECRET);
  });

  // ===== Individual Conversations Tests =====
  describe('Individual Conversations', () => {
    it('should create an individual conversation between two users', async () => {
      const response = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() })
        .expect(201);


      expect(response.body.data.conversation).toBeDefined();
      expect(response.body.data.conversation.type).toBe('individual');
      expect(response.body.data.conversation.participants.length).toBe(2);
      const participantIds = response.body.data.conversation.participants.map(p => p._id);
      expect(participantIds).toContain(user1._id.toString());
      expect(participantIds).toContain(user2._id.toString());
    });

    it('should return existing conversation if already exists', async () => {
      // Create first conversation
      const response1 = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() })
        .expect(201)

      const conv1Id = response1.body.data.conversation._id;

      // Try to create again
      const response2 = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() })
        .expect(200);

      expect(response2.body.data.conversation._id).toBe(conv1Id);
    });

    it('should send and receive messages in individual conversation', async () => {
      // Create conversation
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() })
        .expect(201);

      const conversationId = convResponse.body.data.conversation._id;

      // User1 sends message
      const msgResponse = await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Hello User2!' })
        .expect(201);

      expect(msgResponse.body.data.message.content).toBe('Hello User2!');
      expect(msgResponse.body.data.message.sender._id).toBe(user1._id.toString());

      // User2 retrieves messages
      const messagesResponse = await request(app)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(messagesResponse.body.data.messages.length).toBe(1);
      expect(messagesResponse.body.data.messages[0].content).toBe('Hello User2!');
    });

    it('should update unread count when messages are sent', async () => {
      // Create conversation
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      const conversationId = convResponse.body.data.conversation._id;

      // User1 sends message
      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test message' });

      // User2 checks conversation list
      const listResponse = await request(app)
        .get('/conversations')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const conversation = listResponse.body.data.conversations.find(
        c => c._id === conversationId
      );
      expect(conversation.unreadCount).toBe(1);
    });

    it('should mark messages as seen and reset unread count', async () => {
      // Create conversation and send message
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      const conversationId = convResponse.body.data.conversation._id;

      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test message' });

      // User2 marks as seen
      await request(app)
        .put(`/conversations/${conversationId}/seen`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Check unread count is reset
      const listResponse = await request(app)
        .get('/conversations')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const conversation = listResponse.body.data.conversations.find(
        c => c._id === conversationId
      );
      expect(conversation.unreadCount).toBe(0);
    });

    it('should not allow non-participants to access conversation', async () => {
      // User1 and User2 create conversation
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      const conversationId = convResponse.body.data.conversation._id;

      // User3 (non-participant) tries to access
      await request(app)
        .get(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      // User3 tries to send message
      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token3}`)
        .send({ content: 'Unauthorized message' })
        .expect(403);
    });
  });

  // ===== Group Conversations Tests =====
  describe('Group Conversations', () => {
    it('should create a group conversation with 3-100 members', async () => {
      const response = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group',
        })
        .expect(201);

      expect(response.body.data.conversation.type).toBe('group');
      expect(response.body.data.conversation.name).toBe('Test Group');
      expect(response.body.data.conversation.participants.length).toBe(3);
      expect(response.body.data.conversation.admin._id).toContain(user1._id.toString());
    });

    it('should reject group creation with less than 3 members', async () => {
      const response = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString()],
          name: 'Invalid Group'
        })
        .expect(400);


      expect(response.body.error.message).toContain('at least 3 participants');
    });

    it('should allow admin to add members to group', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      // Admin adds User4
      const response = await request(app)
        .post(`/conversations/${conversationId}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user4._id.toString() })
        .expect(200);

      expect(response.body.data.conversation.participants.length).toBe(4);
    });

    it('should not allow non-admin to add members', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      // Non-admin tries to add member
      await request(app)
        .post(`/conversations/${conversationId}/members`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ userId: user4._id.toString() })
        .expect(403);
    });

    it('should allow admin to remove members from group', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      // Admin removes User3
      const response = await request(app)
        .delete(`/conversations/${conversationId}/members/${user3._id}`)
        .set('Authorization', `Bearer ${token1}`)

      expect(response.body.data.conversation.participants.length).toBe(2);
      expect(response.body.data.conversation.participants.map(p => p._id))
        .not.toContain(user3._id.toString());
    });

    it('should not allow non-admin to remove members', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      // Non-admin tries to remove member
      await request(app)
        .delete(`/conversations/${conversationId}/members/${user3._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);
    });

    it('should allow non-admin members to leave group', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      const response = await request(app)
        .post(`/conversations/${conversationId}/leave`)
        .set('Authorization', `Bearer ${token2}`)

      expect(response.body.message).toContain('left');
    });

    it('should not allow admin to leave group', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

    });

    it('should allow admin to update group info', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      // Update group info
      const response = await request(app)
        .patch(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Updated Group Name',
        })
        .expect(200);

      expect(response.body.data.conversation.name).toBe('Updated Group Name');
    });

    it('should broadcast messages to all group members', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      // User1 sends message
      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Group message' })
        .expect(201);

      // All members should see the message
      const user2Messages = await request(app)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const user3Messages = await request(app)
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(200);

      expect(user2Messages.body.data.messages.length).toBe(1);
      expect(user3Messages.body.data.messages.length).toBe(1);
    });
  });

  // ===== Message Operations Tests =====
  describe('Message Operations', () => {
    let conversationId;

    beforeEach(async () => {
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });
      conversationId = convResponse.body.data.conversation._id;
    });

    it('should send text message successfully', async () => {
      const response = await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test message' })
        .expect(201);

      expect(response.body.data.message.content).toBe('Test message');
      expect(response.body.data.message.sender._id).toBe(user1._id.toString());
      expect(response.body.data.message.status).toBe(MESSAGE_STATUS.SENT);
    });

    it('should reject message without content or image', async () => {
      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({})
        .expect(400);
    });

    it('should reject message exceeding max length', async () => {
      const longContent = 'a'.repeat(2001);
      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: longContent })
        .expect(400);
    });

    it('should retrieve messages with cursor pagination', async () => {
      // Send multiple messages
      for (let i = 1; i <= 10; i++) {
        await request(app)
          .post(`/conversations/${conversationId}/messages`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ content: `Message ${i}` });
      }

      // Get first page
      const response1 = await request(app)
        .get(`/conversations/${conversationId}/messages?limit=5`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);


      expect(response1.body.data.messages.length).toBe(5);

      // Get second page
      const response2 = await request(app)
        .get(`/conversations/${conversationId}/messages?cursor=${response1.body.data.cursor}&limit=5`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response2.body.data.messages.length).toBe(5);
      expect(response2.body.data.hasMore).toBe(false);
    });


    it('should update message status to seen', async () => {
      // Send message
      const msgResponse = await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test message' });

      const messageId = msgResponse.body.data.message._id;

      // Mark as seen by User2
      await request(app)
        .put(`/conversations/${conversationId}/seen`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Check message status
      const message = await Message.findById(messageId);
      expect(message.status).toBe(MESSAGE_STATUS.SEEN);
      expect(message.seenBy[0].userId).toEqual(user2._id);
    });

    it('should not mark own messages as seen', async () => {
      // Send message
      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test message' });

      // Try to mark as seen by sender
      await request(app)
        .put(`/conversations/${conversationId}/seen`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // Check unread count should be 0 (no messages to mark as seen)
      const conversation = await Conversation.findById(conversationId);
      const user1Unread = conversation.unreadCount.get(user1._id.toString()) 
      expect(user1Unread).toBe(0);
    });
  });

  // ===== Conversation List Tests =====
  describe('Conversation List', () => {
    it('should list all user conversations sorted by last message', async () => {
      // Create multiple conversations
      await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user3._id.toString() });

      const response = await request(app)
        .get('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.conversations.length).toBe(2);
      expect(response.body.data.conversations[0].lastMessage).toBeDefined();
    });

    it('should include unread counts in conversation list', async () => {
      // Create conversation and send message
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      const conversationId = convResponse.body.data.conversation._id;

      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Test message' });

      // User2 checks list
      const response = await request(app)
        .get('/conversations')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.data.conversations[0].unreadCount).toBe(1);
    });

    it('should paginate conversation list', async () => {
      // Create 15 conversations
      for (let i = 0; i < 15; i++) {
        const user = await User.create({
          email: `testuser${i}@test.com`,
          password: 'password123',
          fullName: `Test User ${i}`,
          username: `testuser${i}`
        });

        await request(app)
          .post('/conversations')
          .set('Authorization', `Bearer ${token1}`)
          .send({ participantId: user._id.toString() });
      }

      const response = await request(app)
        .get('/conversations?page=1&limit=10')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);


      expect(response.body.data.conversations.length).toBe(10);
      expect(response.body.data.pagination.total).toBe(15);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  // ===== Edge Cases & Error Handling =====
  describe('Edge Cases & Error Handling', () => {
    it('should handle invalid conversation ID gracefully', async () => {
      await request(app)
        .get('/conversations/invalid-id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);
    });

    it('should handle non-existent conversation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);
    });

    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/conversations')
        .expect(401);

      await request(app)
        .post('/conversations')
        .send({ participantId: user2._id.toString() })
        .expect(401);
    });

    it('should handle invalid participant ID', async () => {
      await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: 'invalid-id' })
        .expect(400);
    });

    it('should prevent creating conversation with self', async () => {
      await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user1._id.toString() })
        .expect(400);
    });


    it('should handle adding duplicate member to group', async () => {
      // Create group
      const convResponse = await request(app)
        .post('/conversations/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          participantIds: [user2._id.toString(), user3._id.toString()],
          name: 'Test Group'
        });

      const conversationId = convResponse.body.data.conversation._id;

      // Try to add existing member
      const res =await request(app)
        .post(`/conversations/${conversationId}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: [user2._id.toString()] })
        .expect(400);
    });

    it('should handle empty message content', async () => {
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      const conversationId = convResponse.body.data.conversation._id;

      await request(app)
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: '   ' })
        .expect(400);
    });
  });

  // ===== Performance & Scalability Tests =====
  describe('Performance & Scalability', () => {
    it('should handle large number of messages efficiently', async () => {
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      const conversationId = convResponse.body.data.conversation._id;

      // Send 100 messages
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .post(`/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${token1}`)
            .send({ content: `Message ${i}` })
        );
      }

      await Promise.all(promises);

      // Retrieve with pagination
      const response = await request(app)
        .get(`/conversations/${conversationId}/messages?limit=50`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.messages.length).toBe(50);
    });

    it('should handle concurrent message sends', async () => {
      const convResponse = await request(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participantId: user2._id.toString() });

      const conversationId = convResponse.body.data.conversation._id;

      // Send messages concurrently
      const promises = [
        request(app)
          .post(`/conversations/${conversationId}/messages`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ content: 'Message from User1' }),
        request(app)
          .post(`/conversations/${conversationId}/messages`)
          .set('Authorization', `Bearer ${token2}`)
          .send({ content: 'Message from User2' })
      ];

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify both messages saved
      const messages = await Message.find({ conversation: conversationId });
      expect(messages.length).toBe(2);
    });
  });
});
