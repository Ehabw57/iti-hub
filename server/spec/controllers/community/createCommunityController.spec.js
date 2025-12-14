const createCommunity = require('../../../controllers/community/createCommunityController');
const Community = require('../../../models/Community');
const CommunityMember = require('../../../models/CommunityMember');
const User = require('../../../models/User');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const cloudinary = require('../../../utils/cloudinary');
const imageProcessor = require('../../../utils/imageProcessor');
const { COMMUNITY_TAGS, MIN_COMMUNITY_TAGS, MAX_COMMUNITY_TAGS } = require('../../../utils/constants');

describe('createCommunityController', () => {
  let testUser;

  beforeAll(async () => {
    await connectToDB();
    
    // Spy on cloudinary and image processor
    spyOn(imageProcessor, 'processImage');
    spyOn(cloudinary, 'uploadToCloudinary');
    spyOn(cloudinary, 'deleteFromCloudinary');
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    testUser = await User.create({
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Reset spies
    imageProcessor.processImage.calls.reset();
    cloudinary.uploadToCloudinary.calls.reset();
    cloudinary.deleteFromCloudinary.calls.reset();
  });

  describe('POST /communities', () => {
    it('should create a community with valid data', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology', 'Education']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.community).toBeDefined();
      expect(res.body.data.community.name).toBe('Tech Community');
      expect(res.body.data.community.description).toBe('A community for tech enthusiasts');
      expect(res.body.data.community.tags).toEqual(['Technology', 'Education']);
    });

    it('should set creator as owner and moderator', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      const community = res.body.data.community;
      expect(community.owners).toContain(testUser._id.toString());
      expect(community.moderators).toContain(testUser._id.toString());
    });

    it('should create membership for creator', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      const communityId = res.body.data.community._id;
      
      const membership = await CommunityMember.findOne({
        user: testUser._id,
        community: communityId
      });
      
      expect(membership).toBeDefined();
      expect(membership.role).toBe('owner');
    });

    it('should require name field', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('name');
    });

    it('should require description field', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          tags: ['Technology']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('description');
    });

    it('should require tags field', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts'
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tags');
    });

    it('should require at least 1 tag', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: []
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/tags/i);
    });

    it('should accept maximum 3 tags', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology', 'Education', 'Science']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.community.tags.length).toBe(3);
    });

    it('should reject more than 3 tags', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology', 'Education', 'Science', 'Arts']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid tags', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['InvalidTag']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/tag/i);
    });

    it('should enforce unique community names', async () => {
      await Community.create({
        name: 'Tech Community',
        description: 'First community',
        tags: ['Technology'],
        owners: [testUser._id],
        moderators: [testUser._id]
      });

      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'Second community',
          tags: ['Education']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists|unique/i);
    });

    it('should upload and process profile picture if provided', async () => {
      imageProcessor.processImage.and.returnValue(Promise.resolve(Buffer.from('processed-image')));
      cloudinary.uploadToCloudinary.and.returnValue(Promise.resolve({
        secure_url: 'https://cloudinary.com/profile.jpg',
        public_id: 'profile-123'
      }));

      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        },
        files: {
          profilePicture: [{
            buffer: Buffer.from('image-data'),
            mimetype: 'image/jpeg',
            originalname: 'profile.jpg'
          }]
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(imageProcessor.processImage).toHaveBeenCalled();
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalled();
      expect(res.body.data.community.profilePicture).toBe('https://cloudinary.com/profile.jpg');
    });

    it('should upload and process cover image if provided', async () => {
      imageProcessor.processImage.and.returnValue(Promise.resolve(Buffer.from('processed-image')));
      cloudinary.uploadToCloudinary.and.returnValue(Promise.resolve({
        secure_url: 'https://cloudinary.com/cover.jpg',
        public_id: 'cover-123'
      }));

      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        },
        files: {
          coverImage: [{
            buffer: Buffer.from('image-data'),
            mimetype: 'image/jpeg',
            originalname: 'cover.jpg'
          }]
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(imageProcessor.processImage).toHaveBeenCalled();
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalled();
      expect(res.body.data.community.coverImage).toBe('https://cloudinary.com/cover.jpg');
    });

    it('should upload both profile and cover images if provided', async () => {
      imageProcessor.processImage.and.returnValue(Promise.resolve(Buffer.from('processed-image')));
      cloudinary.uploadToCloudinary
        .and.returnValues(
          Promise.resolve({
            secure_url: 'https://cloudinary.com/profile.jpg',
            public_id: 'profile-123'
          }),
          Promise.resolve({
            secure_url: 'https://cloudinary.com/cover.jpg',
            public_id: 'cover-123'
          })
        );

      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        },
        files: {
          profilePicture: [{
            buffer: Buffer.from('profile-data'),
            mimetype: 'image/jpeg',
            originalname: 'profile.jpg'
          }],
          coverImage: [{
            buffer: Buffer.from('cover-data'),
            mimetype: 'image/jpeg',
            originalname: 'cover.jpg'
          }]
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(imageProcessor.processImage).toHaveBeenCalledTimes(2);
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalledTimes(2);
      expect(res.body.data.community.profilePicture).toBe('https://cloudinary.com/profile.jpg');
      expect(res.body.data.community.coverImage).toBe('https://cloudinary.com/cover.jpg');
    });

    it('should handle image upload errors gracefully', async () => {
      imageProcessor.processImage.and.returnValue(Promise.reject(new Error('Image processing failed')));

      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        },
        files: {
          profilePicture: [{
            buffer: Buffer.from('image-data'),
            mimetype: 'image/jpeg',
            originalname: 'profile.jpg'
          }]
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should create community without images', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: ['Technology']
        },
        files: {}
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.community.profilePicture).toBeNull();
      expect(res.body.data.community.coverImage).toBeNull();
    });

    it('should trim whitespace from name and description', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: '  Tech Community  ',
          description: '  A community for tech enthusiasts  ',
          tags: ['Technology']
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.community.name).toBe('Tech Community');
      expect(res.body.data.community.description).toBe('A community for tech enthusiasts');
    });

    it('should parse tags from JSON string', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          name: 'Tech Community',
          description: 'A community for tech enthusiasts',
          tags: JSON.stringify(['Technology', 'Education'])
        }
      };
      const res = responseMock();

      await createCommunity(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.community.tags).toEqual(['Technology', 'Education']);
    });
  });
});
