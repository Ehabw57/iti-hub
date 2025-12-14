const getCommunityFeed = require('../../../controllers/community/getCommunityFeedController');
const Post = require('../../../models/Post');
const Enrollment = require('../../../models/Enrollment');
const feedCache = require('../../../utils/feedCache');
const postHelpers = require('../../../utils/postHelpers');

// Helper to create proper Post.find() mock chain
function createPostFindMock(posts, includeSkip = true) {
  const populateChain = {
    populate: jasmine.createSpy('populate3').and.returnValue(Promise.resolve(posts))
  };
  
  const populate2 = {
    populate: jasmine.createSpy('populate2').and.returnValue(populateChain)
  };
  
  const populate1 = {
    populate: jasmine.createSpy('populate1').and.returnValue(populate2)
  };
  
  if (includeSkip) {
    const limit = {
      limit: jasmine.createSpy('limit').and.returnValue(populate1)
    };
    
    const skip = {
      skip: jasmine.createSpy('skip').and.returnValue(limit)
    };
    
    return {
      sort: jasmine.createSpy('sort').and.returnValue(skip)
    };
  } else {
    const limit = {
      limit: jasmine.createSpy('limit').and.returnValue(populate1)
    };
    
    return {
      sort: jasmine.createSpy('sort').and.returnValue(limit)
    };
  }
}

