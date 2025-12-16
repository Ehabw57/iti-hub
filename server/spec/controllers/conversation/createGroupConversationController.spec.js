const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { createGroupConversation } = require('../../../controllers/conversation/createGroupConversationController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const { 
  CONVERSATION_TYPES, 
  MIN_GROUP_PARTICIPANTS, 
  MAX_GROUP_PARTICIPANTS,
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH
} = require('../../../utils/constants');

describe('createGroupConversation Controller', () => {
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

  it('should create group conversation with valid data', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.conversation).toBeDefined();
    expect(response.data.conversation.type).toBe(CONVERSATION_TYPES.GROUP);
    expect(response.data.conversation.name).toBe('Test Group');
  });

  it('should set creator as admin', async () => {
    req.body = {
      name: 'Admin Test',
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversation.admin._id.toString()).toBe(user1._id.toString());
  });

  it('should include creator in participants', async () => {
    req.body = {
      name: 'Participant Test',
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    const conversation = await Conversation.findOne({ name: 'Participant Test' });
    const participantIds = conversation.participants.map(id => id.toString());
    
    expect(participantIds).toContain(user1._id.toString());
    expect(participantIds.length).toBe(4);
  });

  it('should return 400 if name missing', async () => {
    req.body = {
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('name');
  });

  it('should return 400 if participantIds missing', async () => {
    req.body = {
      name: 'Test Group'
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('participantIds');
  });

  it('should return 400 if name too short', async () => {
    req.body = {
      name: 'A', // Only 1 character
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('at least');
  });

  it('should return 400 if name too long', async () => {
    req.body = {
      name: 'A'.repeat(MAX_GROUP_NAME_LENGTH + 1),
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('cannot exceed');
  });

  it('should return 400 if participantIds not array', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: 'not-an-array'
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('array');
  });

  it('should return 400 if too few participants', async () => {
    req.body = {
      name: 'Small Group',
      participantIds: [user2._id.toString()] // Only 1 participant (2 total with creator)
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain(`at least ${MIN_GROUP_PARTICIPANTS}`);
  });

  it('should return 400 if too many participants', async () => {
    // Create array of MAX_GROUP_PARTICIPANTS participant IDs
    const participantIds = [];
    for (let i = 0; i < MAX_GROUP_PARTICIPANTS; i++) {
      participantIds.push(new mongoose.Types.ObjectId().toString());
    }

    req.body = {
      name: 'Large Group',
      participantIds
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain(`cannot exceed ${MAX_GROUP_PARTICIPANTS}`);
  });

  it('should return 400 if invalid participantId in array', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: ['invalid-id', user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 400 if creator included in participantIds', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: [
        user1._id.toString(), // Creator
        user2._id.toString(),
        user3._id.toString()
      ]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('automatically added');
  });

  it('should return 400 if duplicate participantIds', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: [
        user2._id.toString(),
        user2._id.toString(), // Duplicate
        user3._id.toString()
      ]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('duplicate');
  });

  it('should return 404 if participant not found', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: [
        new mongoose.Types.ObjectId().toString(), // Non-existent
        user3._id.toString(),
        user4._id.toString()
      ]
    };

    await createGroupConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should trim group name', async () => {
    req.body = {
      name: '  Test Group  ',
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversation.name).toBe('Test Group');
  });

  it('should handle optional image URL', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()],
      image: 'https://example.com/group.jpg'
    };

    await createGroupConversation(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversation.image).toBe('https://example.com/group.jpg');
  });

  it('should initialize unreadCount with zero for all participants', async () => {
    req.body = {
      name: 'Test Group',
      participantIds: [user2._id.toString(), user3._id.toString(), user4._id.toString()]
    };

    await createGroupConversation(req, res);

    const conversation = await Conversation.findOne({ name: 'Test Group' });
    expect(conversation.unreadCount.size).toBe(4); // 4 participants
    
    // Check all have count of 0
    conversation.participants.forEach(participantId => {
      expect(conversation.unreadCount.get(participantId)).toBe(0);
    });
  });
});
