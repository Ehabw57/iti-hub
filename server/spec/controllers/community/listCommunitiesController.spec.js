const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const listCommunities = require('../../../controllers/community/listCommunitiesController');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');

describe('listCommunitiesController', () => {
  let testUser, community1, community2, community3, req, res;

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
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Create communities with different member counts and tags
    community1 = await Community.create({
      name: 'Tech Community',
      description: 'A technology focused community',
      tags: ['Technology', 'Education'],
      owners: [testUser._id],
      moderators: [testUser._id],
      memberCount: 100,
      postCount: 50,
      createdAt: new Date('2024-01-01')
    });

    community2 = await Community.create({
      name: 'Art Community',
      description: 'For artists and creators',
      tags: ['Arts', 'Photography'],
      owners: [testUser._id],
      moderators: [testUser._id],
      memberCount: 250,
      postCount: 120,
      createdAt: new Date('2024-02-01')
    });

    community3 = await Community.create({
      name: 'Tech Startups',
      description: 'Startup founders and entrepreneurs',
      tags: ['Technology', 'Business'],
      owners: [testUser._id],
      moderators: [testUser._id],
      memberCount: 50,
      postCount: 30,
      createdAt: new Date('2024-03-01')
    });

    // Create membership for testUser in community1
    await CommunityMember.create({
      user: testUser._id,
      community: community1._id,
      role: 'owner'
    });

    req = {
      query: {},
      user: null
    };
    res = responseMock();
  });

  describe('Basic Listing', () => {
    it('should return all communities when no filters applied', async () => {
      await listCommunities(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.communities.length).toBe(3);
    });

    it('should sort communities by memberCount descending by default', async () => {
      await listCommunities(req, res);

      const communities = res.body.data.communities;
      expect(communities[0].memberCount).toBe(250); // Art Community
      expect(communities[1].memberCount).toBe(100); // Tech Community
      expect(communities[2].memberCount).toBe(50);  // Tech Startups
    });

    it('should return community with all required fields', async () => {
      await listCommunities(req, res);

      const community = res.body.data.communities[0];
      expect(community._id).toBeDefined();
      expect(community.name).toBeDefined();
      expect(community.description).toBeDefined();
      expect(community.profilePicture).toBeDefined();
      expect(community.coverImage).toBeDefined();
      expect(community.tags).toBeDefined();
      expect(community.memberCount).toBeDefined();
      expect(community.postCount).toBeDefined();
      expect(community.createdAt).toBeDefined();
    });
  });

  describe('Pagination', () => {
    it('should paginate results with default values (page=1, limit=10)', async () => {
      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(3);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('should respect custom page and limit', async () => {
      req.query = { page: '2', limit: '1' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(1);
      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.communities[0].memberCount).toBe(100); // Second community by memberCount
    });

    it('should return empty array when page exceeds available pages', async () => {
      req.query = { page: '10', limit: '10' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(0);
      expect(res.body.data.pagination.page).toBe(10);
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('should handle invalid page/limit gracefully', async () => {
      req.query = { page: 'invalid', limit: 'invalid' };

      await listCommunities(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });
  });

  describe('Search', () => {
    it('should filter communities by name substring (case-insensitive)', async () => {
      req.query = { search: 'tech' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(2);
      expect(res.body.data.communities[0].name).toBe('Tech Community');
      expect(res.body.data.communities[1].name).toBe('Tech Startups');
    });

    it('should return empty array when no communities match search', async () => {
      req.query = { search: 'nonexistent' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(0);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should search case-insensitively', async () => {
      req.query = { search: 'COMMUNITY' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(2); // 'Tech Community' and 'Art Community'
    });
  });

  describe('Tag Filtering', () => {
    it('should filter communities by single tag', async () => {
      req.query = { tags: 'Technology' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(2);
      const names = res.body.data.communities.map(c => c.name);
      expect(names).toContain('Tech Community');
      expect(names).toContain('Tech Startups');
    });

    it('should filter communities by multiple tags (array)', async () => {
      req.query = { tags: ['Technology', 'Arts'] };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(3); // All communities have at least one of these tags
    });

    it('should filter communities by multiple tags (comma-separated string)', async () => {
      req.query = { tags: 'Technology,Arts' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(3);
    });

    it('should return empty array when no communities have specified tag', async () => {
      req.query = { tags: 'Sports' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(0);
    });
  });

  describe('Combined Filters', () => {
    it('should apply search and tag filters together', async () => {
      req.query = { search: 'tech', tags: 'Business' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(1);
      expect(res.body.data.communities[0].name).toBe('Tech Startups');
    });

    it('should apply search, tags, and pagination together', async () => {
      req.query = { search: 'tech', tags: 'Technology', page: '1', limit: '1' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.total).toBe(2);
    });
  });

  describe('Authentication Context', () => {
    it('should include isJoined=false when user is not authenticated', async () => {
      await listCommunities(req, res);

      const communities = res.body.data.communities;
      communities.forEach(community => {
        expect(community.isJoined).toBe(false);
      });
    });

    it('should include isJoined=true for joined communities when authenticated', async () => {
      req.user = testUser;

      await listCommunities(req, res);

      const techCommunity = res.body.data.communities.find(c => c.name === 'Tech Community');
      const artCommunity = res.body.data.communities.find(c => c.name === 'Art Community');

      expect(techCommunity.isJoined).toBe(true);  // User is member
      expect(artCommunity.isJoined).toBe(false);  // User is not member
    });

    it('should work without authentication (optional auth)', async () => {
      req.user = null;

      await listCommunities(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array when no communities exist', async () => {
      await clearDatabase();

      await listCommunities(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.communities.length).toBe(0);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should handle limit > total communities', async () => {
      req.query = { limit: '100' };

      await listCommunities(req, res);

      expect(res.body.data.communities.length).toBe(3);
    });

    it('should handle negative page numbers', async () => {
      req.query = { page: '-1' };

      await listCommunities(req, res);

      expect(res.body.data.pagination.page).toBe(1); // Default to 1
    });

    it('should handle negative limit', async () => {
      req.query = { limit: '-5' };

      await listCommunities(req, res);

      expect(res.body.data.pagination.limit).toBe(10); // Default to 10
    });
  });
});