describe('Get Community Feed Controller', () => {
  let req, res, mockPosts, mockUserId, mockCommunityId;

  beforeEach(() => {
    mockUserId = 'user123';
    mockCommunityId = 'community123';
    
    req = {
      params: {
        communityId: mockCommunityId
      },
      query: {},
      user: null
    };

    res = {
      status: jasmine.createSpy('status').and.returnValue({
        json: jasmine.createSpy('json')
      }),
      json: jasmine.createSpy('json')
    };

    mockPosts = [
      {
        _id: 'post1',
        content: 'Community Post 1',
        author: { _id: 'author1', username: 'user1' },
        community: mockCommunityId,
        createdAt: new Date(),
        likesCount: 10,
        commentsCount: 5,
        repostsCount: 2,
        toObject: function() { return this; }
      },
      {
        _id: 'post2',
        content: 'Community Post 2',
        author: { _id: 'author2', username: 'user2' },
        community: mockCommunityId,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        likesCount: 5,
        commentsCount: 3,
        repostsCount: 1,
        toObject: function() { return this; }
      }
    ];
  });

  describe('Authentication', () => {
    it('should support unauthenticated requests', async () => {
      req.user = null;
      
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getCommunityFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should support authenticated requests', async () => {
      req.user = { _id: mockUserId };
      
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getCommunityFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Community Validation', () => {
    it('should require communityId parameter', async () => {
      req.params.communityId = null;

      await getCommunityFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status.calls.mostRecent().returnValue.json).toHaveBeenCalledWith({
        success: false,
        message: 'Community ID is required'
      });
    });

    it('should validate communityId is provided', async () => {
      req.params.communityId = '';

      await getCommunityFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Feed Scope', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should query posts from specific community only', async () => {
      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'find').and.callFake(mockFind);

      await getCommunityFeed(req, res);

      const queryArg = mockFind.calls.mostRecent().args[0];
      expect(queryArg.community).toBe(mockCommunityId);
    });

    it('should not filter by author', async () => {
      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'find').and.callFake(mockFind);

      await getCommunityFeed(req, res);

      const queryArg = mockFind.calls.mostRecent().args[0];
      expect(queryArg.author).toBeUndefined();
    });
  });

  describe('Chronological Sorting', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should sort posts by creation date descending', async () => {
      const mockSort = jasmine.createSpy('sort').and.returnValue({
        skip: jasmine.createSpy('skip').and.returnValue({
          limit: jasmine.createSpy('limit').and.returnValue({
            populate: jasmine.createSpy('populate').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue({
                populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
              })
            })
          })
        })
      });

      spyOn(Post, 'find').and.returnValue({
        sort: mockSort
      });

      await getCommunityFeed(req, res);

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should not apply algorithmic scoring', async () => {
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));

      await getCommunityFeed(req, res);

      // Posts should be returned in same order as from DB (chronological)
      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.posts.length).toBe(mockPosts.length);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should use default pagination values', async () => {
      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'find').and.callFake(mockFind);

      await getCommunityFeed(req, res);

      const findResult = mockFind.calls.mostRecent().returnValue;
      const sortResult = findResult.sort.calls.mostRecent().returnValue;
      const skipSpy = sortResult.skip;
      const limitSpy = skipSpy.calls.mostRecent().returnValue.limit;

      expect(skipSpy).toHaveBeenCalledWith(0); // Default page 1
      expect(limitSpy).toHaveBeenCalledWith(20); // Default limit
    });

    it('should respect custom page and limit', async () => {
      req.query.page = '3';
      req.query.limit = '10';

      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'find').and.callFake(mockFind);

      await getCommunityFeed(req, res);

      const findResult = mockFind.calls.mostRecent().returnValue;
      const sortResult = findResult.sort.calls.mostRecent().returnValue;
      const skipSpy = sortResult.skip;
      const limitSpy = skipSpy.calls.mostRecent().returnValue.limit;

      expect(skipSpy).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(limitSpy).toHaveBeenCalledWith(10);
    });

    it('should enforce max limit', async () => {
      req.query.limit = '200';

      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'find').and.callFake(mockFind);

      await getCommunityFeed(req, res);

      const findResult = mockFind.calls.mostRecent().returnValue;
      const sortResult = findResult.sort.calls.mostRecent().returnValue;
      const skipSpy = sortResult.skip;
      const limitSpy = skipSpy.calls.mostRecent().returnValue.limit;

      expect(limitSpy).toHaveBeenCalledWith(100); // MAX_LIMIT
    });

    it('should return correct pagination metadata', async () => {
      req.query.page = '2';
      req.query.limit = '10';

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));

      await getCommunityFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        pages: 10
      });
    });
  });

  describe('Caching', () => {
    it('should check cache before querying database', async () => {
      const cachedData = {
        posts: mockPosts,
        pagination: { page: 1, limit: 20, total: 100, pages: 5 }
      };

      const mockGet = spyOn(feedCache, 'get').and.returnValue(Promise.resolve(cachedData));

      await getCommunityFeed(req, res);

      expect(mockGet).toHaveBeenCalled();
      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response).toEqual(jasmine.objectContaining({
        success: true,
        cached: true,
        posts: cachedData.posts,
        pagination: cachedData.pagination
      }));
    });

    it('should generate correct cache key for unauthenticated user', async () => {
      req.user = null;
      req.query.page = '2';

      const mockGet = spyOn(feedCache, 'get');
      mockGet.and.returnValue(Promise.resolve(null));

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getCommunityFeed(req, res);

      expect(mockGet).toHaveBeenCalledWith(`feed:community:${mockCommunityId}:public:page:2`);
    });

    it('should generate correct cache key for authenticated user', async () => {
      req.user = { _id: mockUserId };
      req.query.page = '3';

      const mockGet = spyOn(feedCache, 'get');
      mockGet.and.returnValue(Promise.resolve(null));

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getCommunityFeed(req, res);

      expect(mockGet).toHaveBeenCalledWith(`feed:community:${mockCommunityId}:${mockUserId}:page:3`);
    });

    it('should store results in cache after database query', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));

      const mockSet = spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getCommunityFeed(req, res);

      expect(mockSet).toHaveBeenCalled();
      const setArgs = mockSet.calls.mostRecent().args;
      expect(setArgs[0]).toContain(`feed:community:${mockCommunityId}:`);
      expect(setArgs[1]).toEqual(jasmine.objectContaining({
        posts: jasmine.any(Array),
        pagination: jasmine.any(Object)
      }));
      expect(setArgs[2]).toBe(300); // COMMUNITY feed TTL
    });

    it('should handle cache errors gracefully', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.reject(new Error('Cache error')));
      
      // Should continue without cache
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getCommunityFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Post Response Building', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should build post responses for unauthenticated users', async () => {
      req.user = null;

      const mockBuildPost = spyOn(postHelpers, 'buildPostResponse');
      mockBuildPost.and.returnValue(Promise.resolve(mockPosts[0]));

      await getCommunityFeed(req, res);

      expect(mockBuildPost).toHaveBeenCalledTimes(mockPosts.length);
      expect(mockBuildPost.calls.argsFor(0)[1]).toBeNull();
    });

    it('should build post responses for authenticated users', async () => {
      req.user = { _id: mockUserId };

      const mockBuildPost = spyOn(postHelpers, 'buildPostResponse');
      mockBuildPost.and.returnValue(Promise.resolve({ ...mockPosts[0], isLiked: false, isSaved: false }));

      await getCommunityFeed(req, res);

      expect(mockBuildPost).toHaveBeenCalledTimes(mockPosts.length);
      expect(mockBuildPost.calls.argsFor(0)[1]).toEqual(mockUserId);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(Promise.reject(new Error('Database error')));

      await getCommunityFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status.calls.mostRecent().returnValue.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch community feed'
      });
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, true));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should return success response with correct structure', async () => {
      await getCommunityFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response).toEqual(jasmine.objectContaining({
        success: true,
        cached: false,
        feedType: 'community',
        communityId: mockCommunityId,
        posts: jasmine.any(Array),
        pagination: jasmine.objectContaining({
          page: jasmine.any(Number),
          limit: jasmine.any(Number),
          total: jasmine.any(Number),
          pages: jasmine.any(Number)
        })
      }));
    });

    it('should include communityId in response', async () => {
      await getCommunityFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.communityId).toBe(mockCommunityId);
    });
  });
});
