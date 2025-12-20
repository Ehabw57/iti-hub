const getHomeFeed = require('../../../controllers/feed/getHomeFeedController');
const Post = require('../../../models/Post');
const Connection = require('../../../models/Connection');
const Enrollment = require('../../../models/Enrollment');
const feedAlgorithm = require('../../../utils/feedAlgorithm');
const feedCache = require('../../../utils/feedCache');
const postHelpers = require('../../../utils/postHelpers');
const { FEATURED_TAGS } = require('../../../utils/constants');

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

describe('Get Home Feed Controller', () => {
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
        content: 'Post 1',
        author: { _id: 'author1', username: 'user1' },
        createdAt: new Date(),
        likesCount: 10,
        commentsCount: 5,
        repostsCount: 2,
        tags: ['javascript', 'nodejs'],
        toObject: function() { return this; }
      },
      {
        _id: 'post2',
        content: 'Post 2',
        author: { _id: 'author2', username: 'user2' },
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        likesCount: 5,
        commentsCount: 3,
        repostsCount: 1,
        tags: ['react'],
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

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should support authenticated requests', async () => {
      req.user = { _id: mockUserId };
      
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Connection, 'find').and.returnValue(Promise.resolve([{ following: 'user1' }]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([{ branch: 'community1' }]));
      spyOn(Post, 'find').and.returnValue(createPostFindMock(mockPosts, false));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(feedAlgorithm.calculateFeedScore).toHaveBeenCalled();
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
      const mockFind = jasmine.createSpy('find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'find').and.callFake(mockFind);

      await getHomeFeed(req, res);

      const sortSpy = mockFind.calls.mostRecent().returnValue.sort;
      const skipSpy = sortSpy.calls.mostRecent().returnValue.skip;
      const limitSpy = skipSpy.calls.mostRecent().returnValue.limit;

      expect(skipSpy).toHaveBeenCalledWith(0); // Default page 1
      expect(limitSpy).toHaveBeenCalledWith(20); // Default limit
    });

    it('should respect custom page and limit', async () => {
      req.query.page = '3';
      req.query.limit = '10';

      const mockFind = jasmine.createSpy('find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'find').and.callFake(mockFind);

      await getHomeFeed(req, res);

      const sortSpy = mockFind.calls.mostRecent().returnValue.sort;
      const skipSpy = sortSpy.calls.mostRecent().returnValue.skip;
      const limitSpy = skipSpy.calls.mostRecent().returnValue.limit;

      expect(skipSpy).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(limitSpy).toHaveBeenCalledWith(10);
    });

    it('should enforce max limit', async () => {
      req.query.limit = '200';

      const mockFind = jasmine.createSpy('find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'find').and.callFake(mockFind);

      await getHomeFeed(req, res);

      const sortSpy = mockFind.calls.mostRecent().returnValue.sort;
      const skipSpy = sortSpy.calls.mostRecent().returnValue.skip;
      const limitSpy = skipSpy.calls.mostRecent().returnValue.limit;

      expect(limitSpy).toHaveBeenCalledWith(100); // MAX_LIMIT
    });

    it('should return correct pagination metadata', async () => {
      req.query.page = '2';
      req.query.limit = '10';

      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonCall = res.status.calls.mostRecent().returnValue.json;
      const response = jsonCall.calls.mostRecent().args[0];

      expect(response.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        pages: 10
      });
    });
  });

  describe('Unauthenticated Feed (Featured Tags)', () => {
    beforeEach(() => {
      req.user = null;
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(50));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should query posts with featured tags', async () => {
      const mockFind = jasmine.createSpy('find');
      mockFind.and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'find').and.callFake(mockFind);

      await getHomeFeed(req, res);

      expect(mockFind).toHaveBeenCalledWith({
        tags: { $in: FEATURED_TAGS }
      });
    });

    it('should use recency sorting for unauthenticated feed', async () => {
      const mockSort = jasmine.createSpy('sort').and.returnValue({
        skip: jasmine.createSpy('skip').and.returnValue({
          limit: jasmine.createSpy('limit').and.returnValue({
            populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
          })
        })
      });

      spyOn(Post, 'find').and.returnValue({
        sort: mockSort
      });

      await getHomeFeed(req, res);

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should not apply algorithmic scoring for unauthenticated feed', async () => {
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(feedAlgorithm, 'calculateFeedScore');

      await getHomeFeed(req, res);

      expect(feedAlgorithm.calculateFeedScore).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated Feed (Algorithmic)', () => {
    beforeEach(() => {
      req.user = { _id: mockUserId };
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should fetch user connections', async () => {
      const mockConnectionFind = spyOn(Connection, 'find').and.returnValue(Promise.resolve([
        { following: 'user1' },
        { following: 'user2' }
      ]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getHomeFeed(req, res);

      expect(mockConnectionFind).toHaveBeenCalledWith({ follower: mockUserId });
    });

    it('should fetch user enrollments', async () => {
      spyOn(Connection, 'find').and.returnValue(Promise.resolve([]));
      const mockEnrollmentFind = spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([
        { branch: 'community1' },
        { branch: 'community2' }
      ]));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getHomeFeed(req, res);

      expect(mockEnrollmentFind).toHaveBeenCalledWith({ user: mockUserId });
    });

    it('should query posts from connections and communities', async () => {
      spyOn(Connection, 'find').and.returnValue(Promise.resolve([
        { following: 'user1' }
      ]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([
        { branch: 'community1' }
      ]));

      const mockFind = jasmine.createSpy('find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'find').and.callFake(mockFind);
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getHomeFeed(req, res);

      const queryArg = mockFind.calls.mostRecent().args[0];
      expect(queryArg.$or).toBeDefined();
      expect(queryArg.$or.length).toBe(2);
      expect(queryArg.$or[0]).toEqual({ author: { $in: ['user1'] } });
      expect(queryArg.$or[1]).toEqual({ community: { $in: ['community1'] } });
    });

    it('should calculate feed scores for each post', async () => {
      const connections = [{ following: 'user1' }];
      const enrollments = [{ branch: 'community1' }];

      spyOn(Connection, 'find').and.returnValue(Promise.resolve(connections));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve(enrollments));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });

      const mockCalculate = spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getHomeFeed(req, res);

      expect(mockCalculate).toHaveBeenCalledTimes(mockPosts.length);
      expect(mockCalculate.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining(mockPosts[0]));
      expect(mockCalculate.calls.argsFor(0)[1]).toEqual(mockUserId);
      expect(mockCalculate.calls.argsFor(0)[3]).toEqual('home');
    });

    it('should sort posts by calculated score', async () => {
      spyOn(Connection, 'find').and.returnValue(Promise.resolve([{ following: 'user1' }]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([{ branch: 'community1' }]));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve([...mockPosts]))
            })
          })
        })
      });

      // Assign different scores
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValues(50, 90);

      await getHomeFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      
      // Should be sorted by score (90, 50)
      expect(response.data.posts[0]._id).toBe('post2'); // Higher score
      expect(response.data.posts[1]._id).toBe('post1'); // Lower score
    });

    it('should handle users with no connections or communities', async () => {
      spyOn(Connection, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve([]))
            })
          })
        })
      });

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.data.posts).toEqual([]);
    });
  });

  describe('Caching', () => {
    it('should check cache before querying database', async () => {
      const cachedData = {
        posts: mockPosts,
        pagination: { page: 1, limit: 20, total: 100, pages: 5 }
      };

      const mockGet = spyOn(feedCache, 'get').and.returnValue(Promise.resolve(cachedData));

      await getHomeFeed(req, res);

      expect(mockGet).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
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

      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getHomeFeed(req, res);

      expect(mockGet).toHaveBeenCalledWith('feed:home:public:page:2');
    });

    it('should generate correct cache key for authenticated user', async () => {
      req.user = { _id: mockUserId };
      req.query.page = '3';

      const mockGet = spyOn(feedCache, 'get');
      mockGet.and.returnValue(Promise.resolve(null));

      spyOn(Connection, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getHomeFeed(req, res);

      expect(mockGet).toHaveBeenCalledWith(`feed:home:${mockUserId}:page:3`);
    });

    it('should store results in cache after database query', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));

      const mockSet = spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getHomeFeed(req, res);

      expect(mockSet).toHaveBeenCalled();
      const setArgs = mockSet.calls.mostRecent().args;
      expect(setArgs[0]).toContain('feed:home:');
      expect(setArgs[1]).toEqual(jasmine.objectContaining({
        posts: jasmine.any(Array),
        pagination: jasmine.any(Object)
      }));
      expect(setArgs[2]).toBe(300); // HOME feed TTL
    });
  });

  describe('Post Response Building', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should build post responses with user data', async () => {
      req.user = { _id: mockUserId };

      spyOn(Connection, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      const mockBuildPost = spyOn(postHelpers, 'buildPostResponse');
      mockBuildPost.and.returnValue(Promise.resolve({ ...mockPosts[0], isLiked: false, isSaved: false }));

      await getHomeFeed(req, res);

      expect(mockBuildPost).toHaveBeenCalledTimes(mockPosts.length);
      expect(mockBuildPost.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining(mockPosts[0]));
      expect(mockBuildPost.calls.argsFor(0)[1]).toEqual(mockUserId);
    });

    it('should build post responses without user data for unauthenticated', async () => {
      req.user = null;

      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });

      const mockBuildPost = spyOn(postHelpers, 'buildPostResponse');
      mockBuildPost.and.returnValue(Promise.resolve(mockPosts[0]));

      await getHomeFeed(req, res);

      expect(mockBuildPost).toHaveBeenCalledTimes(mockPosts.length);
      expect(mockBuildPost.calls.argsFor(0)[1]).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue(Promise.reject(new Error('Database error')));

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status.calls.mostRecent().returnValue.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FEED_ERROR',
          message: 'Failed to fetch home feed'
        }
      });
    });

    it('should handle connection fetch errors', async () => {
      req.user = { _id: mockUserId };

      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Connection, 'find').and.returnValue(Promise.reject(new Error('Connection error')));

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle enrollment fetch errors', async () => {
      req.user = { _id: mockUserId };

      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Connection, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.reject(new Error('Enrollment error')));

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle cache errors gracefully', async () => {
      spyOn(feedCache, 'get').and.returnValue(Promise.reject(new Error('Cache error')));
      
      // Should continue without cache
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));

      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      spyOn(feedCache, 'get').and.returnValue(Promise.resolve(null));
      spyOn(Post, 'find').and.returnValue({
        sort: jasmine.createSpy('sort').and.returnValue({
          skip: jasmine.createSpy('skip').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue({
              populate: jasmine.createSpy('populate').and.returnValue(Promise.resolve(mockPosts))
            })
          })
        })
      });
      spyOn(Post, 'countDocuments').and.returnValue(Promise.resolve(100));
      spyOn(postHelpers, 'buildPostResponse').and.returnValue(Promise.resolve(mockPosts[0]));
      spyOn(feedCache, 'set').and.returnValue(Promise.resolve(true));
    });

    it('should return success response with correct structure', async () => {
      await getHomeFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];

      expect(response).toEqual(jasmine.objectContaining({
        success: true,
        cached: false,
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

    it('should include feedType in response for authenticated users', async () => {
      req.user = { _id: mockUserId };

      spyOn(Connection, 'find').and.returnValue(Promise.resolve([]));
      spyOn(Enrollment, 'find').and.returnValue(Promise.resolve([]));
      spyOn(feedAlgorithm, 'calculateFeedScore').and.returnValue(85);

      await getHomeFeed(req, res);

      const response = res.status.calls.mostRecent().returnValue.json.calls.mostRecent().args[0];
      expect(response.feedType).toBe('home');
    });
  });
});
