const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { getConversation } = require('../../../controllers/conversation/getConversationController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const { CONVERSATION_TYPES } = require('../../../utils/constants');

describe('getConversation Controller', () => {
  let user1, user2, user3, user4;
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
      password: 'password123',
      profilePicture: 'https://example.com/user1.jpg'
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

    // Create conversations
    conversation = await Conversation.create({
      type: CONVERSATION_TYPES.INDIVIDUAL,
      participants: [user1._id, user2._id]
    });

    groupConversation = await Conversation.create({
      type: CONVERSATION_TYPES.GROUP,
      name: 'Test Group',
      image: 'https://example.com/group.jpg',
      admin: user1._id,
      participants: [user1._id, user2._id, user3._id]
    });

    // Setup request and response mocks
    req = {
      user: { _id: user1._id },
      params: {}
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

  it('should return conversation details if user is participant', async () => {
    req.params.conversationId = conversation._id.toString();

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.conversation).toBeDefined();
    expect(response.data.conversation._id.toString()).toBe(conversation._id.toString());
  });

  it('should include all participant details', async () => {
    req.params.conversationId = conversation._id.toString();

    await getConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conv = response.data.conversation;
    
    expect(conv.participants).toBeDefined();
    expect(conv.participants.length).toBe(2);
    
    const participant = conv.participants.find(
      p => p._id.toString() === user2._id.toString()
    );
    expect(participant.username).toBe('user2');
    expect(participant.fullName).toBe('User Two');
  });

  it('should include group name and image for groups', async () => {
    req.params.conversationId = groupConversation._id.toString();

    await getConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conv = response.data.conversation;
    
    expect(conv.name).toBe('Test Group');
    expect(conv.image).toBe('https://example.com/group.jpg');
  });

  it('should include admin info for groups', async () => {
    req.params.conversationId = groupConversation._id.toString();

    await getConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conv = response.data.conversation;
    
    expect(conv.admin).toBeDefined();
    expect(conv.admin._id.toString()).toBe(user1._id.toString());
    expect(conv.admin.username).toBe('user1');
  });

  it('should return 403 if user not participant', async () => {
    req.user._id = user4._id;
    req.params.conversationId = conversation._id.toString();

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not a participant');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 400 for invalid conversation ID', async () => {
    req.params.conversationId = 'invalid-id';

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should populate participant online status', async () => {
    user2.lastSeen = new Date();
    await user2.save();

    req.params.conversationId = conversation._id.toString();

    await getConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const participant = response.data.conversation.participants.find(
      p => p._id.toString() === user2._id.toString()
    );
    
    expect(participant.isOnline).toBeDefined();
  });

  it('should format individual conversation correctly', async () => {
    req.params.conversationId = conversation._id.toString();

    await getConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conv = response.data.conversation;
    
    expect(conv.type).toBe(CONVERSATION_TYPES.INDIVIDUAL);
    expect(conv.name).toBeUndefined();
    expect(conv.admin).toBeUndefined();
  });

  it('should format group conversation correctly', async () => {
    req.params.conversationId = groupConversation._id.toString();

    await getConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conv = response.data.conversation;
    
    expect(conv.type).toBe(CONVERSATION_TYPES.GROUP);
    expect(conv.name).toBeDefined();
    expect(conv.admin).toBeDefined();
  });

  it('should handle deleted participants gracefully', async () => {
    // Add a participant that will be deleted
    const tempUser = await User.create({
      username: 'tempuser',
      fullName: 'Temp User',
      email: 'temp@example.com',
      password: 'password123'
    });

    const tempConv = await Conversation.create({
      type: CONVERSATION_TYPES.GROUP,
      name: 'Temp Group',
      admin: user1._id,
      participants: [user1._id, user2._id, tempUser._id]
    });

    // Delete the temp user
    await User.findByIdAndDelete(tempUser._id);

    req.params.conversationId = tempConv._id.toString();

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.success).toBe(true);
  });
});
