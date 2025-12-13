const updateProfile = require('../../../controllers/user/updateProfileController');
const User = require('../../../models/User');
const { connectToDB, clearDatabase, disconnectFromDB } = require('../../helpers/DBUtils');
const responseMock = require('../../helpers/responseMock');
const {
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_SPECIALIZATION_LENGTH,
  MAX_LOCATION_LENGTH
} = require('../../../utils/constants');

describe('updateProfileController', () => {
  let testUser;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    testUser = await User.create({
      username: 'johndoe',
      email: 'john@test.com',
      password: 'password123',
      fullName: 'John Doe',
      bio: 'Software developer',
      specialization: 'Backend',
      location: 'New York'
    });
  });

  describe('PUT /users/profile', () => {
    it('should update fullName successfully', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'John Smith'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.data.fullName).toBe('John Smith');
    });

    it('should update bio successfully', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          bio: 'Full-stack developer specializing in Node.js'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bio).toBe('Full-stack developer specializing in Node.js');
    });

    it('should update multiple fields simultaneously', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'Jane Doe',
          bio: 'Frontend engineer',
          specialization: 'React',
          location: 'San Francisco'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.fullName).toBe('Jane Doe');
      expect(res.body.data.bio).toBe('Frontend engineer');
      expect(res.body.data.specialization).toBe('React');
      expect(res.body.data.location).toBe('San Francisco');
    });

    it('should update profilePicture URL', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          profilePicture: 'https://example.com/profile.jpg'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.profilePicture).toBe('https://example.com/profile.jpg');
    });

    it('should update coverImage URL', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          coverImage: 'https://example.com/cover.jpg'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.coverImage).toBe('https://example.com/cover.jpg');
    });

    it('should trim whitespace from fullName', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: '  John Smith  '
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.fullName).toBe('John Smith');
    });

    it('should set fields to null when provided', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          specialization: null,
          location: null
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.specialization).toBeNull();
      expect(res.body.data.location).toBeNull();
    });

    it('should not include sensitive fields in response', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'John Updated'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.resetPasswordToken).toBeUndefined();
      expect(res.body.data.resetPasswordExpires).toBeUndefined();
      expect(res.body.data.__v).toBeUndefined();
    });
  });

  describe('Validation - Using Constants', () => {
    it(`should reject fullName shorter than ${MIN_FULL_NAME_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'A'.repeat(MIN_FULL_NAME_LENGTH - 1)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toContain(`Full name must be at least ${MIN_FULL_NAME_LENGTH} characters`);
    });

    it(`should reject fullName longer than ${MAX_FULL_NAME_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'A'.repeat(MAX_FULL_NAME_LENGTH + 1)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain(`Full name must not exceed ${MAX_FULL_NAME_LENGTH} characters`);
    });

    it(`should accept fullName at exactly ${MIN_FULL_NAME_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'A'.repeat(MIN_FULL_NAME_LENGTH)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
    });

    it(`should accept fullName at exactly ${MAX_FULL_NAME_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'A'.repeat(MAX_FULL_NAME_LENGTH)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
    });

    it(`should reject bio longer than ${MAX_BIO_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          bio: 'A'.repeat(MAX_BIO_LENGTH + 1)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toContain(`Bio must not exceed ${MAX_BIO_LENGTH} characters`);
    });

    it(`should accept bio at exactly ${MAX_BIO_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          bio: 'A'.repeat(MAX_BIO_LENGTH)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
    });

    it(`should reject specialization longer than ${MAX_SPECIALIZATION_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          specialization: 'A'.repeat(MAX_SPECIALIZATION_LENGTH + 1)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toContain(`Specialization must not exceed ${MAX_SPECIALIZATION_LENGTH} characters`);
    });

    it(`should reject location longer than ${MAX_LOCATION_LENGTH} characters`, async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          location: 'A'.repeat(MAX_LOCATION_LENGTH + 1)
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toContain(`Location must not exceed ${MAX_LOCATION_LENGTH} characters`);
    });

    it('should reject non-string fullName', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 12345
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toContain('Full name must be a string');
    });

    it('should reject non-string bio', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          bio: 12345
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toContain('Bio must be a string');
    });
  });

  describe('Security and Field Restrictions', () => {
    it('should ignore attempts to update email', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          email: 'hacker@test.com',
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe('john@test.com'); // Unchanged
      expect(res.body.data.fullName).toBe('Updated Name'); // Changed
    });

    it('should ignore attempts to update password', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          password: 'newpassword',
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.fullName).toBe('Updated Name');
      // Password should not be in response and should remain unchanged
    });

    it('should ignore attempts to update username', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          username: 'hacker',
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.username).toBe('johndoe'); // Unchanged
    });

    it('should ignore attempts to update role', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          role: 'admin',
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.role).toBe('user'); // Unchanged
    });

    it('should ignore attempts to update followersCount', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          followersCount: 1000,
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.followersCount).toBe(0); // Unchanged
    });

    it('should ignore attempts to update followingCount', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          followingCount: 1000,
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.followingCount).toBe(0); // Unchanged
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 when no fields provided', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {}
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No valid fields provided for update');
    });

    it('should return 400 when only invalid fields provided', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          email: 'newemail@test.com',
          password: 'newpass',
          role: 'admin'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('No valid fields provided for update');
    });

    it('should handle empty string bio', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          bio: ''
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bio).toBe('');
    });

    it('should handle multiple validation errors', async () => {
      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'A', // Too short
          bio: 'A'.repeat(MAX_BIO_LENGTH + 1), // Too long
          specialization: 12345 // Wrong type
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle user not found', async () => {
      const req = {
        user: { _id: '507f1f77bcf86cd799439011' }, // Non-existent ID
        body: {
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle database errors gracefully', async () => {
      spyOn(User, 'findByIdAndUpdate').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      const req = {
        user: { _id: testUser._id },
        body: {
          fullName: 'Updated Name'
        }
      };
      const res = responseMock();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
    });
  });
});
