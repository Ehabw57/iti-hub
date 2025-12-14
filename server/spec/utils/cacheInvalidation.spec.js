const cacheInvalidation = require('../../utils/cacheInvalidation');
const feedCache = require('../../utils/feedCache');
const Connection = require('../../models/Connection');

describe('Cache Invalidation Utilities', () => {

  // Helper function to mock Connection.find().select() chain
  function mockConnectionFind(followers) {
    const selectMock = jasmine.createSpy('select').and.returnValue(
      Promise.resolve(followers)
    );
    spyOn(Connection, 'find').and.returnValue({ select: selectMock });
    return selectMock;
  }

  describe('invalidateOnPostCreate', () => {
    it('should invalidate follower feeds when post is created', async () => {
      const authorId = 'author123';
      const followerIds = ['follower1', 'follower2', 'follower3'];
      
      mockConnectionFind(followerIds.map(id => ({ follower: id })));
      
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(6));
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      const result = await cacheInvalidation.invalidateOnPostCreate(authorId);

      expect(result.success).toBe(true);
      expect(feedCache.invalidateFollowerFeeds).toHaveBeenCalledWith(followerIds);
    });

    it('should invalidate author own feeds', async () => {
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostCreate(authorId);

      expect(invalidateFeedSpy).toHaveBeenCalledWith(authorId, 'home');
      expect(invalidateFeedSpy).toHaveBeenCalledWith(authorId, 'following');
    });

    it('should invalidate trending feed', async () => {
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      const trendingSpy = spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostCreate(authorId);

      expect(trendingSpy).toHaveBeenCalled();
    });

    it('should invalidate community feed when communityId provided', async () => {
      const authorId = 'author123';
      const communityId = 'community456';
      
      mockConnectionFind([]);
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));
      const communitySpy = spyOn(feedCache, 'invalidateCommunityFeed').and.returnValue(Promise.resolve(5));

      await cacheInvalidation.invalidateOnPostCreate(authorId, communityId);

      expect(communitySpy).toHaveBeenCalledWith(communityId);
    });

    it('should not invalidate community feed when communityId not provided', async () => {
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));
      const communitySpy = spyOn(feedCache, 'invalidateCommunityFeed').and.returnValue(Promise.resolve(5));

      await cacheInvalidation.invalidateOnPostCreate(authorId);

      expect(communitySpy).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const authorId = 'author123';
      
      const selectMock = jasmine.createSpy('select').and.returnValue(
        Promise.reject(new Error('Database error'))
      );
      spyOn(Connection, 'find').and.returnValue({ select: selectMock });

      const result = await cacheInvalidation.invalidateOnPostCreate(authorId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle case with no followers', async () => {
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      const followerFeedsSpy = spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostCreate(authorId);

      expect(followerFeedsSpy).not.toHaveBeenCalled();
    });
  });

  describe('invalidateOnPostUpdate', () => {
    it('should invalidate trending feed', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      
      const trendingSpy = spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostUpdate(postId, authorId);

      expect(trendingSpy).toHaveBeenCalled();
    });

    it('should invalidate community feed when communityId provided', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      const communityId = 'community456';
      
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));
      const communitySpy = spyOn(feedCache, 'invalidateCommunityFeed').and.returnValue(Promise.resolve(5));

      await cacheInvalidation.invalidateOnPostUpdate(postId, authorId, communityId);

      expect(communitySpy).toHaveBeenCalledWith(communityId);
    });

    it('should not invalidate community feed when communityId not provided', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));
      const communitySpy = spyOn(feedCache, 'invalidateCommunityFeed').and.returnValue(Promise.resolve(5));

      await cacheInvalidation.invalidateOnPostUpdate(postId, authorId);

      expect(communitySpy).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.reject(new Error('Cache error')));

      const result = await cacheInvalidation.invalidateOnPostUpdate(postId, authorId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('invalidateOnPostDelete', () => {
    it('should invalidate follower feeds', async () => {
      const authorId = 'author123';
      const followerIds = ['follower1', 'follower2'];
      
      mockConnectionFind(followerIds.map(id => ({ follower: id })));
      
      const followerFeedsSpy = spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(4));
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostDelete(authorId);

      expect(followerFeedsSpy).toHaveBeenCalledWith(followerIds);
    });

    it('should invalidate author feeds', async () => {
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostDelete(authorId);

      expect(invalidateFeedSpy).toHaveBeenCalledWith(authorId, 'home');
      expect(invalidateFeedSpy).toHaveBeenCalledWith(authorId, 'following');
    });

    it('should invalidate trending feed', async () => {
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      const trendingSpy = spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostDelete(authorId);

      expect(trendingSpy).toHaveBeenCalled();
    });

    it('should invalidate community feed when communityId provided', async () => {
      const authorId = 'author123';
      const communityId = 'community456';
      
      mockConnectionFind([]);
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateFollowerFeeds').and.returnValue(Promise.resolve(0));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));
      const communitySpy = spyOn(feedCache, 'invalidateCommunityFeed').and.returnValue(Promise.resolve(5));

      await cacheInvalidation.invalidateOnPostDelete(authorId, communityId);

      expect(communitySpy).toHaveBeenCalledWith(communityId);
    });

    it('should handle errors gracefully', async () => {
      const authorId = 'author123';
      
      const selectMock = jasmine.createSpy('select').and.returnValue(
        Promise.reject(new Error('Database error'))
      );
      spyOn(Connection, 'find').and.returnValue({ select: selectMock });

      const result = await cacheInvalidation.invalidateOnPostDelete(authorId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('invalidateOnPostEngagement', () => {
    it('should invalidate trending feed', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      const trendingSpy = spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostEngagement(postId, authorId);

      expect(trendingSpy).toHaveBeenCalled();
    });

    it('should invalidate follower home feeds', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      const followerIds = ['follower1', 'follower2'];
      
      mockConnectionFind(followerIds.map(id => ({ follower: id })));
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostEngagement(postId, authorId);

      // Should be called for each follower + author
      expect(invalidateFeedSpy).toHaveBeenCalledTimes(followerIds.length + 1);
      expect(invalidateFeedSpy).toHaveBeenCalledWith('follower1', 'home');
      expect(invalidateFeedSpy).toHaveBeenCalledWith('follower2', 'home');
      expect(invalidateFeedSpy).toHaveBeenCalledWith(authorId, 'home');
    });

    it('should invalidate author home feed', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      
      mockConnectionFind([]);
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));
      spyOn(feedCache, 'invalidateTrendingFeed').and.returnValue(Promise.resolve(10));

      await cacheInvalidation.invalidateOnPostEngagement(postId, authorId);

      expect(invalidateFeedSpy).toHaveBeenCalledWith(authorId, 'home');
    });

    it('should handle errors gracefully', async () => {
      const postId = 'post123';
      const authorId = 'author123';
      
      const selectMock = jasmine.createSpy('select').and.returnValue(
        Promise.reject(new Error('Database error'))
      );
      spyOn(Connection, 'find').and.returnValue({ select: selectMock });

      const result = await cacheInvalidation.invalidateOnPostEngagement(postId, authorId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('invalidateOnConnectionChange', () => {
    it('should invalidate user home feed', async () => {
      const userId = 'user123';
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));

      await cacheInvalidation.invalidateOnConnectionChange(userId);

      expect(invalidateFeedSpy).toHaveBeenCalledWith(userId, 'home');
    });

    it('should invalidate user following feed', async () => {
      const userId = 'user123';
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));

      await cacheInvalidation.invalidateOnConnectionChange(userId);

      expect(invalidateFeedSpy).toHaveBeenCalledWith(userId, 'following');
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user123';
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.reject(new Error('Cache error')));

      const result = await cacheInvalidation.invalidateOnConnectionChange(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('invalidateOnEnrollmentChange', () => {
    it('should invalidate user home feed', async () => {
      const userId = 'user123';
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));

      await cacheInvalidation.invalidateOnEnrollmentChange(userId);

      expect(invalidateFeedSpy).toHaveBeenCalledWith(userId, 'home');
    });

    it('should invalidate user following feed', async () => {
      const userId = 'user123';
      
      const invalidateFeedSpy = spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.resolve(1));

      await cacheInvalidation.invalidateOnEnrollmentChange(userId);

      expect(invalidateFeedSpy).toHaveBeenCalledWith(userId, 'following');
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user123';
      
      spyOn(feedCache, 'invalidateFeed').and.returnValue(Promise.reject(new Error('Cache error')));

      const result = await cacheInvalidation.invalidateOnEnrollmentChange(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
