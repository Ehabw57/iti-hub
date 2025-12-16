const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { getMessages } = require('../../../controllers/message/getMessagesController');
const Conversation = require('../../../models/Conversation');
const Message = require('../../../models/Message');
const User = require('../../../models/User');

describe('getMessages Controller', () => {
  let user1, user2, user3;
  let conversation;
  let messages;
  let req, res;

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

    // Create conversation
    conversation = await Conversation.createIndividual(user1._id, user2._id);

    // Create messages
    messages = [];
    for (let i = 0; i < 5; i++) {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: i % 2 === 0 ? user1._id : user2._id,
        content: `Message ${i + 1}`,
        status: 'sent'
      });
      messages.push(msg);
    }

    // Setup request and response mocks
    req = {
      user: { _id: user1._id },
      params: { conversationId: conversation._id.toString() },
      query: {}
    };

    res = {
      status: jasmine.createSpy('status').and.returnValue({
        json: jasmine.createSpy('json')
      }),
      json: jasmine.createSpy('json')
    };
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  it('should return messages for conversation', async () => {
    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.messages).toBeDefined();
    expect(response.data.messages.length).toBe(5);
  });

  it('should return messages in reverse chronological order', async () => {
    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const returnedMessages = response.data.messages;
    
    // Most recent first
    expect(returnedMessages[0].content).toBe('Message 5');
    expect(returnedMessages[4].content).toBe('Message 1');
  });

  it('should format messages with sender details', async () => {
    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const firstMessage = response.data.messages[0];
    
    expect(firstMessage.sender).toBeDefined();
    expect(firstMessage.sender.username).toBeDefined();
    expect(firstMessage.sender.fullName).toBeDefined();
  });

  it('should support cursor-based pagination', async () => {
    // Get first 2 messages
    req.query.limit = '2';

    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.messages.length).toBe(2);
    expect(response.data.hasMore).toBe(true);
    expect(response.data.cursor).toBeDefined();
  });

  it('should use cursor to get next page', async () => {
    // Get first page
    req.query.limit = '2';
    await getMessages(req, res);
    
    const firstResponse = res.status().json.calls.argsFor(0)[0];
    const cursor = firstResponse.data.cursor;

    // Get next page
    req.query.cursor = cursor;
    res.status.calls.reset();
    res.status().json.calls.reset();
    
    await getMessages(req, res);

    const secondResponse = res.status().json.calls.argsFor(0)[0];
    
    expect(secondResponse.data.messages.length).toBe(2);
    expect(secondResponse.data.messages[0]._id).not.toBe(firstResponse.data.messages[0]._id);
  });

  it('should return hasMore false on last page', async () => {
    req.query.limit = '10'; // More than total messages

    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.hasMore).toBe(false);
    expect(response.data.cursor).toBeNull();
  });

  it('should default to limit 50', async () => {
    // Create 60 messages
    for (let i = 0; i < 55; i++) {
      await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: `Extra message ${i}`,
        status: 'sent'
      });
    }

    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.messages.length).toBe(50);
    expect(response.data.hasMore).toBe(true);
  });

  it('should limit to max 100 messages', async () => {
    req.query.limit = '200'; // Try to get more than max

    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.messages.length).toBeLessThanOrEqual(100);
  });

  it('should return 400 if conversationId invalid', async () => {
    req.params.conversationId = 'invalid-id';

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 403 if not a participant', async () => {
    req.user._id = user3._id; // Not in conversation

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not a participant');
  });

  it('should return empty array if no messages', async () => {
    // Create new empty conversation
    const emptyConv = await Conversation.createIndividual(user1._id, user2._id);
    await Message.deleteMany({ conversation: conversation._id });

    req.params.conversationId = emptyConv._id.toString();

    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.messages.length).toBe(0);
    expect(response.data.hasMore).toBe(false);
  });

  it('should include message status', async () => {
    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.messages[0].status).toBeDefined();
    expect(['sent', 'delivered', 'seen']).toContain(response.data.messages[0].status);
  });

  it('should include message image if present', async () => {
    await Message.create({
      conversation: conversation._id,
      sender: user1._id,
      image: 'https://example.com/image.jpg',
      status: 'sent'
    });

    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const imageMessage = response.data.messages.find(m => m.image);
    
    expect(imageMessage).toBeDefined();
    expect(imageMessage.image).toBe('https://example.com/image.jpg');
  });

  it('should handle cursor with invalid format', async () => {
    req.query.cursor = 'invalid-cursor';

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid cursor');
  });

  it('should return total count of messages', async () => {
    await getMessages(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.total).toBe(5);
  });
});
