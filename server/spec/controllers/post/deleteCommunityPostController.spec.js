const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const deletePost = require('../../../controllers/post/deletePostController');
const Post = require('../../../models/Post');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');

describe('Delete Community Post Controller', () => {
  let testUser, testCommunity, communityPost, regularPost, req, res;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword123',
      fullName: 'Test User'
    });

    // Create test community with postCount = 2
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'A test community',
      tags: ['Technology', 'Education'],
      owners: [testUser._id],
      moderators: [testUser._id],
      memberCount: 1,
      postCount: 2
    });

    // Create membership
    await CommunityMember.create({
      user: testUser._id,
      community: testCommunity._id,
      role: 'owner'
    });

    // Create community post
    communityPost = await Post.create({
      author: testUser._id,
      content: 'Community post content',
      community: testCommunity._id
    });

    // Create regular post
    regularPost = await Post.create({
      author: testUser._id,
      content: 'Regular post content'
    });

    req = {
      user: testUser,
      params: {}
    };
    res = responseMock();
  });

  describe('Community Post Deletion', () => {
    it('should decrement community postCount when deleting community post', async () => {
      req.params.id = communityPost._id.toString();

      await deletePost(req, res);

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.postCount).toBe(1);
    });

    it('should successfully delete community post', async () => {
      req.params.id = communityPost._id.toString();

      await deletePost(req, res);

      expect(res.statusCode).toBe(204);
      
      const deletedPost = await Post.findById(communityPost._id);
      expect(deletedPost).toBeNull();
    });

    it('should not decrement postCount when deleting regular post', async () => {
      req.params.id = regularPost._id.toString();

      await deletePost(req, res);

      const community = await Community.findById(testCommunity._id);
      expect(community.postCount).toBe(2); // Should remain unchanged
    });

    it('should not decrement postCount below zero', async () => {
      // Set postCount to 0
      testCommunity.postCount = 0;
      await testCommunity.save();

      req.params.id = communityPost._id.toString();

      await deletePost(req, res);

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.postCount).toBe(0); // Should not go negative
    });
  });
});
