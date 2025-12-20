/**
 * Epic 10: Admin Management Integration Tests
 * 
 * Tests all admin endpoints for:
 * - Branches, Rounds, Tracks, Tags
 * - Editor role assignment
 * - User verification and graduation
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { connectToDB, disconnectFromDB } = require("../helpers/DBUtils");
const User = require("../../models/User");
const Branch = require("../../models/Branch");
const Round = require("../../models/Round");
const Track = require("../../models/Track");
const Tag = require("../../models/Tag");
const UserEnrollment = require("../../models/UserEnrollment");

// Set JWT_SECRET for tests if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret";
}

const app = require("../../app");

describe("Epic 10: Admin Management Integration Tests", () => {
  let adminUser, regularUser, adminToken, userToken;
  let testBranch, testRound, testTrack, testTag, testEnrollment;

  // Helper to generate JWT token
  const generateTestToken = (user) => {
    const jwt = require("jsonwebtoken");
    return jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  };

  beforeAll(async () => {
    // Connect to test database
    await connectToDB();

    // Cleanup any leftover test data from previous runs
    await UserEnrollment.deleteMany({ });
    await Track.deleteMany({ name: { $regex: /^Epic10 Test/ } });
    await Round.deleteMany({ name: { $regex: /^Epic10 Test/ } });
    await Branch.deleteMany({ name: { $regex: /^Epic10 Test/ } });
    await Tag.deleteMany({ name: { $regex: /^epic10-test/ } });
    await User.deleteMany({ email: { $regex: /_epic10_int@test\.com$/ } });

    // Create admin user
    adminUser = await User.create({
      username: "admin_epic10_int",
      email: "admin_epic10_int@test.com",
      password: "AdminPass123!",
      fullName: "Admin Integration",
      role: "admin",
    });
    adminToken = generateTestToken(adminUser);

    // Create regular user
    regularUser = await User.create({
      username: "user_epic10_int",
      email: "user_epic10_int@test.com",
      password: "UserPass123!",
      fullName: "User Integration",
      role: "user",
    });
    userToken = generateTestToken(regularUser);
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    await UserEnrollment.deleteMany({ });
    await Track.deleteMany({ name: { $regex: /^Epic10 Test/ } });
    await Round.deleteMany({ name: { $regex: /^Epic10 Test/ } });
    await Branch.deleteMany({ name: { $regex: /^Epic10 Test/ } });
    await Tag.deleteMany({ name: { $regex: /^epic10-test/ } });
    await User.deleteMany({ email: { $regex: /_epic10_int@test\.com$/ } });
    
    // Disconnect from test database
    await disconnectFromDB();
  });

  // ============================================
  // BRANCH ENDPOINTS
  // ============================================
  describe("Branch Management (/admin/branches)", () => {
    describe("POST /admin/branches - Create Branch", () => {
      it("should create a branch when admin", async () => {
        const res = await request(app)
          .post("/admin/branches")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "Epic10 Test Branch", description: "Test branch" });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe("Epic10 Test Branch");
        expect(res.body.data.isDisabled).toBe(false);
        testBranch = res.body.data;
      });

      it("should reject duplicate branch name (409)", async () => {
        const res = await request(app)
          .post("/admin/branches")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "Epic10 Test Branch" });

        expect(res.status).toBe(409);
      });

      it("should reject missing name (400)", async () => {
        const res = await request(app)
          .post("/admin/branches")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ description: "No name" });

        expect(res.status).toBe(400);
      });

      it("should reject non-admin users (403)", async () => {
        const res = await request(app)
          .post("/admin/branches")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ name: "Unauthorized Branch" });

        expect(res.status).toBe(403);
      });

      it("should reject unauthenticated requests (401)", async () => {
        const res = await request(app)
          .post("/admin/branches")
          .send({ name: "No Auth Branch" });

        expect(res.status).toBe(401);
      });
    });

    describe("PATCH /admin/branches/:branchId - Update Branch", () => {
      it("should update branch fields", async () => {
        const res = await request(app)
          .patch(`/admin/branches/${testBranch._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ description: "Updated description" });

        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe("Updated description");
      });

      it("should return 404 for non-existent branch", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .patch(`/admin/branches/${fakeId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ description: "Update" });

        expect(res.status).toBe(404);
      });
    });

    describe("POST /admin/branches/:branchId/disable - Disable Branch", () => {
      it("should disable a branch", async () => {
        const res = await request(app)
          .post(`/admin/branches/${testBranch._id}/disable`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.isDisabled).toBe(true);
      });

      it("should return 409 if already disabled", async () => {
        const res = await request(app)
          .post(`/admin/branches/${testBranch._id}/disable`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(409);
      });
    });

    describe("GET /admin/branches - List All Branches (Admin)", () => {
      it("should list all branches including disabled", async () => {
        const res = await request(app)
          .get("/admin/branches")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe("GET /branches - Public List (Enabled Only)", () => {
      it("should list only enabled branches", async () => {
        const res = await request(app).get("/branches");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        // All returned branches should be enabled
        res.body.data.forEach((branch) => {
          expect(branch.isDisabled).toBe(false);
        });
      });
    });
  });

  // ============================================
  // ROUND ENDPOINTS
  // ============================================
  describe("Round Management (/admin/rounds)", () => {
    beforeAll(async () => {
      // Re-enable branch for round tests
      await Branch.findByIdAndUpdate(testBranch._id, { isDisabled: false });
    });

    describe("POST /admin/branches/:branchId/rounds - Create Round", () => {
      it("should create a round in draft status", async () => {
        const res = await request(app)
          .post(`/admin/branches/${testBranch._id}/rounds`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            number: 100,
            name: "Epic10 Test Round",
            startDate: "2025-01-01",
            endDate: "2025-06-30",
            status: "draft",
          });

        expect(res.status).toBe(201);
        expect(res.body.data.number).toBe(100);
        expect(res.body.data.status).toBe("draft");
        testRound = res.body.data;
      });

      it("should reject duplicate round number in same branch (409)", async () => {
        const res = await request(app)
          .post(`/admin/branches/${testBranch._id}/rounds`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ number: 100, name: "Duplicate Number" });

        expect(res.status).toBe(409);
      });

      it("should reject missing number (400)", async () => {
        const res = await request(app)
          .post(`/admin/branches/${testBranch._id}/rounds`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "No Number" });

        expect(res.status).toBe(400);
      });
    });

    describe("PATCH /admin/rounds/:roundId - Update Round", () => {
      it("should update round name and dates", async () => {
        const res = await request(app)
          .patch(`/admin/rounds/${testRound._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "Epic10 Test Round Updated" });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe("Epic10 Test Round Updated");
      });
    });

    describe("POST /admin/rounds/:roundId/start - Start Round", () => {
      it("should set round status to active", async () => {
        const res = await request(app)
          .post(`/admin/rounds/${testRound._id}/start`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("active");
      });

      it("should return 409 if trying to start another round (single active)", async () => {
        // Create another round
        const round2 = await Round.create({
          branchId: testBranch._id,
          number: 101,
          name: "Epic10 Test Round 2",
          status: "draft",
        });

        const res = await request(app)
          .post(`/admin/rounds/${round2._id}/start`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(409);

        // Cleanup
        await Round.findByIdAndDelete(round2._id);
      });
    });

    describe("POST /admin/rounds/:roundId/end - End Round", () => {
      it("should set round status to ended", async () => {
        const res = await request(app)
          .post(`/admin/rounds/${testRound._id}/end`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("ended");
      });
    });

    describe("GET /rounds?branchId - Public List (Active + Ended Only)", () => {
      it("should list only active and ended rounds", async () => {
        const res = await request(app)
          .get(`/rounds?branchId=${testBranch._id}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        res.body.data.forEach((round) => {
          expect(["active", "ended"]).toContain(round.status);
        });
      });

      it("should require branchId parameter", async () => {
        const res = await request(app).get("/rounds");
        expect(res.status).toBe(400);
      });
    });
  });

  // ============================================
  // TRACK ENDPOINTS
  // ============================================
  describe("Track Management (/admin/tracks)", () => {
    beforeAll(async () => {
      // Re-activate round for track tests
      await Round.findByIdAndUpdate(testRound._id, { status: "active" });
    });

    describe("POST /admin/rounds/:roundId/tracks - Create Track", () => {
      it("should create a track in a round", async () => {
        const res = await request(app)
          .post(`/admin/rounds/${testRound._id}/tracks`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "Epic10 Test Track", description: "Test track" });

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe("Epic10 Test Track");
        expect(res.body.data.roundId).toBe(testRound._id);
        testTrack = res.body.data;
      });

      it("should reject duplicate track name in same round (409)", async () => {
        const res = await request(app)
          .post(`/admin/rounds/${testRound._id}/tracks`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "Epic10 Test Track" }); // Same name

        expect(res.status).toBe(409);
      });

      it("should allow same track name in different round", async () => {
        const round2 = await Round.create({
          branchId: testBranch._id,
          number: 102,
          name: "Epic10 Test Round Other",
          status: "draft",
        });

        const res = await request(app)
          .post(`/admin/rounds/${round2._id}/tracks`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "Epic10 Test Track" }); // Same name, different round

        expect(res.status).toBe(201);

        // Cleanup
        await Track.deleteOne({ roundId: round2._id });
        await Round.findByIdAndDelete(round2._id);
      });
    });

    describe("PATCH /admin/tracks/:trackId - Update Track", () => {
      it("should update track description", async () => {
        const res = await request(app)
          .patch(`/admin/tracks/${testTrack._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ description: "Updated track description" });

        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe("Updated track description");
      });
    });

    describe("POST /admin/tracks/:trackId/disable - Disable Track", () => {
      it("should disable a track", async () => {
        const res = await request(app)
          .post(`/admin/tracks/${testTrack._id}/disable`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.isDisabled).toBe(true);
      });
    });

    describe("GET /tracks?roundId - Public List (Enabled Only)", () => {
      it("should list only enabled tracks", async () => {
        // Re-enable track
        await Track.findByIdAndUpdate(testTrack._id, { isDisabled: false });

        const res = await request(app)
          .get(`/tracks?roundId=${testRound._id}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        res.body.data.forEach((track) => {
          expect(track.isDisabled).toBe(false);
        });
      });
    });
  });

  // ============================================
  // TAG ENDPOINTS
  // ============================================
  describe("Tag Management (/admin/tags)", () => {
    describe("POST /admin/tags - Create Tag", () => {
      it("should create a tag", async () => {
        const res = await request(app)
          .post("/admin/tags")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "epic10-test-tag", description: "Test tag" });

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe("epic10-test-tag");
        testTag = res.body.data;
      });

      it("should reject duplicate tag name (409)", async () => {
        const res = await request(app)
          .post("/admin/tags")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "epic10-test-tag" });

        expect(res.status).toBe(409);
      });
    });

    describe("PATCH /admin/tags/:tagId - Update Tag", () => {
      it("should update tag description", async () => {
        const res = await request(app)
          .patch(`/admin/tags/${testTag._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ description: "Updated tag" });

        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe("Updated tag");
      });
    });

    describe("POST /admin/tags/:tagId/disable - Disable Tag", () => {
      it("should disable a tag", async () => {
        const res = await request(app)
          .post(`/admin/tags/${testTag._id}/disable`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.isDisabled).toBe(true);
      });
    });
  });

  // ============================================
  // EDITOR ROLE ENDPOINTS
  // ============================================
  describe("Editor Role Management (/admin/editors)", () => {
    describe("POST /admin/editors - Assign Editor Role", () => {
      it("should assign editor role to user", async () => {
        const res = await request(app)
          .post("/admin/editors")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ userId: regularUser._id });

        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe("editor");
      });

      it("should be idempotent (already editor)", async () => {
        const res = await request(app)
          .post("/admin/editors")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ userId: regularUser._id });

        expect(res.status).toBe(200);
      });

      it("should reject assigning to admin", async () => {
        const res = await request(app)
          .post("/admin/editors")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ userId: adminUser._id });

        expect(res.status).toBe(400);
      });
    });

    describe("DELETE /admin/editors/:userId - Remove Editor Role", () => {
      it("should remove editor role from user", async () => {
        const res = await request(app)
          .delete(`/admin/editors/${regularUser._id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe("user");
      });
    });
  });

  // ============================================
  // VERIFICATION & ENROLLMENT ENDPOINTS
  // ============================================
  describe("User Verification & Enrollment", () => {
    beforeAll(async () => {
      // Re-enable track
      await Track.findByIdAndUpdate(testTrack._id, { isDisabled: false });
    });

    describe("POST /admin/users/:userId/verify - Verify User", () => {
      it("should verify user and create enrollment", async () => {
        const res = await request(app)
          .post(`/admin/users/${regularUser._id}/verify`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            branchId: testBranch._id,
            roundId: testRound._id,
            trackId: testTrack._id,
          });

        expect(res.status).toBe(201);
        expect(res.body.data.user.verificationStatus).toBe(true);
        expect(res.body.data.enrollment).toBeDefined();
        testEnrollment = res.body.data.enrollment;
      });

      it("should be idempotent for same enrollment", async () => {
        const res = await request(app)
          .post(`/admin/users/${regularUser._id}/verify`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            branchId: testBranch._id,
            roundId: testRound._id,
            trackId: testTrack._id,
          });

        expect(res.status).toBe(200);
      });

      it("should reject if track does not belong to round", async () => {
        const otherRound = await Round.create({
          branchId: testBranch._id,
          number: 200,
          name: "Other Round",
          status: "draft",
        });

        const res = await request(app)
          .post(`/admin/users/${regularUser._id}/verify`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            branchId: testBranch._id,
            roundId: otherRound._id,
            trackId: testTrack._id, // Belongs to testRound, not otherRound
          });

        expect(res.status).toBe(400);

        await Round.findByIdAndDelete(otherRound._id);
      });
    });

    describe("POST /admin/enrollments/:enrollmentId/graduate - Graduate User", () => {
      it("should mark enrollment as graduated", async () => {
        const res = await request(app)
          .post(`/admin/enrollments/${testEnrollment._id}/graduate`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ graduated: true });

        expect(res.status).toBe(200);
        expect(res.body.data.graduated).toBe(true);
      });

      it("should mark enrollment as not graduated", async () => {
        const res = await request(app)
          .post(`/admin/enrollments/${testEnrollment._id}/graduate`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ graduated: false });

        expect(res.status).toBe(200);
        expect(res.body.data.graduated).toBe(false);
      });

      it("should be idempotent", async () => {
        const res = await request(app)
          .post(`/admin/enrollments/${testEnrollment._id}/graduate`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ graduated: false });

        expect(res.status).toBe(200);
      });

      it("should return 404 for non-existent enrollment", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .post(`/admin/enrollments/${fakeId}/graduate`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ graduated: true });

        expect(res.status).toBe(404);
      });
    });

    describe("DELETE /admin/users/:userId/verify - Reject Verification", () => {
      it("should reject verification and set status to false", async () => {
        const res = await request(app)
          .delete(`/admin/users/${regularUser._id}/verify`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.verificationStatus).toBe(false);
        // Verify the user was updated in DB
        const updatedUser = await User.findById(regularUser._id);
        expect(updatedUser.verificationStatus).toBe(false);
        expect(updatedUser.branchId).toBeNull();
        expect(updatedUser.roundId).toBeNull();
        expect(updatedUser.trackId).toBeNull();
      });
    });
  });

  // ============================================
  // ADMIN USERS LIST
  // ============================================
  describe("Admin Users List (/admin/users)", () => {
    describe("GET /admin/users - List Users with Verification Filter", () => {
      it("should list users", async () => {
        const res = await request(app)
          .get("/admin/users")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it("should filter by verificationStatus", async () => {
        const res = await request(app)
          .get("/admin/users?verificationStatus=false")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        res.body.data.forEach((user) => {
          expect(user.verificationStatus).toBe(false);
        });
      });
    });
  });
});
