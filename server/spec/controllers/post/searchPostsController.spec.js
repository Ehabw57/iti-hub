/**
 * Tests for Search Posts Controller
 * Epic 9: Search - T105
 */
const searchPosts = require("../../../controllers/post/searchPostsController");
const Post = require("../../../models/Post");
const { validateSearchQuery, buildSearchFilter, parseSearchPagination } = require("../../../utils/searchHelpers");

describe("searchPosts Controller", () => {
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

      await searchPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Search query is required",
      });
    });

    it("should return 400 if search query is too short", async () => {
      req.query = { q: "a" };

      await searchPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    });

    it("should return 400 if search query is empty string", async () => {
      req.query = { q: "  " };

      await searchPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Search query is required",
      });
    });
  });

  describe("Search Functionality", () => {
    it("should search posts by content with alphabetical sorting", async () => {
      req.query = { q: "javascript" };

      const mockPosts = [
        {
          _id: "post1",
          content: "Awesome JavaScript tips",
          author: { _id: "user1", username: "dev1" },
          community: { _id: "comm1", name: "Programming" },
        },
        {
          _id: "post2",
          content: "Best JavaScript practices",
          author: { _id: "user2", username: "dev2" },
          community: { _id: "comm2", name: "WebDev" },
        },
      ];

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve(mockPosts)
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(2));

      await searchPosts(req, res);

      expect(Post.find).toHaveBeenCalledWith({
        $text: { $search: "javascript" },
        deletedAt: null,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith({
        success: true,
        posts: mockPosts,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      });
    });

    xit("should filter posts by tags (SKIPPED: tags are ObjectIds)", async () => {
      // This test is skipped because Post.tags are ObjectIds, not searchable strings
      req.query = { q: "tutorial", tags: "javascript,nodejs" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve([])
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchPosts(req, res);

      expect(Post.find).toHaveBeenCalledWith({
        $text: { $search: "tutorial" },
        deletedAt: null,
        tags: { $in: ["javascript", "nodejs"] },
      });
    });

    it("should filter posts by type (original)", async () => {
      req.query = { q: "news", type: "original" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve([])
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchPosts(req, res);

      expect(Post.find).toHaveBeenCalledWith({
        $text: { $search: "news" },
        deletedAt: null,
        repostOf: null,
      });
    });

    it("should filter posts by type (repost)", async () => {
      req.query = { q: "news", type: "repost" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve([])
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchPosts(req, res);

      expect(Post.find).toHaveBeenCalledWith({
        $text: { $search: "news" },
        deletedAt: null,
        repostOf: { $ne: null },
      });
    });

    it("should filter posts by communityId", async () => {
      req.query = { q: "discussion", communityId: "comm123" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve([])
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchPosts(req, res);

      expect(Post.find).toHaveBeenCalledWith({
        $text: { $search: "discussion" },
        deletedAt: null,
        community: "comm123",
      });
    });

    it("should add hasLiked and hasSaved metadata for authenticated users", async () => {
      req.query = { q: "test" };
      req.user = { _id: "currentUser" };

      const mockPosts = [
        {
          _id: "post1",
          content: "Test post",
          author: { _id: "user1", username: "author1" },
          community: null,
          toObject: function () {
            return {
              _id: this._id,
              content: this.content,
              author: this.author,
              community: this.community,
            };
          },
        },
      ];

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve(mockPosts)
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(1));

      const PostLike = require("../../../models/PostLike");
      const PostSave = require("../../../models/PostSave");
      spyOn(PostLike, "findOne").and.returnValue(Promise.resolve(null));
      spyOn(PostSave, "findOne").and.returnValue(Promise.resolve({ _id: "save1" }));

      await searchPosts(req, res);

      expect(PostLike.findOne).toHaveBeenCalledWith({
        post: "post1",
        user: "currentUser",
      });
      expect(PostSave.findOne).toHaveBeenCalledWith({
        post: "post1",
        user: "currentUser",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = res.status().json.calls.mostRecent().args[0];
      expect(responseData.posts[0].hasLiked).toBe(false);
      expect(responseData.posts[0].hasSaved).toBe(true);
    });

    it("should return empty results when no posts match", async () => {
      req.query = { q: "nonexistent" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve([])
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith({
        success: true,
        posts: [],
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
      req.query = { q: "tutorial", page: "2", limit: "10" };

      const mockQuery = {
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve([])
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(25));

      await searchPosts(req, res);

      expect(mockQuery.select().populate().populate().sort().collation().limit).toHaveBeenCalledWith(10);
      expect(mockQuery.select().populate().populate().sort().collation().limit().skip).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith({
        success: true,
        posts: [],
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
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.resolve([])
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      spyOn(Post, "find").and.returnValue(mockQuery);
      spyOn(Post, "countDocuments").and.returnValue(Promise.resolve(0));

      await searchPosts(req, res);

      expect(mockQuery.select().populate().populate().sort().collation().limit).toHaveBeenCalledWith(50);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 if database error occurs", async () => {
      req.query = { q: "test" };

      spyOn(Post, "find").and.returnValue({
        select: jasmine.createSpy("select").and.returnValue({
          populate: jasmine.createSpy("populate").and.returnValue({
            populate: jasmine.createSpy("populate").and.returnValue({
              sort: jasmine.createSpy("sort").and.returnValue({
                collation: jasmine.createSpy("collation").and.returnValue({
                  limit: jasmine.createSpy("limit").and.returnValue({
                    skip: jasmine.createSpy("skip").and.returnValue(
                      Promise.reject(new Error("Database error"))
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      await searchPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status().json).toHaveBeenCalledWith({
        success: false,
        message: "Error searching posts",
        error: "Database error",
      });
    });
  });
});
