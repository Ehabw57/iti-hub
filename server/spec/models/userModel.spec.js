const mongoHelper = require("../helpers/DBUtils");
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
;
describe("User model", () => {
  
  const plain = "mypassword";
  const user = {
    username: "testuser",
    fullName: "Test User",
    email: "test@example.com",
    password: plain,
  };
  let fresh = null;
  
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
    await mongoHelper.connectToDB();
  });

  beforeEach(async () => {
    fresh = new User(user);
    await fresh.save();
  });
  
  afterEach(async () => {
    await mongoHelper.clearDatabase();
  });

  afterAll(async () => {
    await mongoHelper.disconnectFromDB();
  });

  describe("Password Hashing", () => {
    it("hashes password before save", async () => {
      const fromDb = await User.findOne({ email: user.email }).select('+password');
      expect(fromDb).toBeDefined();
      expect(fromDb.password).not.toBe(plain);

      const match = await bcrypt.compare(plain, fromDb.password);
      expect(match).toBeTrue();
    });
    
    it('should hash password before saving', async () => {
      const newUser = new User({
        email: 'newhash@example.com',
        password: 'Password123',
        username: 'newhashuser',
        fullName: 'New Hash User'
      });
      await newUser.save();
      
      expect(newUser.password).not.toBe('Password123');
      expect(newUser.password).toMatch(/^\$2[ab]\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const testUser = await User.create({
        email: 'norehash@example.com',
        password: 'Password123',
        username: 'norehashuser',
        fullName: 'No Rehash User'
      });
      
      const originalHash = testUser.password;
      testUser.fullName = 'Updated Name';
      await testUser.save();
      
      expect(testUser.password).toBe(originalHash);
    });
  });

  describe("comparePassword", () => {
    it("comparePassword returns true for correct password and false otherwise", async () => {
      const foundUser = await User.findOne({ email: user.email }).select('+password');
      const ok = await foundUser.comparePassword(plain);
      expect(ok).toBeTrue();

      const bad = await foundUser.comparePassword("wrong");
      expect(bad).toBeFalse();
    });
    
    it('should return true for correct password', async () => {
      const testUser = await User.create({
        email: 'correct@example.com',
        password: 'Password123',
        username: 'correctuser',
        fullName: 'Correct User'
      });
      
      const isMatch = await testUser.comparePassword('Password123');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const testUser = await User.create({
        email: 'incorrect@example.com',
        password: 'Password123',
        username: 'incorrectuser',
        fullName: 'Incorrect User'
      });
      
      const isMatch = await testUser.comparePassword('WrongPassword');
      expect(isMatch).toBe(false);
    });
  });

  describe("generateAuthToken", () => {
    it("generateAuthToken returns a JWT containing userId and role", async () => {
      const token = fresh.generateAuthToken();
      expect(token).toBeDefined();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBeDefined();
      expect(decoded.role).toBeDefined();
    });
    
    it('should generate valid JWT token', async () => {
      const testUser = await User.create({
        email: 'jwttest@example.com',
        password: 'Password123',
        username: 'jwttestuser',
        fullName: 'JWT Test User'
      });
      
      const token = testUser.generateAuthToken();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    it('should include 7-day expiration', async () => {
      const testUser = await User.create({
        email: 'expiry@example.com',
        password: 'Password123',
        username: 'expiryuser',
        fullName: 'Expiry User'
      });
      
      const token = testUser.generateAuthToken();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      
      expect(expiresIn).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate reset token and hash it', async () => {
      const testUser = await User.create({
        email: 'reset@example.com',
        password: 'Password123',
        username: 'resetuser',
        fullName: 'Reset User'
      });
      
      const resetToken = await testUser.generatePasswordResetToken();
      
      expect(resetToken).toBeTruthy();
      expect(resetToken.length).toBe(64); // 32 bytes hex string
      expect(testUser.resetPasswordToken).toBeTruthy();
      expect(testUser.resetPasswordToken).not.toBe(resetToken); // Should be hashed
      expect(testUser.resetPasswordExpires).toBeTruthy();
      expect(testUser.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });
});

