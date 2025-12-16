const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { getConversations } = require('../../../controllers/conversation/getConversationsController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const Message = require('../../../models/Message');
const { CONVERSATION_TYPES } = require('../../../utils/constants');

describe('getConversations Controller', () => {
  let user1, user2, user3, user4;
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
      password: 'password123',
      profilePicture: 'https://example.com/user1.jpg'
    });

    user2 = await User.create({
      username: 'user2',
      fullName: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
      profilePicture: 'https://example.com/user2.jpg'
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

    // Setup request and response mocks
    req = {
      user: { _id: user1._id },
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

  it('should return paginated list of conversations', async () => {
    // Create conversations
    const conv1 = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    const conv2 = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user3._id]
    });

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = res.status().json;
    expect(jsonCall).toHaveBeenCalled();
    
    const response = jsonCall.calls.argsFor(0)[0];
    expect(response.success).toBe(true);
    expect(response.data.conversations).toBeDefined();
    expect(response.data.conversations.length).toBe(2);
  });

  it('should sort by most recent first (updatedAt desc)', async () => {
    const conv1 = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const conv2 = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user3._id]
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conversations = response.data.conversations;
    
    expect(conversations[0]._id.toString()).toBe(conv2._id.toString());
    expect(conversations[1]._id.toString()).toBe(conv1._id.toString());
  });

  it('should include unread count for current user', async () => {
    const conv = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id],
      unreadCount: new Map([[user1._id.toString(), 5]])
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conversation = response.data.conversations[0];
    
    expect(conversation.unreadCount).toBe(5);
  });

  it('should include last message preview', async () => {
    const conv = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    const message = await Message.create({
      conversation: conv._id,
      sender: user2._id,
      content: 'Last message text'
    });

    conv.lastMessage = {
      content: message.content,
      senderId: message.sender,
      timestamp: message.createdAt
    };
    await conv.save();

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conversation = response.data.conversations[0];
    
    expect(conversation.lastMessage).toBeDefined();
    expect(conversation.lastMessage.content).toBe('Last message text');
  });

  it('should include participant details', async () => {
    await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conversation = response.data.conversations[0];
    
    expect(conversation.participants).toBeDefined();
    expect(conversation.participants.length).toBeGreaterThan(0);
    
    const participant = conversation.participants.find(
      p => p._id.toString() !== user1._id.toString()
    );
    expect(participant.username).toBe('user2');
    expect(participant.fullName).toBe('User Two');
  });

  it('should show online status for individual chats', async () => {
    // Update user2 lastSeen to recent
    user2.lastSeen = new Date();
    await user2.save();

    await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conversation = response.data.conversations[0];
    
    const participant = conversation.participants.find(
      p => p._id.toString() === user2._id.toString()
    );
    expect(participant.isOnline).toBeDefined();
  });

  it('should handle empty conversation list', async () => {
    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.conversations).toEqual([]);
  });

  it('should respect pagination limits', async () => {
    // Create 25 conversations
    for (let i = 0; i < 25; i++) {
      const otherUser = await User.create({
        username: `testuser${i}`,
        fullName: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: 'password123'
      });

      await Conversation.create({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user1._id, otherUser._id]
      });
    }

    req.query.limit = 10;

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversations.length).toBe(10);
  });

  it('should default to page 1 and limit 20', async () => {
    // Create 25 conversations
    for (let i = 0; i < 25; i++) {
      const otherUser = await User.create({
        username: `testuser${i}`,
        fullName: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: 'password123'
      });

      await Conversation.create({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user1._id, otherUser._id]
      });
    }

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversations.length).toBe(20);
    expect(response.data.pagination.page).toBe(1);
    expect(response.data.pagination.limit).toBe(20);
  });

  it('should cap limit at 100', async () => {
    req.query.limit = 150;

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.pagination.limit).toBe(100);
  });

  it('should include both individual and group conversations', async () => {
    await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    await Conversation.create({
      type: CONVERSATION_TYPES.GROUP,
      name: 'Test Group',
      admin: user1._id,
      participants: [user1._id, user2._id, user3._id]
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversations.length).toBe(2);
    
    const types = response.data.conversations.map(c => c.type);
    expect(types).toContain(CONVERSATION_TYPES.INDIVIDUAL);
    expect(types).toContain(CONVERSATION_TYPES.GROUP);
  });

  it('should exclude conversations where user was removed', async () => {
    await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    // Conversation without user1
    await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user3._id, user4._id]
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversations.length).toBe(1);
  });

  it('should handle database errors gracefully', async () => {
    // Force an error by using invalid user
    req.user = { _id: 'invalid-id' };

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.success).toBe(false);
  });

  it('should format individual conversations correctly', async () => {
    await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conversation = response.data.conversations[0];
    
    expect(conversation.type).toBe(CONVERSATION_TYPES.INDIVIDUAL);
    expect(conversation.participants).toBeDefined();
    expect(conversation.name).toBeUndefined();
    expect(conversation.admin).toBeUndefined();
  });

  it('should format group conversations correctly', async () => {
    await Conversation.create({
      type: CONVERSATION_TYPES.GROUP,
      name: 'My Group',
      image: 'https://example.com/group.jpg',
      admin: user1._id,
      participants: [user1._id, user2._id, user3._id]
    });

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conversation = response.data.conversations[0];
    
    expect(conversation.type).toBe(CONVERSATION_TYPES.GROUP);
    expect(conversation.name).toBe('My Group');
    expect(conversation.image).toBe('https://example.com/group.jpg');
    expect(conversation.admin).toBeDefined();
  });

  it('should calculate total pages correctly', async () => {
    // Create 25 conversations
    for (let i = 0; i < 25; i++) {
      const otherUser = await User.create({
        username: `testuser${i}`,
        fullName: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: 'password123'
      });

      await Conversation.create({
        type: CONVERSATION_TYPES.INDIVIDUAL,
        participants: [user1._id, otherUser._id]
      });
    }

    req.query.limit = 10;

    await getConversations(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.pagination.totalPages).toBe(3);
    expect(response.data.pagination.total).toBe(25);
  });

  it('should return 200 with valid data', async () => {
    await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.conversations).toBeDefined();
    expect(response.data.pagination).toBeDefined();
  });
});
