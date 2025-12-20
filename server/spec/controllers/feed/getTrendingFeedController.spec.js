const getTrendingFeed = require('../../../controllers/feed/getTrendingFeedController');
const Post = require('../../../models/Post');
const feedAlgorithm = require('../../../utils/feedAlgorithm');
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

describe('Get Trending Feed Controller', () => {
  let req, res, mockPosts, mockUserId;

  beforeEach(() => {
    mockUserId = 'user123';
    
    req = {
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
        content: 'Trending Post 1',
        author: { _id: 'author1', username: 'user1' },
        createdAt: new Date(),
        likesCount: 100,
        commentsCount: 50,
        repostsCount: 20,
        toObject: function() { return this; }
      },
      {
        _id: 'post2',
        content: 'Trending Post 2',
        author: { _id: 'author2', username: 'user2' },
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        likesCount: 50,
        commentsCount: 30,
        repostsCount: 10,
        toObject: function() { return this; }
      }
    ];
  });

  describe('Authentication', () => {
    it('should support unauthenticated requests', async () => {
      req.user = null;
      
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getTrendingFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should support authenticated requests', async () => {
      req.user = { _id: mockUserId };
      
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getTrendingFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Feed Scope', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should query all posts globally', async () => {
      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'find').and.callFake(mockFind);

      await getTrendingFeed(req, res);

      const queryArg = mockFind.calls.mostRecent().args[0];
      expect(queryArg.createdAt).toBeDefined(); // Should have time filter
      expect(queryArg.$or).toBeUndefined(); // No user/community filter
    });

    it('should filter posts within TRENDING_FEED_DAYS', async () => {
      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'find').and.callFake(mockFind);

      await getTrendingFeed(req, res);

      const queryArg = mockFind.calls.mostRecent().args[0];
      expect(queryArg.createdAt).toBeDefined();
      expect(queryArg.createdAt.$gte).toEqual(jasmine.any(Date));
    });
  });

  describe('Algorithmic Sorting', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should calculate trending scores for each post', async () => {
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));

      const mockCalculate = spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getTrendingFeed(req, res);

      expect(mockCalculate).toHaveBeenCalledTimes(mockPosts.length);
      expect(mockCalculate.calls.argsFor(0)[3]).toEqual('trending');
    });

    it('should sort posts by calculated score', async () => {
      spyOn(Post, 'find').and.returnValue(createPostFindMock([...mockPosts], false));

      // Assign different scores
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValues(50, 90);

      await getTrendingFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      
      // Should be sorted by score (90, 50)
      expect(response.data.posts[0]._id).toBe('post2'); // Higher score
      expect(response.data.posts[1]._id).toBe('post1'); // Lower score
    });

    it('should fetch more posts than needed for scoring', async () => {
      req.query.limit = '10';

      const mockFind = jasmine.createSpy('find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'find').and.callFake(mockFind);
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getTrendingFeed(req, res);

      const findResult = mockFind.calls.mostRecent().returnValue;
      const sortResult = findResult.sort.calls.mostRecent().returnValue;
      const limitSpy = sortResult.limit;

      expect(limitSpy).toHaveBeenCalledWith(30); // 10 * 3
    });

    it('should not pass user connections for unauthenticated users', async () => {
      req.user = null;

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));

      const mockCalculate = spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getTrendingFeed(req, res);

      expect(mockCalculate.calls.argsFor(0)[2]).toEqual({
        followedUsers: [],
        communities: []
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should use default pagination values', async () => {
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));

      await getTrendingFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(20);
    });

    it('should respect custom page and limit', async () => {
      req.query.page = '3';
      req.query.limit = '10';

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));

      await getTrendingFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.data.pagination.page).toBe(3);
      expect(response.data.pagination.limit).toBe(10);
    });

    it('should enforce max limit', async () => {
      req.query.limit = '200';

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));

      await getTrendingFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.data.pagination.limit).toBe(100); // MAX_LIMIT
    });

    it('should return correct pagination metadata', async () => {
      req.query.page = '2';
      req.query.limit = '10';

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));

      await getTrendingFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        pages: 10
      });
    });

    it('should slice posts correctly based on page and limit', async () => {
      req.query.page = '2';
      req.query.limit = '1';

      const manyPosts = Array.from({ length: 10 }, (_, i) => ({
        _id: `post${i}`,
        content: `Post ${i}`,
        author: { _id: `author${i}` },
        createdAt: new Date(),
        likesCount: 100 - i * 10,
        commentsCount: 50 - i * 5,
        repostsCount: 20 - i * 2,
        toObject: function() { return this; }
      }));

      spyOn(Post, 'find').and.returnValue(createPostFindMock(manyPosts, false));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.callFake((post) => post.likesCount);

      await getTrendingFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.data.posts.length).toBe(1);
      expect(response.data.posts[0]._id).toBe('post1'); // Second highest score
    });
  });

  describe('Caching', () => {
    it('should check cache before querying database', async () => {
      const cachedData = {
        posts: mockPosts,
        pagination: { page: 1, limit: 20, total: 100, pages: 5 }
      };

      const mockGet = spyOn(feedCache, 'get').and.returnValue(Promise.resolve(cachedData));

      await getTrendingFeed(req, res);

      expect(mockGet).toHaveBeenCalled();
      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response).toEqual(jasmine.objectContaining({
        success: true,
        cached: true,
        data: cachedData
      }));
    });

    it('should generate correct cache key for unauthenticated user', async () => {
      req.user = null;
      req.query.page = '2';

      const mockGet = spyOn(feedCache, 'get');
      mockGet.and.returnValue(Promise.resolve(null));

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getTrendingFeed(req, res);

      expect(mockGet).toHaveBeenCalledWith('feed:trending:public:page:2');
    });

    it('should generate correct cache key for authenticated user', async () => {
      req.user = { _id: mockUserId };
      req.query.page = '3';

      const mockGet = spyOn(feedCache, 'get');
      mockGet.and.returnValue(Promise.resolve(null));

      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getTrendingFeed(req, res);

      expect(mockGet).toHaveBeenCalledWith(`feed:trending:${mockUserId}:page:3`);
    });

    it('should store results in cache after database query', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));

      const mockSet = spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getTrendingFeed(req, res);

      expect(mockSet).toHaveBeenCalled();
      const setArgs = mockSet.calls.mostRecent().args;
      expect(setArgs[0]).toContain('feed:trending:');
      expect(setArgs[1]).toEqual(jasmine.objectContaining({
        posts: jasmine.any(Array),
        pagination: jasmine.any(Object)
      }));
      expect(setArgs[2]).toBe(300); // TRENDING feed TTL
    });

    it('should handle cache errors gracefully', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.reject(new Error('Cache error')));
      
      // Should continue without cache
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getTrendingFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(Promise.reject(new Error('Database error')));

      await getTrendingFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status.calls.mostRecent().returnValue.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FEED_ERROR',
          message: 'Failed to fetch trending feed'
        }
      });
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should return success response with correct structure', async () => {
      await getTrendingFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response).toEqual(jasmine.objectContaining({
        success: true,
        cached: false,
        feedType: 'trending',
        data: jasmine.objectContaining({
          posts: jasmine.any(Array),
          pagination: jasmine.objectContaining({
            page: jasmine.any(Number),
            limit: jasmine.any(Number),
            total: jasmine.any(Number),
            pages: jasmine.any(Number)
          })
        })
      }));
    });
  });
});
