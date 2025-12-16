const mongoose = require('mongoose');
const mongoHelper = require('../../helpers/DBUtils');
const { markConversationAsSeen } = require('../../../controllers/conversation/markAsSeenController');
const Conversation = require('../../../models/Conversation');
const Message = require('../../../models/Message');
const User = require('../../../models/User');

describe('markConversationAsSeen Controller', () => {
  let user1, user2, user3;
  let conversation, groupConversation;
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

    // Create conversations
    conversation = await Conversation.createIndividual(user1._id, user2._id);
    groupConversation = await Conversation.createGroup(
      user1._id,
      'Test Group',
      [user2._id, user3._id]
    );

    // Create messages from user2 to user1
    messages = [];
    for (let i = 0; i < 3; i++) {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: user2._id,
        content: `Message ${i + 1}`,
        status: 'sent'
      });
      messages.push(msg);
    }

    // Set unreadCount for user1
    conversation.unreadCount.set(user1._id.toString(), 3);
    await conversation.save();

    // Setup request and response mocks
    req = {
      user: { _id: user1._id },
      params: { conversationId: conversation._id.toString() }
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

  it('should mark conversation as seen successfully', async () => {
    await markConversationAsSeen(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(true);
    expect(response.message).toContain('marked as seen');
  });

  it('should reset unreadCount to 0', async () => {
    await markConversationAsSeen(req, res);

    const updated = await Conversation.findById(conversation._id);
    expect(updated.unreadCount.get(user1._id.toString())).toBe(0);
  });

  it('should add user to seenBy for all unseen messages', async () => {
    await markConversationAsSeen(req, res);

    const updatedMessages = await Message.find({ conversation: conversation._id });
    
    for (const msg of updatedMessages) {
      const seenByUser = msg.seenBy.find(s => s.userId.toString() === user1._id.toString());
      expect(seenByUser).toBeDefined();
      expect(seenByUser.seenAt).toBeDefined();
    }
  });

  it('should update message status to "seen"', async () => {
    await markConversationAsSeen(req, res);

    const updatedMessages = await Message.find({ conversation: conversation._id });
    
    for (const msg of updatedMessages) {
      expect(msg.status).toBe('seen');
    }
  });

  it('should not add duplicate seenBy entries', async () => {
    // Mark as seen first time
    await markConversationAsSeen(req, res);

    // Mark as seen again
    res.status.calls.reset();
    res.status().json.calls.reset();
    
    await markConversationAsSeen(req, res);

    const updatedMessages = await Message.find({ conversation: conversation._id });
    
    for (const msg of updatedMessages) {
      const seenByEntries = msg.seenBy.filter(s => s.userId.toString() === user1._id.toString());
      expect(seenByEntries.length).toBe(1); // Only one entry
    }
  });

  it('should work with group conversations', async () => {
    // Create group messages
    await Message.create({
      conversation: groupConversation._id,
      sender: user2._id,
      content: 'Group message',
      status: 'sent'
    });

    groupConversation.unreadCount.set(user1._id.toString(), 1);
    await groupConversation.save();

    req.params.conversationId = groupConversation._id.toString();

    await markConversationAsSeen(req, res);

    const updated = await Conversation.findById(groupConversation._id);
    expect(updated.unreadCount.get(user1._id.toString())).toBe(0);
  });

  it('should not mark messages sent by user as seen by that user', async () => {
    // User1 sends a message
    await Message.create({
      conversation: conversation._id,
      sender: user1._id,
      content: 'My own message',
      status: 'sent'
    });

    await markConversationAsSeen(req, res);

    const ownMessage = await Message.findOne({
      conversation: conversation._id,
      sender: user1._id
    });

    const seenByUser1 = ownMessage.seenBy.find(s => s.userId.toString() === user1._id.toString());
    expect(seenByUser1).toBeUndefined(); // Should not be in seenBy
  });

  it('should return 400 if conversationId invalid', async () => {
    req.params.conversationId = 'invalid-id';

    await markConversationAsSeen(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('Invalid');
  });

  it('should return 404 if conversation not found', async () => {
    req.params.conversationId = new mongoose.Types.ObjectId().toString();

    await markConversationAsSeen(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not found');
  });

  it('should return 403 if not a participant', async () => {
    req.user._id = user3._id; // Not in individual conversation

    await markConversationAsSeen(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const response = res.status().json.calls.argsFor(0)[0];
    
    expect(response.success).toBe(false);
    expect(response.message).toContain('not a participant');
  });

  it('should handle conversation with no messages', async () => {
    // Create empty conversation
    const emptyConv = await Conversation.createIndividual(user1._id, user3._id);
    emptyConv.unreadCount.set(user1._id.toString(), 0);
    await emptyConv.save();

    req.params.conversationId = emptyConv._id.toString();

    await markConversationAsSeen(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.success).toBe(true);
  });

  it('should return updated unreadCount in response', async () => {
    await markConversationAsSeen(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.unreadCount).toBe(0);
  });

  it('should return count of messages marked as seen', async () => {
    await markConversationAsSeen(req, res);

    const response = res.status().json.calls.argsFor(0)[0];
    expect(response.data.markedCount).toBe(3); // 3 messages from user2
  });
});
