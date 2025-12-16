const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { leaveGroup } = require('../../../controllers/conversation/leaveGroupController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const { MIN_GROUP_PARTICIPANTS } = require('../../../utils/constants');

describe('leaveGroup Controller', () => {
  let admin, user2, user3, user4;
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

    // Create group conversation with admin, user2, user3, user4
    groupConversation = await Conversation.createGroup(
      admin._id,
      'Test Group',
      [user2._id, user3._id, user4._id]
    );

    // Setup request and response mocks
    req = {
      user: { _id: user4._id },
      params: {
        conversationId: groupConversation._id.toString()
      }
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

  it('should leave group successfully', async () => {
    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.message).toContain('left');
  });

  it('should remove user from participants in database', async () => {
    await leaveGroup(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    const participantIds = updated.participants.map(id => id.toString());
    
    expect(participantIds).not.toContain(user4._id.toString());
    expect(participantIds.length).toBe(3); // admin, user2, user3
  });

  it('should remove unreadCount for leaving user', async () => {
    await leaveGroup(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.unreadCount.has(user4._id.toString())).toBe(false);
  });

  it('should return success message without conversation data', async () => {
    await leaveGroup(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data).toBeUndefined();
  });

  it('should return 400 if conversationId invalid', async () => {
    req.params.conversationId = 'invalid-id';

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 400 if conversation is not a group', async () => {
    // Create individual conversation
    const individualConv = await Conversation.createIndividual(admin._id, user2._id);
    
    req.params.conversationId = individualConv._id.toString();
    req.user._id = admin._id;

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('group');
  });

  it('should return 403 if user not in group', async () => {
    const outsideUser = await User.create({
      username: 'outside',
      fullName: 'Outside User',
      email: 'outside@example.com',
      password: 'password123'
    });

    req.user._id = outsideUser._id;

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not a member');
  });

  it('should return 400 if leaving would go below minimum participants', async () => {
    // Remove members until only 3 left (minimum)
    groupConversation.participants = [admin._id, user2._id, user4._id];
    await groupConversation.save();

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('at least');
  });

  it('should return 400 if admin tries to leave', async () => {
    req.user._id = admin._id;

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('admin');
    expect(response.message).toContain('Transfer');
  });

  it('should allow non-admin to leave when above minimum', async () => {
    // Have 4 members, can leave down to 3
    req.user._id = user4._id;

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.participants.length).toBe(3);
  });

  it('should allow multiple members to leave sequentially', async () => {
    // User4 leaves first (4 -> 3 members)
    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    let updated = await Conversation.findById(groupConversation._id);
    expect(updated.participants.length).toBe(3); // admin, user2, user3

    // User3 cannot leave (would go below minimum of 3)
    req.user._id = user3._id;
    res.status.calls.reset();
    res.status().json.calls.reset();
    
    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    updated = await Conversation.findById(groupConversation._id);
    expect(updated.participants.length).toBe(3); // Still 3
  });

  it('should not allow third member to leave (would go below min)', async () => {
    // Remove user4 and user3, leaving only admin, user2
    groupConversation.participants = [admin._id, user2._id, user3._id];
    await groupConversation.save();

    req.user._id = user3._id;

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.message).toContain('at least');
  });
});
