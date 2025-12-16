const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { removeGroupMember } = require('../../../controllers/conversation/removeGroupMemberController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const { MIN_GROUP_PARTICIPANTS } = require('../../../utils/constants');

describe('removeGroupMember Controller', () => {
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
      user: { _id: admin._id },
      params: {
        conversationId: groupConversation._id.toString(),
        userId: user4._id.toString()
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

  it('should remove member from group successfully', async () => {
    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.message).toContain('removed');
  });

  it('should update participants array in database', async () => {
    await removeGroupMember(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    const participantIds = updated.participants.map(id => id.toString());
    
    expect(participantIds).not.toContain(user4._id.toString());
    expect(participantIds.length).toBe(3); // admin, user2, user3
  });

  it('should remove unreadCount for removed member', async () => {
    await removeGroupMember(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.unreadCount.has(user4._id.toString())).toBe(false);
  });

  it('should return updated conversation in response', async () => {
    await removeGroupMember(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversation).toBeDefined();
    expect(response.data.conversation.participants.length).toBe(3);
  });

  it('should return 400 if conversationId invalid', async () => {
    req.params.conversationId = 'invalid-id';

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 400 if userId invalid', async () => {
    req.params.userId = 'invalid-id';

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 400 if conversation is not a group', async () => {
    // Create individual conversation
    const individualConv = await Conversation.createIndividual(admin._id, user2._id);
    
    req.params.conversationId = individualConv._id.toString();

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('group');
  });

  it('should return 403 if user is not admin', async () => {
    req.user._id = user2._id; // Not admin

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('admin');
  });

  it('should return 400 if user not in group', async () => {
    const outsideUser = await User.create({
      username: 'outside',
      fullName: 'Outside User',
      email: 'outside@example.com',
      password: 'password123'
    });

    req.params.userId = outsideUser._id.toString();

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not a member');
  });

  it('should return 400 if trying to remove admin', async () => {
    req.params.userId = admin._id.toString();

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('admin');
  });

  it('should return 400 if removal would go below minimum participants', async () => {
    // Remove members until only 3 left (minimum)
    groupConversation.participants = [admin._id, user2._id, user3._id];
    await groupConversation.save();

    req.params.userId = user3._id.toString();

    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('at least');
  });

  it('should allow removal when above minimum participants', async () => {
    // Have 4 members (admin, user2, user3, user4), can remove down to 3
    await removeGroupMember(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.participants.length).toBe(3);
  });
});
