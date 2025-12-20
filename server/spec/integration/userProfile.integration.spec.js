const request = require('supertest');
const User = require('../../models/User');
const Connection = require('../../models/Connection');
const { connectToDB, disconnectFromDB, clearDatabase } = require('../helpers/DBUtils');

// Set JWT_SECRET for tests if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
}

const app = require('../../app');

describe('User Profile and Connections Integration Tests', () => {
  let user1Token, user2Token, user3Token;
  let user1Id, user2Id, user3Id;
  let user1Username, user2Username, user3Username;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Register three test users
    const user1Res = await request(app)
      .post('/auth/register')
      .send({
        email: 'user1@test.com',
        password: 'Password123',
        username: 'testuser1',
        fullName: 'Test User One'
      });
    
    if (user1Res.status !== 201) {
      console.error('User1 registration failed:', user1Res.status, user1Res.body);
      throw new Error('Failed to register user1');
    }
    
    user1Token = user1Res.body.data.token;
    user1Id = user1Res.body.data.user._id;
    user1Username = user1Res.body.data.user.username;

    const user2Res = await request(app)
      .post('/auth/register')
      .send({
        email: 'user2@test.com',
        password: 'Password123',
        username: 'testuser2',
        fullName: 'Test User Two'
      });
    
    if (user2Res.status !== 201) {
      console.error('User2 registration failed:', user2Res.status, user2Res.body);
      throw new Error('Failed to register user2');
    }
    
    user2Token = user2Res.body.data.token;
    user2Id = user2Res.body.data.user._id;
    user2Username = user2Res.body.data.user.username;

    const user3Res = await request(app)
      .post('/auth/register')
      .send({
        email: 'user3@test.com',
        password: 'Password123',
        username: 'testuser3',
        fullName: 'Test User Three'
      });
    
    if (user3Res.status !== 201) {
      console.error('User3 registration failed:', user3Res.status, user3Res.body);
      throw new Error('Failed to register user3');
    }
    
    user3Token = user3Res.body.data.token;
    user3Id = user3Res.body.data.user._id;
    user3Username = user3Res.body.data.user.username;
  });

  describe('User Profile Flow', () => {
    it('should get user profile without authentication', async () => {
      const res = await request(app)
        .get(`/users/${user1Username}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(user1Username);
      expect(res.body.data.email).toBeUndefined(); // Email not included for other users
      expect(res.body.data.fullName).toBe('Test User One');
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.isFollowing).toBeUndefined(); // No auth, no isFollowing
    });

    it('should get user profile with authentication and isFollowing status', async () => {
      // User2 follows User1
      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // User2 views User1's profile
      const res = await request(app)
        .get(`/users/${user1Username}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(user1Username);
      expect(res.body.data.isFollowing).toBe(true);
    });

    it('should update own profile successfully', async () => {
      const res = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          fullName: 'Updated Name',
          bio: 'This is my new bio',
          location: 'Cairo, Egypt'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Updated Name');
      expect(res.body.data.bio).toBe('This is my new bio');
      expect(res.body.data.location).toBe('Cairo, Egypt');

      // Verify changes persisted
      const profileRes = await request(app)
        .get(`/users/${user1Username}`)
        .expect(200);

      expect(profileRes.body.data.fullName).toBe('Updated Name');
      expect(profileRes.body.data.bio).toBe('This is my new bio');
    });

    it('should reject profile update without authentication', async () => {
      const res = await request(app)
        .put('/users/profile')
        .send({
          fullName: 'Hacker Name'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should prevent updating restricted fields', async () => {
      const res = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          fullName: 'Valid Name',
          email: 'hacker@evil.com', // Should be ignored
          role: 'admin', // Should be ignored
          followersCount: 999999, // Should be ignored
          followingCount: 999999 // Should be ignored
        })
        .expect(200);

      expect(res.body.data.fullName).toBe('Valid Name');
      expect(res.body.data.email).toBe('user1@test.com'); // Not changed
      
      // Verify in database
      const user = await User.findById(user1Id);
      expect(user.email).toBe('user1@test.com');
      expect(user.role).toBe('user');
      expect(user.followersCount).toBe(0);
      expect(user.followingCount).toBe(0);
    });
  });

  describe('Follow/Unfollow Flow', () => {
    it('should complete follow and unfollow cycle', async () => {
      // User1 follows User2
      const followRes = await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(followRes.body.success).toBe(true);
      expect(followRes.body.data.followedUserId).toBe(user2Id);

      // Verify counts updated
      const user1 = await User.findById(user1Id);
      const user2 = await User.findById(user2Id);
      expect(user1.followingCount).toBe(1);
      expect(user2.followersCount).toBe(1);

      // User1 unfollows User2
      const unfollowRes = await request(app)
        .delete(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(unfollowRes.body.success).toBe(true);

      // Verify counts reset
      const user1After = await User.findById(user1Id);
      const user2After = await User.findById(user2Id);
      expect(user1After.followingCount).toBe(0);
      expect(user2After.followersCount).toBe(0);
    });

    it('should prevent following yourself', async () => {
      const res = await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot follow yourself');
    });

    it('should require authentication to follow', async () => {
      const res = await request(app)
        .post(`/users/${user2Id}/follow`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should handle mutual follows correctly', async () => {
      // User1 follows User2
      await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // User2 follows User1
      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Check both users' counts
      const user1 = await User.findById(user1Id);
      const user2 = await User.findById(user2Id);
      expect(user1.followingCount).toBe(1);
      expect(user1.followersCount).toBe(1);
      expect(user2.followingCount).toBe(1);
      expect(user2.followersCount).toBe(1);
    });
  });

  describe('Followers and Following Lists', () => {
    beforeEach(async () => {
      // Setup: User2 and User3 follow User1
      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user2Token}`);

      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user3Token}`);

      // User1 follows User2
      await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`);
    });

    it('should get followers list without authentication', async () => {
      const res = await request(app)
        .get(`/users/${user1Id}/followers`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.followers.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
      
      // Should not have isFollowing when not authenticated
      expect(res.body.data.followers[0].isFollowing).toBeUndefined();
    });

    it('should get followers list with isFollowing status when authenticated', async () => {
      const res = await request(app)
        .get(`/users/${user1Id}/followers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.followers.length).toBe(2);
      
      // User1 follows User2, so User2 should have isFollowing: true
      const user2InList = res.body.data.followers.find(f => f._id === user2Id);
      expect(user2InList.isFollowing).toBe(true);
      
      // User1 doesn't follow User3, so User3 should have isFollowing: false
      const user3InList = res.body.data.followers.find(f => f._id === user3Id);
      expect(user3InList.isFollowing).toBe(false);
    });

    it('should get following list', async () => {
      const res = await request(app)
        .get(`/users/${user1Id}/following`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.following.length).toBe(1);
      expect(res.body.data.following[0]._id).toBe(user2Id);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('should support pagination in followers list', async () => {
      // Get first page with limit 1
      const res1 = await request(app)
        .get(`/users/${user1Id}/followers?page=1&limit=1`)
        .expect(200);

      expect(res1.body.data.followers.length).toBe(1);
      expect(res1.body.data.pagination.page).toBe(1);
      expect(res1.body.data.pagination.limit).toBe(1);
      expect(res1.body.data.pagination.total).toBe(2);
      expect(res1.body.data.pagination.totalPages).toBe(2);

      // Get second page
      const res2 = await request(app)
        .get(`/users/${user1Id}/followers?page=2&limit=1`)
        .expect(200);

      expect(res2.body.data.followers.length).toBe(1);
      expect(res2.body.data.pagination.page).toBe(2);
      
      // Ensure different users on each page
      expect(res1.body.data.followers[0]._id).not.toBe(res2.body.data.followers[0]._id);
    });

    it('should return empty array for user with no followers', async () => {
      // Create a new user with no followers
      const newUserRes = await request(app)
        .post('/auth/register')
        .send({
          email: 'lonely@test.com',
          password: 'Password123',
          username: 'lonelyuser',
          fullName: 'Lonely User'
        });

      const res = await request(app)
        .get(`/users/${newUserRes.body.data.user._id}/followers`)
        .expect(200);

      expect(res.body.data.followers.length).toBe(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  describe('Block/Unblock Flow', () => {
    it('should block user and remove follow relationships', async () => {
      // Setup: Mutual follows
      await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`);

      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user2Token}`);

      // Verify mutual follows exist
      const followsExistBefore = await Connection.isFollowing(user1Id, user2Id);
      expect(followsExistBefore).toBe(true);

      // User1 blocks User2
      const blockRes = await request(app)
        .post(`/users/${user2Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(blockRes.body.success).toBe(true);
      expect(blockRes.body.data.blockedUserId).toBe(user2Id);

      // Verify follows removed in both directions
      const user1FollowsUser2 = await Connection.isFollowing(user1Id, user2Id);
      const user2FollowsUser1 = await Connection.isFollowing(user2Id, user1Id);
      expect(user1FollowsUser2).toBe(false);
      expect(user2FollowsUser1).toBe(false);

      // Verify counts updated
      const user1After = await User.findById(user1Id);
      const user2After = await User.findById(user2Id);
      expect(user1After.followingCount).toBe(0);
      expect(user1After.followersCount).toBe(0);
      expect(user2After.followingCount).toBe(0);
      expect(user2After.followersCount).toBe(0);
    });

    it('should prevent following a blocked user', async () => {
      // User1 blocks User2
      await request(app)
        .post(`/users/${user2Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // User1 tries to follow User2
      const res = await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot follow this user due to a block');
    });

    it('should prevent blocked user from following blocker', async () => {
      // User1 blocks User2
      await request(app)
        .post(`/users/${user2Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // User2 tries to follow User1
      const res = await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot follow this user due to a block');
    });

    it('should unblock user and allow following again', async () => {
      // User1 blocks User2
      await request(app)
        .post(`/users/${user2Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // User1 unblocks User2
      const unblockRes = await request(app)
        .delete(`/users/${user2Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(unblockRes.body.success).toBe(true);

      // Now User1 can follow User2 again
      const followRes = await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(followRes.body.success).toBe(true);
    });

    it('should require authentication to block', async () => {
      const res = await request(app)
        .post(`/users/${user2Id}/block`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should prevent blocking yourself', async () => {
      const res = await request(app)
        .post(`/users/${user1Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot block yourself');
    });
  });

  describe('Complete User Journey', () => {
    it('should handle full user interaction workflow', async () => {
      // 1. User1 updates their profile
      await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          fullName: 'Alice Smith',
          bio: 'Software Engineer',
          location: 'Cairo'
        })
        .expect(200);

      // 2. User2 views User1's profile (not following yet)
      const profileRes1 = await request(app)
        .get(`/users/${user1Username}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(profileRes1.body.data.fullName).toBe('Alice Smith');
      expect(profileRes1.body.data.isFollowing).toBe(false);

      // 3. User2 follows User1
      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // 4. User2 views User1's profile again (now following)
      const profileRes2 = await request(app)
        .get(`/users/${user1Username}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(profileRes2.body.data.isFollowing).toBe(true);

      // 5. User1 views their followers list
      const followersRes = await request(app)
        .get(`/users/${user1Id}/followers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(followersRes.body.data.followers.length).toBe(1);
      expect(followersRes.body.data.followers[0]._id).toBe(user2Id);

      // 6. User3 also follows User1
      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(200);

      // 7. User1 follows User2 back
      await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 8. Check User1's followers and following counts
      const user1 = await User.findById(user1Id);
      expect(user1.followersCount).toBe(2); // User2 and User3
      expect(user1.followingCount).toBe(1); // User2

      // 9. User1 blocks User3
      await request(app)
        .post(`/users/${user3Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 10. Verify User3's follow was removed
      const user1After = await User.findById(user1Id);
      expect(user1After.followersCount).toBe(1); // Only User2 now
      expect(user1After.followingCount).toBe(1); // Still User2

      // 11. User3 tries to follow User1 again (should fail)
      const followBlockedRes = await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(400);

      expect(followBlockedRes.body.success).toBe(false);

      // 12. User1 unblocks User3
      await request(app)
        .delete(`/users/${user3Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 13. User3 follows User1 successfully
      await request(app)
        .post(`/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(200);

      // 14. Final verification
      const finalUser1 = await User.findById(user1Id);
      expect(finalUser1.followersCount).toBe(2);
      expect(finalUser1.followingCount).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle non-existent user profile request', async () => {
      const res = await request(app)
        .get('/users/nonexistentuser')
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should handle invalid userId in follow request', async () => {
      const res = await request(app)
        .post('/users/invalidid/follow')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(500); // validateConnectionAction throws error for invalid ObjectId

      expect(res.body.success).toBe(false);
    });

    it('should handle profile update with validation errors', async () => {
      const res = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          fullName: 'A', // Too short
          bio: 'x'.repeat(301) // Too long
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should prevent duplicate follow', async () => {
      // First follow
      await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Second follow attempt
      const res = await request(app)
        .post(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Already following this user');
    });

    it('should prevent unfollowing when not following', async () => {
      const res = await request(app)
        .delete(`/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not following this user');
    });

    it('should prevent duplicate block', async () => {
      // First block
      await request(app)
        .post(`/users/${user2Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Second block attempt
      const res = await request(app)
        .post(`/users/${user2Id}/block`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Already blocking this user');
    });

    it('should handle pagination with invalid parameters', async () => {
      // Negative page
      const res1 = await request(app)
        .get(`/users/${user1Id}/followers?page=-1`)
        .expect(200);

      expect(res1.body.data.pagination.page).toBe(1); // Should default to 1

      // Limit exceeding max
      const res2 = await request(app)
        .get(`/users/${user1Id}/followers?limit=200`)
        .expect(200);

      expect(res2.body.data.pagination.limit).toBe(100); // Should cap at MAX_LIMIT
    });
  });
});
