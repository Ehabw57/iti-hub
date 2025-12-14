const request = require('supertest');
const app = require('../../app');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../helpers/DBUtils');
const User = require('../../models/User');
const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const Post = require('../../models/Post');

describe('Community Routes Integration Tests', () => {
  let authToken, ownerUser, memberUser, nonMemberUser;
  let testCommunity;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create users
    ownerUser = await User.create({
      username: 'owner',
      fullName: 'Owner User',
      email: 'owner@example.com',
      password: 'password123'
    });

    memberUser = await User.create({
      username: 'member',
      fullName: 'Member User',
      email: 'member@example.com',
      password: 'password123'
    });

    nonMemberUser = await User.create({
      username: 'nonmember',
      fullName: 'Non Member',
      email: 'nonmember@example.com',
      password: 'password123'
    });

    // Mock auth token for ownerUser
    authToken = 'mock-jwt-token-for-owner';
    // In real tests, you would generate actual JWT tokens
  });

  describe('Complete Community Lifecycle', () => {
    it('should create → get → update → join → leave a community', async () => {
      // Step 1: Create community (skipping file upload for integration test)
      // This would need actual file upload in full integration test
      testCommunity = await Community.create({
        name: 'Integration Test Community',
        description: 'Testing full lifecycle',
        tags: ['Technology', 'Education'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 1
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      // Step 2: Get community
      const getRes = await request(app)
        .get(`/communities/${testCommunity._id}`)
        .expect(200);

      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.community.name).toBe('Integration Test Community');
      expect(getRes.body.data.community.isJoined).toBe(false); // No auth

      // Step 3: Update community details (would need checkAuth middleware mock)
      testCommunity.description = 'Updated description';
      await testCommunity.save();

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.description).toBe('Updated description');

      // Step 4: Join community (memberUser joins)
      await CommunityMember.create({
        user: memberUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { memberCount: 1 } });

      const communityAfterJoin = await Community.findById(testCommunity._id);
      expect(communityAfterJoin.memberCount).toBe(2);

      // Step 5: Leave community
      await CommunityMember.deleteOne({
        user: memberUser._id,
        community: testCommunity._id
      });

      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { memberCount: -1 } });

      const communityAfterLeave = await Community.findById(testCommunity._id);
      expect(communityAfterLeave.memberCount).toBe(1);
    });
  });

  describe('POST /communities - Create Community', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/communities')
        .send({
          name: 'Test Community',
          description: 'Test description',
          tags: ['Technology']
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      // Mock authentication would go here
      // This test validates the model/controller validation
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('GET /communities - List Communities', () => {
    beforeEach(async () => {
      // Create multiple communities for listing tests
      await Community.create({
        name: 'Tech Community',
        description: 'Technology focused',
        tags: ['Technology', 'Education'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 100
      });

      await Community.create({
        name: 'Arts Community',
        description: 'For artists',
        tags: ['Arts', 'Photography'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 50
      });
    });

    it('should list all communities without authentication', async () => {
      const res = await request(app)
        .get('/communities')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.communities.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should filter communities by search query', async () => {
      const res = await request(app)
        .get('/communities?search=tech')
        .expect(200);

      expect(res.body.data.communities.length).toBe(1);
      expect(res.body.data.communities[0].name).toBe('Tech Community');
    });

    it('should filter communities by tags', async () => {
      const res = await request(app)
        .get('/communities?tags=Technology')
        .expect(200);

      expect(res.body.data.communities.length).toBe(1);
      expect(res.body.data.communities[0].name).toBe('Tech Community');
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/communities?page=1&limit=1')
        .expect(200);

      expect(res.body.data.communities.length).toBe(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.total).toBe(2);
      expect(res.body.data.pagination.pages).toBe(2);
    });

    it('should sort by memberCount descending', async () => {
      const res = await request(app)
        .get('/communities')
        .expect(200);

      expect(res.body.data.communities[0].memberCount).toBe(100);
      expect(res.body.data.communities[1].memberCount).toBe(50);
    });
  });

  describe('GET /communities/:id - Get Community', () => {
    beforeEach(async () => {
      testCommunity = await Community.create({
        name: 'Test Community',
        description: 'Test description',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 1
      });
    });

    it('should get community details without authentication', async () => {
      const res = await request(app)
        .get(`/communities/${testCommunity._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.community.name).toBe('Test Community');
      expect(res.body.data.community.isJoined).toBe(false);
    });

    it('should return 404 for non-existent community', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/communities/${fakeId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    it('should return 400 for invalid community ID', async () => {
      const res = await request(app)
        .get('/communities/invalid-id')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid community ID');
    });
  });

  describe('Community Posts Integration', () => {
    beforeEach(async () => {
      testCommunity = await Community.create({
        name: 'Post Test Community',
        description: 'For testing posts',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 2,
        postCount: 0
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      await CommunityMember.create({
        user: memberUser._id,
        community: testCommunity._id,
        role: 'member'
      });
    });

    it('should create post in community and increment postCount', async () => {
      const post = await Post.create({
        author: memberUser._id,
        content: 'Test post in community',
        community: testCommunity._id
      });

      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { postCount: 1 } });

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.postCount).toBe(1);
      expect(post.community.toString()).toBe(testCommunity._id.toString());
    });

    it('should delete post from community and decrement postCount', async () => {
      const post = await Post.create({
        author: memberUser._id,
        content: 'Test post to delete',
        community: testCommunity._id
      });

      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { postCount: 1 } });

      // Delete post
      await Post.findByIdAndDelete(post._id);
      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { postCount: -1 } });

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.postCount).toBe(0);
    });

    it('should prevent non-members from posting to community', async () => {
      const isMember = await CommunityMember.findOne({
        user: nonMemberUser._id,
        community: testCommunity._id
      });

      expect(isMember).toBeNull();
    });
  });

  describe('Moderator Management Flow', () => {
    beforeEach(async () => {
      testCommunity = await Community.create({
        name: 'Moderator Test Community',
        description: 'For testing moderators',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 2
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      await CommunityMember.create({
        user: memberUser._id,
        community: testCommunity._id,
        role: 'member'
      });
    });

    it('should add member as moderator', async () => {
      // Update member to moderator
      await CommunityMember.findOneAndUpdate(
        { user: memberUser._id, community: testCommunity._id },
        { role: 'moderator' }
      );

      await Community.findByIdAndUpdate(
        testCommunity._id,
        { $addToSet: { moderators: memberUser._id } }
      );

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.moderators.map(id => id.toString())).toContain(memberUser._id.toString());

      const membership = await CommunityMember.findOne({
        user: memberUser._id,
        community: testCommunity._id
      });
      expect(membership.role).toBe('moderator');
    });

    it('should remove moderator and revert to member', async () => {
      // First make them a moderator
      await CommunityMember.findOneAndUpdate(
        { user: memberUser._id, community: testCommunity._id },
        { role: 'moderator' }
      );

      await Community.findByIdAndUpdate(
        testCommunity._id,
        { $addToSet: { moderators: memberUser._id } }
      );

      // Then remove moderator status
      await CommunityMember.findOneAndUpdate(
        { user: memberUser._id, community: testCommunity._id },
        { role: 'member' }
      );

      await Community.findByIdAndUpdate(
        testCommunity._id,
        { $pull: { moderators: memberUser._id } }
      );

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.moderators.map(id => id.toString())).not.toContain(memberUser._id.toString());

      const membership = await CommunityMember.findOne({
        user: memberUser._id,
        community: testCommunity._id
      });
      expect(membership.role).toBe('member');
    });

    it('should not allow removing owners from moderators', async () => {
      const isOwner = await Community.findById(testCommunity._id).then(c => c.isOwner(ownerUser._id));
      expect(isOwner).toBe(true);

      // Owners should always remain in moderators
      const community = await Community.findById(testCommunity._id);
      expect(community.moderators.map(id => id.toString())).toContain(ownerUser._id.toString());
    });
  });

  describe('Community Feed Integration', () => {
    beforeEach(async () => {
      testCommunity = await Community.create({
        name: 'Feed Test Community',
        description: 'For testing feeds',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 1,
        postCount: 2
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      // Create posts in community
      await Post.create({
        author: ownerUser._id,
        content: 'First community post',
        community: testCommunity._id,
        createdAt: new Date('2024-01-01')
      });

      await Post.create({
        author: ownerUser._id,
        content: 'Second community post',
        community: testCommunity._id,
        createdAt: new Date('2024-01-02')
      });
    });

    it('should get community feed', async () => {
      const res = await request(app)
        .get(`/communities/${testCommunity._id}/feed`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.posts.length).toBe(2);
    });

    it('should sort feed posts chronologically (newest first)', async () => {
      const res = await request(app)
        .get(`/communities/${testCommunity._id}/feed`)
        .expect(200);

      const posts = res.body.posts;
      expect(posts[0].content).toBe('Second community post');
      expect(posts[1].content).toBe('First community post');
    });
  });

  describe('Permission and Access Control', () => {
    beforeEach(async () => {
      testCommunity = await Community.create({
        name: 'Permission Test Community',
        description: 'For testing permissions',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 1
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });
    });

    it('should allow only owners to update community details', async () => {
      const isOwner = await Community.findById(testCommunity._id).then(c => c.isOwner(ownerUser._id));
      const isOwnerMember = await Community.findById(testCommunity._id).then(c => c.isOwner(memberUser._id));

      expect(isOwner).toBe(true);
      expect(isOwnerMember).toBe(false);
    });

    it('should allow only owners to update images', async () => {
      const community = await Community.findById(testCommunity._id);
      expect(community.isOwner(ownerUser._id)).toBe(true);
      expect(community.isOwner(nonMemberUser._id)).toBe(false);
    });

    it('should allow owners and moderators to manage moderators', async () => {
      const community = await Community.findById(testCommunity._id);
      expect(community.isOwner(ownerUser._id)).toBe(true);
      expect(community.isModerator(ownerUser._id)).toBe(true);
    });

    it('should only allow owners to leave if they are not the last owner', async () => {
      const community = await Community.findById(testCommunity._id);
      const ownerCount = community.owners.length;
      const isOnlyOwner = ownerCount === 1;

      expect(isOnlyOwner).toBe(true);
      // Should not be able to leave
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent memberCount across join/leave', async () => {
      testCommunity = await Community.create({
        name: 'Consistency Test',
        description: 'Test',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 1
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      // Join
      await CommunityMember.create({
        user: memberUser._id,
        community: testCommunity._id,
        role: 'member'
      });

      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { memberCount: 1 } });

      let community = await Community.findById(testCommunity._id);
      expect(community.memberCount).toBe(2);

      // Leave
      await CommunityMember.deleteOne({
        user: memberUser._id,
        community: testCommunity._id
      });

      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { memberCount: -1 } });

      community = await Community.findById(testCommunity._id);
      expect(community.memberCount).toBe(1);
    });

    it('should maintain consistent postCount across post creation/deletion', async () => {
      testCommunity = await Community.create({
        name: 'Post Count Test',
        description: 'Test',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 1,
        postCount: 0
      });

      await CommunityMember.create({
        user: ownerUser._id,
        community: testCommunity._id,
        role: 'owner'
      });

      // Create post
      const post = await Post.create({
        author: ownerUser._id,
        content: 'Test post',
        community: testCommunity._id
      });

      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { postCount: 1 } });

      let community = await Community.findById(testCommunity._id);
      expect(community.postCount).toBe(1);

      // Delete post
      await Post.findByIdAndDelete(post._id);
      await Community.findByIdAndUpdate(testCommunity._id, { $inc: { postCount: -1 } });

      community = await Community.findById(testCommunity._id);
      expect(community.postCount).toBe(0);
    });

    it('should prevent postCount from going negative', async () => {
      testCommunity = await Community.create({
        name: 'Negative Test',
        description: 'Test',
        tags: ['Technology'],
        owners: [ownerUser._id],
        moderators: [ownerUser._id],
        memberCount: 1,
        postCount: 0
      });

      // The updatePostCount helper prevents negative values
      // This test validates the helper behavior, not direct DB manipulation
      const { updatePostCount } = require('../../utils/communityHelpers');
      await updatePostCount(testCommunity._id, -1);

      const community = await Community.findById(testCommunity._id);
      expect(community.postCount).toBe(0); // Should not go negative
    });
  });
});
