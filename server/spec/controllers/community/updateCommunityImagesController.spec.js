const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const updateCommunityProfilePicture = require('../../../controllers/community/updateCommunityProfilePictureController');
const updateCommunityCoverImage = require('../../../controllers/community/updateCommunityCoverImageController');
const Community = require('../../../models/Community');
const User = require('../../../models/User');
const imageProcessor = require('../../../utils/imageProcessor');
const cloudinary = require('../../../utils/cloudinary');

describe('Update Community Images Controllers', () => {
  let ownerUser, nonOwnerUser, testCommunity, req, res;
  let mockBuffer;

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

    nonOwnerUser = await User.create({
      username: 'nonowner',
      fullName: 'Non Owner',
      email: 'nonowner@example.com',
      password: 'password123'
    });

    // Create community
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'Test description',
      tags: ['Technology'],
      owners: [ownerUser._id],
      moderators: [ownerUser._id],
      memberCount: 1
    });

    mockBuffer = Buffer.from('fake-image-data');

    req = {
      params: { id: testCommunity._id.toString() },
      user: ownerUser,
      file: {
        buffer: mockBuffer,
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      }
    };
    res = responseMock();

    // Spy on image processing functions
    spyOn(imageProcessor, 'processImage').and.returnValue(Promise.resolve(mockBuffer));
    spyOn(cloudinary, 'uploadToCloudinary').and.returnValue(
      Promise.resolve({ secure_url: 'https://cloudinary.com/test.jpg' })
    );
  });

  describe('Update Profile Picture Controller', () => {
    xit('should update profile picture when user is owner', async () => {
      await updateCommunityProfilePicture(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.community.profilePicture).toBe('https://cloudinary.com/test.jpg');
    });

    xit('should process and upload image correctly', async () => {
      await updateCommunityProfilePicture(req, res);

      expect(imageProcessor.processImage).toHaveBeenCalled();
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalled();
    });

    xit('should persist profile picture URL to database', async () => {
      await updateCommunityProfilePicture(req, res);

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.profilePicture).toBe('https://cloudinary.com/test.jpg');
    });

    it('should reject update when user is not owner', async () => {
      req.user = nonOwnerUser;

      await updateCommunityProfilePicture(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('owner');
    });

    it('should return 400 if no file is uploaded', async () => {
      req.file = undefined;

      await updateCommunityProfilePicture(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('image');
    });

    it('should return 400 for invalid community ID', async () => {
      req.params.id = 'invalid-id';

      await updateCommunityProfilePicture(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid community ID');
    });

    it('should return 404 if community does not exist', async () => {
      req.params.id = '507f1f77bcf86cd799439011';

      await updateCommunityProfilePicture(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Update Cover Image Controller', () => {
    xit('should update cover image when user is owner', async () => {
      await updateCommunityCoverImage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.community.coverImage).toBe('https://cloudinary.com/test.jpg');
    });

    xit('should process and upload image correctly', async () => {
      await updateCommunityCoverImage(req, res);

      expect(imageProcessor.processImage).toHaveBeenCalled();
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalled();
    });

    xit('should persist cover image URL to database', async () => {
      await updateCommunityCoverImage(req, res);

      const updatedCommunity = await Community.findById(testCommunity._id);
      expect(updatedCommunity.coverImage).toBe('https://cloudinary.com/test.jpg');
    });

    it('should reject update when user is not owner', async () => {
      req.user = nonOwnerUser;

      await updateCommunityCoverImage(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('owner');
    });

    it('should return 400 if no file is uploaded', async () => {
      req.file = undefined;

      await updateCommunityCoverImage(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('image');
    });

    it('should return 400 for invalid community ID', async () => {
      req.params.id = 'invalid-id';

      await updateCommunityCoverImage(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid community ID');
    });

    it('should return 404 if community does not exist', async () => {
      req.params.id = '507f1f77bcf86cd799439011';

      await updateCommunityCoverImage(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });
});
