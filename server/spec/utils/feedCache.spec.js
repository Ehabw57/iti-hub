const feedCache = require('../../utils/feedCache');

describe('Feed Cache Manager', () => {

  beforeEach(() => {
    // Clear cache before each test
    feedCache.clearAll();
  });

  describe('generateCacheKey', () => {
    it('should generate correct key for authenticated home feed', () => {
      const key = feedCache.generateCacheKey('home', 'user123', 1);
      expect(key).toBe('feed:home:user123:page:1');
    });

    it('should generate correct key for unauthenticated home feed', () => {
      const key = feedCache.generateCacheKey('home', 'public', 1);
      expect(key).toBe('feed:home:public:page:1');
    });

    it('should generate correct key for following feed', () => {
      const key = feedCache.generateCacheKey('following', 'user123', 2);
      expect(key).toBe('feed:following:user123:page:2');
    });

    it('should generate correct key for trending feed', () => {
      const key = feedCache.generateCacheKey('trending', 'user123', 1);
      expect(key).toBe('feed:trending:user123:page:1');
    });

    it('should generate correct key for community feed with communityId', () => {
      const key = feedCache.generateCacheKey('community', 'user123', 1, 'community456');
      expect(key).toBe('feed:community:community456:user123:page:1');
    });

    it('should generate correct key for public community feed', () => {
      const key = feedCache.generateCacheKey('community', 'public', 1, 'community456');
      expect(key).toBe('feed:community:community456:public:page:1');
    });
  });

  describe('get and set', () => {
    it('should return null for cache miss', async () => {
      const result = await feedCache.get('feed:home:user123:page:1');
      expect(result).toBeNull();
    });

    it('should store and retrieve data', async () => {
      const data = { posts: [], pagination: {} };
      await feedCache.set('feed:home:user123:page:1', data, 60);
      
      const result = await feedCache.get('feed:home:user123:page:1');
      expect(result).toEqual(data);
    });

    it('should respect TTL and expire data', async () => {
      const data = { posts: [], pagination: {} };
      await feedCache.set('feed:home:user123:page:1', data, 1); // 1 second TTL
      
      // Should be available immediately
      let result = await feedCache.get('feed:home:user123:page:1');
      expect(result).toEqual(data);
      
      // Wait 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Should be expired
      result = await feedCache.get('feed:home:user123:page:1');
      expect(result).toBeNull();
    });

    it('should handle multiple keys independently', async () => {
      const data1 = { posts: ['post1'] };
      const data2 = { posts: ['post2'] };
      
      await feedCache.set('feed:home:user123:page:1', data1, 60);
      await feedCache.set('feed:home:user456:page:1', data2, 60);
      
      const result1 = await feedCache.get('feed:home:user123:page:1');
      const result2 = await feedCache.get('feed:home:user456:page:1');
      
      expect(result1).toEqual(data1);
      expect(result2).toEqual(data2);
    });
  });

  describe('del', () => {
    it('should delete specific key', async () => {
      const data = { posts: [] };
      await feedCache.set('feed:home:user123:page:1', data, 60);
      
      await feedCache.del('feed:home:user123:page:1');
      
      const result = await feedCache.get('feed:home:user123:page:1');
      expect(result).toBeNull();
    });

    it('should not affect other keys', async () => {
      const data1 = { posts: ['post1'] };
      const data2 = { posts: ['post2'] };
      
      await feedCache.set('feed:home:user123:page:1', data1, 60);
      await feedCache.set('feed:home:user123:page:2', data2, 60);
      
      await feedCache.del('feed:home:user123:page:1');
      
      const result1 = await feedCache.get('feed:home:user123:page:1');
      const result2 = await feedCache.get('feed:home:user123:page:2');
      
      expect(result1).toBeNull();
      expect(result2).toEqual(data2);
    });
  });

  describe('deletePattern', () => {
    beforeEach(async () => {
      // Set up multiple cache entries
      await feedCache.set('feed:home:user123:page:1', { data: '1' }, 60);
      await feedCache.set('feed:home:user123:page:2', { data: '2' }, 60);
      await feedCache.set('feed:home:user456:page:1', { data: '3' }, 60);
      await feedCache.set('feed:following:user123:page:1', { data: '4' }, 60);
    });

    it('should delete all keys matching pattern', async () => {
      await feedCache.deletePattern('feed:home:user123:*');
      
      const result1 = await feedCache.get('feed:home:user123:page:1');
      const result2 = await feedCache.get('feed:home:user123:page:2');
      const result3 = await feedCache.get('feed:home:user456:page:1');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).not.toBeNull(); // Should not be deleted
    });

    it('should handle wildcard at beginning', async () => {
      await feedCache.deletePattern('*:user123:*');
      
      const result1 = await feedCache.get('feed:home:user123:page:1');
      const result2 = await feedCache.get('feed:following:user123:page:1');
      const result3 = await feedCache.get('feed:home:user456:page:1');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).not.toBeNull();
    });

    it('should handle complete wildcard', async () => {
      await feedCache.deletePattern('feed:trending:*');
      
      // Should not affect existing keys
      const result = await feedCache.get('feed:home:user123:page:1');
      expect(result).not.toBeNull();
    });
  });

  describe('invalidateFeed', () => {
    it('should invalidate home feed for specific user', async () => {
      await feedCache.set('feed:home:user123:page:1', { data: '1' }, 60);
      await feedCache.set('feed:home:user123:page:2', { data: '2' }, 60);
      await feedCache.set('feed:home:user456:page:1', { data: '3' }, 60);
      
      await feedCache.invalidateFeed('user123', 'home');
      
      expect(await feedCache.get('feed:home:user123:page:1')).toBeNull();
      expect(await feedCache.get('feed:home:user123:page:2')).toBeNull();
      expect(await feedCache.get('feed:home:user456:page:1')).not.toBeNull();
    });

    it('should invalidate following feed for specific user', async () => {
      await feedCache.set('feed:following:user123:page:1', { data: '1' }, 60);
      await feedCache.set('feed:following:user456:page:1', { data: '2' }, 60);
      
      await feedCache.invalidateFeed('user123', 'following');
      
      expect(await feedCache.get('feed:following:user123:page:1')).toBeNull();
      expect(await feedCache.get('feed:following:user456:page:1')).not.toBeNull();
    });
  });

  describe('invalidateFollowerFeeds', () => {
    it('should invalidate home and following feeds for all followers', async () => {
      const followerIds = ['follower1', 'follower2', 'follower3'];
      
      // Set up feeds for followers
      for (const id of followerIds) {
        await feedCache.set(`feed:home:${id}:page:1`, { data: id }, 60);
        await feedCache.set(`feed:following:${id}:page:1`, { data: id }, 60);
      }
      
      // Also set up a feed for a non-follower
      await feedCache.set('feed:home:other:page:1', { data: 'other' }, 60);
      
      await feedCache.invalidateFollowerFeeds(followerIds);
      
      // Follower feeds should be invalidated
      for (const id of followerIds) {
        expect(await feedCache.get(`feed:home:${id}:page:1`)).toBeNull();
        expect(await feedCache.get(`feed:following:${id}:page:1`)).toBeNull();
      }
      
      // Non-follower should not be affected
      expect(await feedCache.get('feed:home:other:page:1')).not.toBeNull();
    });

    it('should handle empty follower list', async () => {
      await feedCache.set('feed:home:user123:page:1', { data: '1' }, 60);
      
      await feedCache.invalidateFollowerFeeds([]);
      
      // Should not delete anything
      expect(await feedCache.get('feed:home:user123:page:1')).not.toBeNull();
    });
  });

  describe('invalidateCommunityFeed', () => {
    it('should invalidate all pages for a community', async () => {
      await feedCache.set('feed:community:community123:user1:page:1', { data: '1' }, 60);
      await feedCache.set('feed:community:community123:user2:page:1', { data: '2' }, 60);
      await feedCache.set('feed:community:community123:public:page:1', { data: '3' }, 60);
      await feedCache.set('feed:community:community456:user1:page:1', { data: '4' }, 60);
      
      await feedCache.invalidateCommunityFeed('community123');
      
      expect(await feedCache.get('feed:community:community123:user1:page:1')).toBeNull();
      expect(await feedCache.get('feed:community:community123:user2:page:1')).toBeNull();
      expect(await feedCache.get('feed:community:community123:public:page:1')).toBeNull();
      expect(await feedCache.get('feed:community:community456:user1:page:1')).not.toBeNull();
    });
  });

  describe('invalidateTrendingFeed', () => {
    it('should invalidate all trending feeds', async () => {
      await feedCache.set('feed:trending:user1:page:1', { data: '1' }, 60);
      await feedCache.set('feed:trending:user2:page:1', { data: '2' }, 60);
      await feedCache.set('feed:trending:public:page:1', { data: '3' }, 60);
      await feedCache.set('feed:home:user1:page:1', { data: '4' }, 60);
      
      await feedCache.invalidateTrendingFeed();
      
      expect(await feedCache.get('feed:trending:user1:page:1')).toBeNull();
      expect(await feedCache.get('feed:trending:user2:page:1')).toBeNull();
      expect(await feedCache.get('feed:trending:public:page:1')).toBeNull();
      expect(await feedCache.get('feed:home:user1:page:1')).not.toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all cached data', async () => {
      await feedCache.set('feed:home:user1:page:1', { data: '1' }, 60);
      await feedCache.set('feed:following:user2:page:1', { data: '2' }, 60);
      await feedCache.set('feed:trending:public:page:1', { data: '3' }, 60);
      
      feedCache.clearAll();
      
      expect(await feedCache.get('feed:home:user1:page:1')).toBeNull();
      expect(await feedCache.get('feed:following:user2:page:1')).toBeNull();
      expect(await feedCache.get('feed:trending:public:page:1')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await feedCache.set('feed:home:user1:page:1', { data: '1' }, 60);
      await feedCache.set('feed:home:user2:page:1', { data: '2' }, 60);
      
      const stats = feedCache.getStats();
      
      expect(stats).toEqual(jasmine.objectContaining({
        keys: jasmine.any(Number),
        hits: jasmine.any(Number),
        misses: jasmine.any(Number),
        ksize: jasmine.any(Number),
        vsize: jasmine.any(Number)
      }));
      
      expect(stats.keys).toBeGreaterThanOrEqual(2);
    });
  });
});
