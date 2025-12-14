const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const createPost = require('../../../controllers/post/createPostController');
const Post = require('../../../models/Post');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');

describe('Create Community Post Controller', () => {
  let testUser, testCommunity, nonMemberUser, req, res;

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

    // Create non-member user
    nonMemberUser = await User.create({
      email: 'nonmember@example.com',
      username: 'nonmember',
      password: 'hashedpassword123',
      fullName: 'Non Member'
    });

    // Create test community
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'A test community',
      tags: ['Technology', 'Education'],
      owners: [testUser._id],
      moderators: [testUser._id],
      memberCount: 1
    });

    // Create membership for testUser
    await CommunityMember.create({
      user: testUser._id,
      community: testCommunity._id,
      role: 'owner'
    });

    req = {
      user: testUser,
      body: {},
      files: []
    };
    res = responseMock();
  });

  describe('Community Post Creation', () => {
    it('should create a post in a community when user is a member', async () => {
      req.body = {
        content: 'This is a community post',
        community: testCommunity._id.toString()
      };

      await createPost(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.content).toBe('This is a community post');
      expect(res.body.data.post.community).toBeDefined();
    });

    it('should increment community postCount when post is created', async () => {
      req.body = {
        content: 'This is a community post',
        community: testCommunity._id.toString()
      };

      await createPost(req, res);

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.postCount).toBe(1);
    });

    it('should reject post creation when user is not a member', async () => {
      req.user = nonMemberUser;
      req.body = {
        content: 'Trying to post without membership',
        community: testCommunity._id.toString()
      };

      await createPost(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('member');
    });

    it('should reject post creation with invalid community ID', async () => {
      req.body = {
        content: 'Post with invalid community',
        community: 'invalidid123'
      };

      await createPost(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid community ID');
    });

    it('should reject post creation when community does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      req.body = {
        content: 'Post to non-existent community',
        community: fakeId
      };

      await createPost(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Community not found');
    });

    it('should create regular post when community is not provided', async () => {
      req.body = {
        content: 'Regular post without community'
      };

      await createPost(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      
      const post = await Post.findById(res.body.data.post._id);
      expect(post.community).toBeNull();
    });

    it('should not increment community postCount for regular posts', async () => {
      req.body = {
        content: 'Regular post without community'
      };

      await createPost(req, res);

      const community = await Community.findById(testCommunity._id);
      expect(community.postCount).toBe(0);
    });
  });
});
