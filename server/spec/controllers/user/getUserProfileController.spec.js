const getUserProfile = require('../../../controllers/user/getUserProfileController');
const User = require('../../../models/User');
const Connection = require('../../../models/Connection');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');

describe('getUserProfileController', () => {
  let testUser1, testUser2, testUser3;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test users
    testUser1 = await User.create({
      username: 'johndoe',
      email: 'john@test.com',
      password: 'password123',
      fullName: 'John Doe',
      bio: 'Software developer',
      specialization: 'Backend Engineering',
      location: 'San Francisco'
    });

    testUser2 = await User.create({
      username: 'janedoe',
      email: 'jane@test.com',
      password: 'password123',
      fullName: 'Jane Doe',
      bio: 'Frontend developer',
      followersCount: 5,
      followingCount: 10
    });

    testUser3 = await User.create({
      username: 'bobsmith',
      email: 'bob@test.com',
      password: 'password123',
      fullName: 'Bob Smith'
    });
  });

  describe('GET /users/:username', () => {
    it('should return user profile when user exists', async () => {
      const req = {
        params: { username: 'johndoe' }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('johndoe');
      expect(res.body.data.fullName).toBe('John Doe');
      expect(res.body.data.bio).toBe('Software developer');
      expect(res.body.data.specialization).toBe('Backend Engineering');
      expect(res.body.data.location).toBe('San Francisco');
    });

    it('should not include sensitive fields in response', async () => {
      const req = {
        params: { username: 'johndoe' }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.resetPasswordToken).toBeUndefined();
      expect(res.body.data.resetPasswordExpires).toBeUndefined();
      expect(res.body.data.isBlocked).toBeUndefined();
      expect(res.body.data.blockReason).toBeUndefined();
      expect(res.body.data.__v).toBeUndefined();
    });

    it('should not include email by default', async () => {
      const req = {
        params: { username: 'johndoe' }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.email).toBeUndefined();
    });

    it('should return 404 when user does not exist', async () => {
      const req = {
        params: { username: 'nonexistent' }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle username case-insensitively', async () => {
      const req = {
        params: { username: 'JohnDoe' }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.username).toBe('johndoe');
    });
  });

  describe('Authenticated User Viewing Profile', () => {
    it('should include email when user views their own profile', async () => {
      const req = {
        params: { username: 'johndoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.email).toBe('john@test.com');
      expect(res.body.data.isOwnProfile).toBe(true);
    });

    it('should not include email when user views another profile', async () => {
      const req = {
        params: { username: 'janedoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.email).toBeUndefined();
      expect(res.body.data.isOwnProfile).toBe(false);
    });

    it('should include isFollowing metadata when authenticated', async () => {
      // User1 follows User2
      await Connection.createFollow(testUser1._id, testUser2._id);

      const req = {
        params: { username: 'janedoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.isFollowing).toBe(true);
      expect(res.body.data.followsYou).toBe(false);
    });

    it('should include followsYou metadata when target follows requester', async () => {
      // User2 follows User1
      await Connection.createFollow(testUser2._id, testUser1._id);

      const req = {
        params: { username: 'janedoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.isFollowing).toBe(false);
      expect(res.body.data.followsYou).toBe(true);
    });

    it('should show mutual follow status correctly', async () => {
      // Mutual follows
      await Connection.createFollow(testUser1._id, testUser2._id);
      await Connection.createFollow(testUser2._id, testUser1._id);

      const req = {
        params: { username: 'janedoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.isFollowing).toBe(true);
      expect(res.body.data.followsYou).toBe(true);
    });
  });

  describe('Block Functionality', () => {
    it('should return 403 when blocked user tries to view profile', async () => {
      // User2 blocks User1
      await Connection.createBlock(testUser2._id, testUser1._id);

      const req = {
        params: { username: 'janedoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You cannot view this profile');
    });

    it('should allow viewing profile when requester has blocked target', async () => {
      // User1 blocks User2
      await Connection.createBlock(testUser1._id, testUser2._id);

      const req = {
        params: { username: 'janedoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isBlocked).toBe(true);
    });

    it('should not show block status when viewing own profile', async () => {
      const req = {
        params: { username: 'johndoe' },
        user: { _id: testUser1._id }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.isBlocked).toBeUndefined();
    });
  });

  describe('Unauthenticated Access', () => {
    it('should allow unauthenticated users to view profiles', async () => {
      const req = {
        params: { username: 'johndoe' }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('johndoe');
    });

    it('should not include relationship metadata for unauthenticated users', async () => {
      const req = {
        params: { username: 'johndoe' }
      };
      const res = responseMock();

      await getUserProfile(req, res);

      expect(res.body.data.isFollowing).toBeUndefined();
      expect(res.body.data.followsYou).toBeUndefined();
      expect(res.body.data.isOwnProfile).toBeUndefined();
    });
  });
});
