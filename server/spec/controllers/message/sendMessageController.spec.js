const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { sendMessage } = require('../../../controllers/message/sendMessageController');
const Conversation = require('../../../models/Conversation');
const Message = require('../../../models/Message');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const { MAX_MESSAGE_CONTENT_LENGTH } = require('../../../utils/constants');

describe('sendMessage Controller', () => {
  let user1, user2, user3;
  let conversation, groupConversation;
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

    // Create conversations
    conversation = await Conversation.createIndividual(user1._id, user2._id);
    groupConversation = await Conversation.createGroup(
      user1._id,
      'Test Group',
      [user2._id, user3._id]
    );

    // Setup request and response mocks
    req = {
      user: { _id: user1._id },
      params: { conversationId: conversation._id.toString() },
      body: {},
      file: null
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

  it('should send text message successfully', async () => {
    req.body.content = 'Hello, World!';

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.message).toBeDefined();
    expect(response.data.message.content).toBe('Hello, World!');
  });

  it('should send image message successfully', async () => {
    req.file = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg'
    };

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.message.image).toBeDefined();
  });

  it('should send message with both content and image', async () => {
    req.body.content = 'Check this out!';
    req.file = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg'
    };

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.message.content).toBe('Check this out!');
    expect(response.data.message.image).toBeDefined();
  });

  it('should set message status to "sent"', async () => {
    req.body.content = 'Test message';

    await sendMessage(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.message.status).toBe('sent');
  });

  it('should include sender details in response', async () => {
    req.body.content = 'Test message';

    await sendMessage(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.message.sender).toBeDefined();
    expect(response.data.message.sender.username).toBe('user1');
  });

  it('should update conversation lastMessage', async () => {
    req.body.content = 'Latest message';

    await sendMessage(req, res);

    const updated = await Conversation.findById(conversation._id);
    expect(updated.lastMessage.toString()).toBeDefined();
  });

  it('should increment unreadCount for other participants', async () => {
    req.body.content = 'Unread message';

    await sendMessage(req, res);

    const updated = await Conversation.findById(conversation._id);
    expect(updated.unreadCount.get(user2._id.toString())).toBeGreaterThan(0);
  });

  it('should work with group conversations', async () => {
    req.params.conversationId = groupConversation._id.toString();
    req.body.content = 'Group message';

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
  });

  it('should increment unreadCount for all group participants except sender', async () => {
    req.params.conversationId = groupConversation._id.toString();
    req.body.content = 'Group message';

    await sendMessage(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    // User2 and User3 should have unread count incremented
    expect(updated.unreadCount.get(user2._id.toString())).toBeGreaterThan(0);
    expect(updated.unreadCount.get(user3._id.toString())).toBeGreaterThan(0);
    // User1 (sender) should not have unread count incremented
    expect(updated.unreadCount.get(user1._id.toString()) || 0).toBe(0);
  });

  it('should return 400 if neither content nor image provided', async () => {
    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('content or image');
  });

  it('should return 400 if content too long', async () => {
    req.body.content = 'A'.repeat(MAX_MESSAGE_CONTENT_LENGTH + 1);

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('cannot exceed');
  });

  it('should return 400 if conversationId invalid', async () => {
    req.params.conversationId = 'invalid-id';
    req.body.content = 'Test';

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();
    req.body.content = 'Test';

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 403 if not a participant', async () => {
    req.user._id = user3._id; // Not in individual conversation
    req.body.content = 'Test';

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not a participant');
  });

  it('should return 403 if blocked in individual conversation', async () => {
    // User2 blocks User1
    await Connection.create({
      follower: user2._id,
      following: user1._id,
      type: 'block'
    });

    req.body.content = 'Blocked message';

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('blocked');
  });

  it('should allow messages in group despite blocking', async () => {
    // User2 blocks User1, but they're in same group
    await Connection.create({
      follower: user2._id,
      following: user1._id,
      type: 'block'
    });

    req.params.conversationId = groupConversation._id.toString();
    req.body.content = 'Group message despite block';

    await sendMessage(req, res);

    // Should succeed in group conversations
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should trim message content', async () => {
    req.body.content = '  Trimmed message  ';

    await sendMessage(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.message.content).toBe('Trimmed message');
  });

  it('should create message in database', async () => {
    req.body.content = 'Database test';

    await sendMessage(req, res);

    const messages = await Message.find({ conversation: conversation._id });
    expect(messages.length).toBe(1);
    expect(messages[0].content).toBe('Database test');
  });

  it('should handle empty string content when image provided', async () => {
    req.body.content = '   '; // Only whitespace
    req.file = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg'
    };

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.status().json.calls.argsFor(0)[0];
    
    // Content should be undefined or empty, but message sent successfully
    expect(response.success).toBe(true);
    expect(response.data.message.image).toBeDefined();
  });
});
