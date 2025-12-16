const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { createConversation } = require('../../../controllers/conversation/createConversationController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const { CONVERSATION_TYPES } = require('../../../utils/constants');

describe('createConversation Controller', () => {
  let user1, user2, user3;
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

    // Setup request and response mocks
    req = {
      user: { _id: user1._id },
      body: {}
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

  it('should create new individual conversation', async () => {
    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.conversation).toBeDefined();
    expect(response.data.conversation.type).toBe(CONVERSATION_TYPES.INDIVIDUAL);
  });

  it('should return existing conversation if already exists', async () => {
    // Create conversation first
    const existing = await Conversation.createIndividual(user1._id, user2._id);

    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.conversation._id.toString()).toBe(existing._id.toString());
    expect(response.message).toContain('already exists');
  });

  it('should return 201 for new conversation', async () => {
    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should return 200 for existing conversation', async () => {
    await Conversation.createIndividual(user1._id, user2._id);

    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 if trying to message self', async () => {
    req.body.participantId = user1._id.toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('yourself');
  });

  it('should return 400 if participantId missing', async () => {
    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('required');
  });

  it('should return 400 if participantId invalid', async () => {
    req.body.participantId = 'invalid-id';

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 404 if participant user not found', async () => {
    req.body.participantId = new mongoose.Types.ObjectId().toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 403 if blocked by participant', async () => {
    // User2 blocks User1
    await Connection.create({
      follower: user2._id,
      following: user1._id,
      type: 'block'
    });

    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('blocked');
  });

  it('should return 403 if blocker of participant', async () => {
    // User1 blocks User2
    await Connection.create({
      follower: user1._id,
      following: user2._id,
      type: 'block'
    });

    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('blocked');
  });

  it('should sort participants array consistently', async () => {
    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    const conversation = await Conversation.findOne({
      participants: { $all: [user1._id, user2._id] }
    });

    const sortedIds = [user1._id, user2._id]
      .map(id => id.toString())
      .sort();

    const convIds = conversation.participants
      .map(id => id.toString())
      .sort();

    expect(convIds).toEqual(sortedIds);
  });

  it('should set type to "individual"', async () => {
    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversation.type).toBe(CONVERSATION_TYPES.INDIVIDUAL);
  });

  it('should not set name or admin for individual', async () => {
    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    const conv = response.data.conversation;
    
    expect(conv.name).toBeUndefined();
    expect(conv.admin).toBeUndefined();
  });

  it('should initialize unreadCount as empty', async () => {
    req.body.participantId = user2._id.toString();

    await createConversation(req, res);

    const conversation = await Conversation.findOne({
      participants: { $all: [user1._id, user2._id] }
    });

    expect(conversation.unreadCount.size).toBe(0);
  });
});
