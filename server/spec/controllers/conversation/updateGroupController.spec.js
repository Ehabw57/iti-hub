const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { updateGroup } = require('../../../controllers/conversation/updateGroupController');
const Conversation = require('../../../models/Conversation');
const User = require('../../../models/User');
const { 
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH
} = require('../../../utils/constants');

describe('updateGroup Controller', () => {
  let admin, user2, user3;
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

    // Create group conversation
    groupConversation = await Conversation.createGroup(
      admin._id,
      'Test Group',
      [user2._id, user3._id],
      'https://example.com/old-image.jpg'
    );

    // Setup request and response mocks
    req = {
      user: { _id: admin._id },
      params: { conversationId: groupConversation._id.toString() },
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

  it('should update group name successfully', async () => {
    req.body.name = 'Updated Group Name';

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.conversation.name).toBe('Updated Group Name');
  });

  it('should update group image with upload', async () => {
    req.file = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg'
    };

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.data.conversation.image).toBeDefined();
    expect(response.data.conversation.image).not.toBe('https://example.com/old-image.jpg');
  });

  it('should update both name and image', async () => {
    req.body.name = 'New Name';
    req.file = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg'
    };

    await updateGroup(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.data.conversation.name).toBe('New Name');
    expect(response.data.conversation.image).toBeDefined();
  });

  it('should update name in database', async () => {
    req.body.name = 'DB Updated Name';

    await updateGroup(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.name).toBe('DB Updated Name');
  });

  it('should trim group name', async () => {
    req.body.name = '  Trimmed Name  ';

    await updateGroup(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.conversation.name).toBe('Trimmed Name');
  });

  it('should return 400 if conversationId invalid', async () => {
    req.params.conversationId = 'invalid-id';
    req.body.name = 'New Name';

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 400 if no updates provided', async () => {
    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Provide');
  });

  it('should return 400 if name too short', async () => {
    req.body.name = 'A'; // Only 1 character

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('at least');
  });

  it('should return 400 if name too long', async () => {
    req.body.name = 'A'.repeat(MAX_GROUP_NAME_LENGTH + 1);

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('cannot exceed');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();
    req.body.name = 'New Name';

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 400 if conversation is not a group', async () => {
    // Create individual conversation
    const individualConv = await Conversation.createIndividual(admin._id, user2._id);
    
    req.params.conversationId = individualConv._id.toString();
    req.body.name = 'New Name';

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('group');
  });

  it('should return 403 if user is not admin', async () => {
    req.user._id = user2._id; // Not admin
    req.body.name = 'New Name';

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('admin');
  });

  it('should allow updating image only', async () => {
    req.file = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg'
    };

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.name).toBe('Test Group'); // Name unchanged
    expect(updated.image).toBeDefined();
  });

  it('should return conversation with updated timestamp', async () => {
    const originalUpdatedAt = groupConversation.updatedAt;
    
    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    req.body.name = 'Updated Name';

    await updateGroup(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
