const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { addGroupMember } = require('../../../controllers/conversation/addGroupMemberController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const { MAX_GROUP_PARTICIPANTS } = require('../../../utils/constants');

describe('addGroupMember Controller', () => {
  let admin, user2, user3, user4, user5;
  let groupConversation;
  let req, res;

  beforeAll(async () => {
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    await mongoHelper.clearDatabase();

    // Create test users
    admin = await User.create({
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
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

    user5 = await User.create({
      username: 'user5',
      fullName: 'User Five',
      email: 'user5@example.com',
      password: 'password123'
    });

    // Create group conversation with admin, user2, user3
    groupConversation = await Conversation.createGroup(
      admin._id,
      'Test Group',
      [user2._id, user3._id]
    );

    // Setup request and response mocks
    req = {
      user: { _id: admin._id },
      params: { conversationId: groupConversation._id.toString() },
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

  it('should add member to group successfully', async () => {
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.message).toContain('added');
  });

  it('should update participants array in database', async () => {
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    const participantIds = updated.participants.map(id => id.toString());
    
    expect(participantIds).toContain(user4._id.toString());
    expect(participantIds.length).toBe(4); // admin, user2, user3, user4
  });

  it('should initialize unreadCount for new member', async () => {
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.unreadCount.has(user4._id.toString())).toBe(true);
    expect(updated.unreadCount.get(user4._id.toString())).toBe(0);
  });

  it('should return updated conversation in response', async () => {
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversation).toBeDefined();
    expect(response.data.conversation.participants.length).toBe(4);
  });

  it('should return 400 if conversationId invalid', async () => {
    req.params.conversationId = 'invalid-id';
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 400 if userId missing', async () => {
    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('required');
  });

  it('should return 400 if userId invalid', async () => {
    req.body.userId = 'invalid-id';

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 400 if conversation is not a group', async () => {
    // Create individual conversation
    const individualConv = await Conversation.createIndividual(admin._id, user2._id);
    
    req.params.conversationId = individualConv._id.toString();
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('group');
  });

  it('should return 403 if user is not admin', async () => {
    req.user._id = user2._id; // Not admin
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('admin');
  });

  it('should return 403 if user not a participant', async () => {
    req.user._id = user5._id; // Not in group at all
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
  });

  it('should return 404 if user to add not found', async () => {
    req.body.userId = new mongoose.Types.ObjectId().toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('User not found');
  });

  it('should return 400 if user already in group', async () => {
    req.body.userId = user2._id.toString(); // Already a member

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('already');
  });

  it('should return 400 if group at maximum capacity', async () => {
    // Mock a full group by setting participants to max
    const fakeParticipants = [];
    for (let i = 0; i < MAX_GROUP_PARTICIPANTS; i++) {
      fakeParticipants.push(new mongoose.Types.ObjectId());
    }
    groupConversation.participants = fakeParticipants;
    await groupConversation.save();

    // Try to add one more (should fail)
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('maximum');
  });

  it('should allow adding at exactly max capacity', async () => {
    // Set participants to max - 1
    const fakeParticipants = [];
    for (let i = 0; i < MAX_GROUP_PARTICIPANTS - 1; i++) {
      fakeParticipants.push(new mongoose.Types.ObjectId());
    }
    groupConversation.participants = fakeParticipants;
    groupConversation.admin = admin._id; // Ensure admin is set
    await groupConversation.save();

    // This should succeed (reaching exactly max)
    req.body.userId = user4._id.toString();

    await addGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.participants.length).toBe(MAX_GROUP_PARTICIPANTS);
  });
});
