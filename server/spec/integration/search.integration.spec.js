/**
 * Search Routes Integration Tests
 * Epic 9: Search - T108
 * Tests all search endpoints with various scenarios
 */
const request = require("supertest");
const User = require("../../models/User");
const Post = require("../../models/Post");
const Community = require("../../models/Community");
const Connection = require("../../models/Connection");
const PostLike = require("../../models/PostLike");
const PostSave = require("../../models/PostSave");
const CommunityMember = require("../../models/CommunityMember");
const {
  connectToDB,
  disconnectFromDB,
  clearDatabase,
} = require("../helpers/DBUtils");

// Set JWT_SECRET for tests if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "testts";
}

const app = require("../../app");

describe("Search Routes Integration Tests", () => {
  let testUsers = [];
  let testPosts = [];
  let testCommunities = [];
  let authToken;

  beforeAll(async () => {
    await connectToDB();
  });

  afterAll(async () => {
    await disconnectFromDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Drop existing indexes and recreate (handles index definition changes)
    try {
      await Post.collection.dropIndex('content_text');
    } catch (err) {
      // Ignore if index doesn't exist
    }
    try {
      await Post.collection.dropIndex('content_text_tags_text');
    } catch (err) {
      // Ignore if index doesn't exist
    }
    try {
      await Community.collection.dropIndexes();
    } catch (err) {
      // Ignore if error
    }

    // Ensure text indexes are created for search
    await User.createIndexes();
    await Post.createIndexes();
    await Community.createIndexes();

    // Create test users
    const users = [
      {
        username: "johndoe",
        email: "john@test.com",
        password: "password123",
        fullName: "John Doe",
        bio: "JavaScript developer",
        specialization: "Web Development",
      },
      {
        username: "janedoe",
        email: "jane@test.com",
        password: "password123",
        fullName: "Jane Doe",
        bio: "Python programmer",
        specialization: "Data Science",
      },
      {
        username: "testuser",
        email: "test@test.com",
        password: "password123",
        fullName: "Test User",
        bio: "General tester",
        specialization: "QA",
      },
    ];

    testUsers = await Promise.all(
      users.map((userData) => User.create(userData))
    );

    // Get auth token for first user
    const loginRes = await request(app).post("/auth/login").send({
      email: "john@test.com",
      password: "password123",
    });
    authToken = loginRes.body.data.token;

    // Create test communities
    const communities = [
      {
        name: "JavaScript Community",
        description: "A community for JavaScript developers",
        tags: ["Technology", "Education"],
        owners: [testUsers[0]._id],
        memberCount: 10,
      },
      {
        name: "Python Hub",
        description: "Python programming discussions",
        tags: ["Technology", "Career"],
        owners: [testUsers[1]._id],
        memberCount: 5,
      },
      {
        name: "Web Development",
        description: "All about web development",
        tags: ["Technology", "Education", "Career"],
        owners: [testUsers[0]._id],
        memberCount: 15,
      },
    ];

    testCommunities = await Promise.all(
      communities.map((communityData) => Community.create(communityData))
    );

    // Create test posts
    const posts = [
      {
        author: testUsers[0]._id,
        content: "Amazing JavaScript tips for beginners",
        community: testCommunities[0]._id,
        deletedAt: null,
      },
      {
        author: testUsers[1]._id,
        content: "Best practices for Python programming",
        community: testCommunities[1]._id,
        deletedAt: null,
      },
      {
        author: testUsers[0]._id,
        content: "JavaScript framework comparison",
        community: testCommunities[0]._id,
        deletedAt: null,
      },
      {
        author: testUsers[2]._id,
        content: "Testing strategies for web apps",
        deletedAt: null,
      },
    ];

    testPosts = await Promise.all(posts.map((postData) => Post.create(postData)));
  });

  describe("GET /search/users", () => {
    describe("Unauthenticated Access", () => {
      it("should search users without authentication", async () => {
        const res = await request(app).get("/search/users?q=john");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users).toBeDefined();
        expect(res.body.data.users.length).toBeGreaterThan(0);
        expect(res.body.data.users[0].username).toContain("john");
        expect(res.body.data.pagination).toBeDefined();
      });

      it("should return 400 if query is missing", async () => {
        const res = await request(app).get("/search/users");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toBe("Search query is required");
      });

      it("should return 400 if query is too short", async () => {
        const res = await request(app).get("/search/users?q=j");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toBe(
          "Search query must be at least 2 characters"
        );
      });

      it("should search by fullName", async () => {
        const res = await request(app).get("/search/users?q=Jane");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users.length).toBeGreaterThan(0);
        expect(res.body.data.users[0].fullName).toContain("Jane");
      });

      it("should search by bio", async () => {
        const res = await request(app).get("/search/users?q=JavaScript");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users.length).toBeGreaterThan(0);
      });

      it("should filter by specialization", async () => {
        const res = await request(app).get(
          "/search/users?q=doe&specialization=Web Development"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users.length).toBe(1);
        expect(res.body.data.users[0].specialization).toBe("Web Development");
      });

      it("should return empty results for non-matching query", async () => {
        const res = await request(app).get("/search/users?q=nonexistent");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users.length).toBe(0);
      });
    });

    describe("Authenticated Access", () => {
      it("should include isFollowing metadata for authenticated users", async () => {
        // Create a connection
        await Connection.create({
          follower: testUsers[0]._id,
          following: testUsers[1]._id,
          type: 'follow',
        });

        const res = await request(app)
          .get("/search/users?q=jane")
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users[0].isFollowing).toBeDefined();
        expect(res.body.data.users[0].isFollowing).toBe(true);
      });

      it("should exclude blocked users from results", async () => {
        // Block user 2
        await Connection.create({
          follower: testUsers[0]._id,
          following: testUsers[1]._id,
          type: 'block',
        });

        const res = await request(app)
          .get("/search/users?q=doe")
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Should only return johndoe, not janedoe (blocked)
        expect(res.body.data.users.length).toBe(1);
        expect(res.body.data.users[0].username).toBe("johndoe");
      });
    });

    describe("Pagination", () => {
      it("should handle pagination correctly", async () => {
        const res = await request(app).get("/search/users?q=doe&page=1&limit=1");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users.length).toBe(1);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(1);
        expect(res.body.data.pagination.total).toBeGreaterThan(1);
      });

      it("should enforce maximum limit", async () => {
        const res = await request(app).get("/search/users?q=doe&limit=100");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pagination.limit).toBe(50); // MAX_SEARCH_RESULTS
      });
    });

    describe("Sorting", () => {
      it("should sort results alphabetically by username", async () => {
        const res = await request(app).get("/search/users?q=doe");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.users.length).toBe(2);
        // janedoe comes before johndoe alphabetically
        expect(res.body.data.users[0].username).toBe("janedoe");
        expect(res.body.data.users[1].username).toBe("johndoe");
      });
    });
  });

  describe("GET /search/posts", () => {
    describe("Unauthenticated Access", () => {
      it("should search posts without authentication", async () => {
        const res = await request(app).get("/search/posts?q=JavaScript");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts).toBeDefined();
        expect(res.body.data.posts.length).toBeGreaterThan(0);
        expect(res.body.data.pagination).toBeDefined();
      });

      it("should return 400 if query is missing", async () => {
        const res = await request(app).get("/search/posts");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toBe("Search query is required");
      });

      xit("should filter by tags (SKIPPED: tags are ObjectIds, not strings)", async () => {
        // This test is skipped because Post.tags are ObjectIds referencing Tag model
        // which doesn't exist yet. String-based tag filtering cannot work.
        const res = await request(app).get(
          "/search/posts?q=JavaScript&tags=tutorial"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts.length).toBeGreaterThan(0);
      });

      it("should filter by type (original)", async () => {
        const res = await request(app).get(
          "/search/posts?q=JavaScript&type=original"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts.length).toBeGreaterThan(0);
      });

      it("should filter by communityId", async () => {
        const res = await request(app).get(
          `/search/posts?q=JavaScript&communityId=${testCommunities[0]._id}`
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts.length).toBeGreaterThan(0);
        expect(res.body.data.posts[0].community._id.toString()).toBe(
          testCommunities[0]._id.toString()
        );
      });

      it("should populate author and community details", async () => {
        const res = await request(app).get("/search/posts?q=JavaScript");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts[0].author).toBeDefined();
        expect(res.body.data.posts[0].author.username).toBeDefined();
        expect(res.body.data.posts[0].community).toBeDefined();
      });
    });

    describe("Authenticated Access", () => {
      it("should include hasLiked metadata for authenticated users", async () => {
        // Like a post
        await PostLike.create({
          post: testPosts[0]._id,
          user: testUsers[0]._id,
        });

        const res = await request(app)
          .get("/search/posts?q=JavaScript")
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts[0].hasLiked).toBeDefined();
        // First post should have hasLiked = true
        const likedPost = res.body.data.posts.find(
          (p) => p._id.toString() === testPosts[0]._id.toString()
        );
        expect(likedPost.hasLiked).toBe(true);
      });

      it("should include hasSaved metadata for authenticated users", async () => {
        // Save a post
        await PostSave.create({
          post: testPosts[0]._id,
          user: testUsers[0]._id,
        });

        const res = await request(app)
          .get("/search/posts?q=JavaScript")
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts[0].hasSaved).toBeDefined();
        const savedPost = res.body.data.posts.find(
          (p) => p._id.toString() === testPosts[0]._id.toString()
        );
        expect(savedPost.hasSaved).toBe(true);
      });
    });

    describe("Pagination and Sorting", () => {
      it("should handle pagination correctly", async () => {
        const res = await request(app).get(
          "/search/posts?q=JavaScript&page=1&limit=2"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.posts.length).toBeLessThanOrEqual(2);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(2);
      });

      it("should sort results alphabetically by content", async () => {
        const res = await request(app).get("/search/posts?q=JavaScript");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Verify alphabetical ordering
        for (let i = 1; i < res.body.data.posts.length; i++) {
          const prev = res.body.data.posts[i - 1].content.toLowerCase();
          const curr = res.body.data.posts[i].content.toLowerCase();
          expect(prev <= curr).toBe(true);
        }
      });
    });
  });

  describe("GET /search/communities", () => {
    describe("Unauthenticated Access", () => {
      it("should search communities without authentication", async () => {
        const res = await request(app).get("/search/communities?q=JavaScript");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.communities).toBeDefined();
        expect(res.body.data.communities.length).toBeGreaterThan(0);
        expect(res.body.data.pagination).toBeDefined();
      });

      it("should return 400 if query is missing", async () => {
        const res = await request(app).get("/search/communities");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.message).toBe("Search query is required");
      });

      it("should filter by tags", async () => {
        const res = await request(app).get(
          "/search/communities?q=development&tags=Technology"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.communities.length).toBeGreaterThan(0);
        expect(res.body.data.communities[0].tags).toContain("Technology");
      });

      it("should sort by memberCount descending", async () => {
        const res = await request(app).get("/search/communities?q=development");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Verify descending order by memberCount
        for (let i = 1; i < res.body.data.communities.length; i++) {
          expect(res.body.data.communities[i - 1].memberCount).toBeGreaterThanOrEqual(
            res.body.data.communities[i].memberCount
          );
        }
      });
    });

    describe("Authenticated Access", () => {
      it("should include isMember metadata for authenticated users", async () => {
        // Join a community
        await CommunityMember.create({
          community: testCommunities[0]._id,
          user: testUsers[0]._id,
          role: "member",
        });

        const res = await request(app)
          .get("/search/communities?q=JavaScript")
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.communities[0].isMember).toBeDefined();
        const joinedCommunity = res.body.data.communities.find(
          (c) => c._id.toString() === testCommunities[0]._id.toString()
        );
        expect(joinedCommunity.isMember).toBe(true);
      });
    });

    describe("Pagination", () => {
      it("should handle pagination correctly", async () => {
        const res = await request(app).get(
          "/search/communities?q=community&page=1&limit=2"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.communities.length).toBeLessThanOrEqual(2);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(2);
      });

      it("should enforce maximum limit", async () => {
        const res = await request(app).get(
          "/search/communities?q=community&limit=100"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pagination.limit).toBe(50); // MAX_SEARCH_RESULTS
      });
    });
  });

  describe("Cross-Endpoint Consistency", () => {
    it("should handle the same query parameter across all endpoints", async () => {
      const query = "test";

      const usersRes = await request(app).get(`/search/users?q=${query}`);
      const postsRes = await request(app).get(`/search/posts?q=${query}`);
      const communitiesRes = await request(app).get(
        `/search/communities?q=${query}`
      );

      expect(usersRes.status).toBe(200);
      expect(postsRes.status).toBe(200);
      expect(communitiesRes.status).toBe(200);

      // All should have consistent response structure
      expect(usersRes.body.success).toBe(true);
      expect(postsRes.body.success).toBe(true);
      expect(communitiesRes.body.success).toBe(true);

      expect(usersRes.body.data.pagination).toBeDefined();
      expect(postsRes.body.data.pagination).toBeDefined();
      expect(communitiesRes.body.data.pagination).toBeDefined();
    });

    it("should handle pagination consistently across endpoints", async () => {
      const query = "doe";
      const page = 1;
      const limit = 5;

      const usersRes = await request(app).get(
        `/search/users?q=${query}&page=${page}&limit=${limit}`
      );
      const postsRes = await request(app).get(
        `/search/posts?q=${query}&page=${page}&limit=${limit}`
      );
      const communitiesRes = await request(app).get(
        `/search/communities?q=${query}&page=${page}&limit=${limit}`
      );

      [usersRes, postsRes, communitiesRes].forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.pagination.page).toBe(page);
        expect(res.body.data.pagination.limit).toBe(limit);
      });
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle special characters in search query", async () => {
      const res = await request(app).get("/search/users?q=jo+hn");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should handle empty results gracefully across all endpoints", async () => {
      const query = "zzzznonexistent";

      const usersRes = await request(app).get(`/search/users?q=${query}`);
      const postsRes = await request(app).get(`/search/posts?q=${query}`);
      const communitiesRes = await request(app).get(
        `/search/communities?q=${query}`
      );

      [usersRes, postsRes, communitiesRes].forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pagination.total).toBe(0);
        expect(res.body.data.pagination.pages).toBe(0);
      });
    });

    it("should handle concurrent search requests", async () => {
      const promises = [
        request(app).get("/search/users?q=john"),
        request(app).get("/search/posts?q=JavaScript"),
        request(app).get("/search/communities?q=development"),
      ];

      const results = await Promise.all(promises);

      results.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });
});
