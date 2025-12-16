/**
 * Tests for Search Communities Controller
 * Epic 9: Search - T106
 */
const searchCommunities = require("../../../controllers/community/searchCommunitiesController");
const Community = require("../../../models/Community");
const CommunityMember = require("../../../models/CommunityMember");

describe("searchCommunities Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      user: null,
    };
    res = {
      status: jasmine.createSpy("status").and.returnValue({
        json: jasmine.createSpy("json"),
      }),
    };
  });

  describe("Query Validation", () => {
    it("should return 400 if search query is missing", async () => {
      req.query = {};

      await searchCommunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Search query is required",
      });
    });

    it("should return 400 if search query is too short", async () => {
      req.query = { q: "a" };

      await searchCommunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    });

    it("should return 400 if search query is empty string", async () => {
      req.query = { q: "  " };

      await searchCommunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Search query is required",
      });
    });
  });

  describe("Search Functionality", () => {
    it("should search communities by name/description sorted by memberCount", async () => {
      req.query = { q: "programming" };

      const mockCommunities = [
        {
          _id: "comm1",
          name: "Programming Hub",
          description: "A place for programmers",
          memberCount: 100,
        },
        {
          _id: "comm2",
          name: "Advanced Programming",
          description: "For experienced programmers",
          memberCount: 50,
        },
      ];

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          sort: jasmine.createSpy("sort").and.returnValue({
            limit: jasmine.createSpy("limit").and.returnValue({
              skip: jasmine.createSpy("skip").and.returnValue(
                Promise.resolve(mockCommunities)
              ),
            }),
          }),
        }),
      };

      spyOn(Community, "find").and.returnValue(mockQuery);
      spyOn(Community, "countDocuments").and.returnValue(Promise.resolve(2));

      await searchCommunities(req, res);

      expect(Community.find).toHaveBeenCalledWith({
        $text: { $search: "programming" },
      });
      expect(mockQuery.select().sort).toHaveBeenCalledWith({ memberCount: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith({
        success: true,
        communities: mockCommunities,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      });
    });

    it("should filter communities by tags", async () => {
      req.query = { q: "tech", tags: "javascript,webdev" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          sort: jasmine.createSpy("sort").and.returnValue({
            limit: jasmine.createSpy("limit").and.returnValue({
              skip: jasmine.createSpy("skip").and.returnValue(
                Promise.resolve([])
              ),
            }),
          }),
        }),
      };

      spyOn(Community, "find").and.returnValue(mockQuery);
      spyOn(Community, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchCommunities(req, res);

      expect(Community.find).toHaveBeenCalledWith({
        $text: { $search: "tech" },
        tags: { $in: ["javascript", "webdev"] },
      });
    });

    it("should add isMember metadata for authenticated users", async () => {
      req.query = { q: "test" };
      req.user = { _id: "currentUser" };

      const mockCommunities = [
        {
          _id: "comm1",
          name: "Test Community",
          description: "A test community",
          memberCount: 10,
          toObject: function () {
            return {
              _id: this._id,
              name: this.name,
              description: this.description,
              memberCount: this.memberCount,
            };
          },
        },
      ];

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          sort: jasmine.createSpy("sort").and.returnValue({
            limit: jasmine.createSpy("limit").and.returnValue({
              skip: jasmine.createSpy("skip").and.returnValue(
                Promise.resolve(mockCommunities)
              ),
            }),
          }),
        }),
      };

      spyOn(Community, "find").and.returnValue(mockQuery);
      spyOn(Community, "countDocuments").and.returnValue(Promise.resolve(1));
      spyOn(CommunityMember, "findOne").and.returnValue(
        Promise.resolve({ _id: "member1", role: "member" })
      );

      await searchCommunities(req, res);

      expect(CommunityMember.findOne).toHaveBeenCalledWith({
        community: "comm1",
        user: "currentUser",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = res.status().json.calls.mostRecent().args[0];
      expect(responseData.communities[0].isMember).toBe(true);
    });

    it("should return empty results when no communities match", async () => {
      req.query = { q: "nonexistent" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          sort: jasmine.createSpy("sort").and.returnValue({
            limit: jasmine.createSpy("limit").and.returnValue({
              skip: jasmine.createSpy("skip").and.returnValue(
                Promise.resolve([])
              ),
            }),
          }),
        }),
      };

      spyOn(Community, "find").and.returnValue(mockQuery);
      spyOn(Community, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchCommunities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith({
        success: true,
        communities: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      });
    });
  });

  describe("Pagination", () => {
    it("should handle pagination correctly", async () => {
      req.query = { q: "tech", page: "2", limit: "10" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          sort: jasmine.createSpy("sort").and.returnValue({
            limit: jasmine.createSpy("limit").and.returnValue({
              skip: jasmine.createSpy("skip").and.returnValue(
                Promise.resolve([])
              ),
            }),
          }),
        }),
      };

      spyOn(Community, "find").and.returnValue(mockQuery);
      spyOn(Community, "countDocuments").and.returnValue(Promise.resolve(25));

      await searchCommunities(req, res);

      expect(mockQuery.select().sort().limit).toHaveBeenCalledWith(10);
      expect(mockQuery.select().sort().limit().skip).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith({
        success: true,
        communities: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          pages: 3,
        },
      });
    });

    it("should enforce maximum limit", async () => {
      req.query = { q: "test", limit: "100" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          sort: jasmine.createSpy("sort").and.returnValue({
            limit: jasmine.createSpy("limit").and.returnValue({
              skip: jasmine.createSpy("skip").and.returnValue(
                Promise.resolve([])
              ),
            }),
          }),
        }),
      };

      spyOn(Community, "find").and.returnValue(mockQuery);
      spyOn(Community, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchCommunities(req, res);

      expect(mockQuery.select().sort().limit).toHaveBeenCalledWith(50);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 if database error occurs", async () => {
      req.query = { q: "test" };

      spyOn(Community, "find").and.returnValue({
        select: jasmine.createSpy("select").and.returnValue({
          sort: jasmine.createSpy("sort").and.returnValue({
            limit: jasmine.createSpy("limit").and.returnValue({
              skip: jasmine.createSpy("skip").and.returnValue(
                Promise.reject(new Error("Database error"))
              ),
            }),
          }),
        }),
      });

      await searchCommunities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Error searching communities",
        error: "Database error",
      });
    });
  });
});
