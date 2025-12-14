const {
  calculateEngagementScore,
  calculateRecencyScore,
  calculateSourceScore,
  calculateFeedScore
} = require('../../utils/feedAlgorithm');

describe('Feed Algorithm Utilities', () => {
  
  describe('calculateEngagementScore', () => {
    it('should return 0 for post with no engagement', () => {
      const post = { likesCount: 0, commentsCount: 0, repostsCount: 0 };
      expect(calculateEngagementScore(post)).toBe(0);
    });

    it('should calculate score for likes only', () => {
      const post = { likesCount: 10, commentsCount: 0, repostsCount: 0 };
      // Total = 10, log10(11) = 1.041, score = 1.041 * 25 = 26.02
      const score = calculateEngagementScore(post);
      expect(score).toBeCloseTo(26.02, 1);
    });

    it('should weight comments 3x more than likes', () => {
      const post = { likesCount: 0, commentsCount: 5, repostsCount: 0 };
      // Total = 15, log10(16) = 1.204, score = 1.204 * 25 = 30.10
      const score = calculateEngagementScore(post);
      expect(score).toBeCloseTo(30.10, 1);
    });

    it('should weight reposts 2x more than likes', () => {
      const post = { likesCount: 0, commentsCount: 0, repostsCount: 5 };
      // Total = 10, log10(11) = 1.041, score = 1.041 * 25 = 26.02
      const score = calculateEngagementScore(post);
      expect(score).toBeCloseTo(26.02, 1);
    });

    it('should calculate combined engagement correctly', () => {
      const post = { likesCount: 10, commentsCount: 5, repostsCount: 2 };
      // Total = (10*1) + (5*3) + (2*2) = 10 + 15 + 4 = 29
      // log10(30) = 1.477, score = 1.477 * 25 = 36.93
      const score = calculateEngagementScore(post);
      expect(score).toBeCloseTo(36.93, 1);
    });

    it('should cap score at 100 for very high engagement', () => {
      const post = { likesCount: 10000, commentsCount: 1000, repostsCount: 500 };
      const score = calculateEngagementScore(post);
      expect(score).toBe(100);
    });

    it('should use logarithmic scale to prevent outliers', () => {
      const post1 = { likesCount: 100, commentsCount: 0, repostsCount: 0 };
      const post2 = { likesCount: 1000, commentsCount: 0, repostsCount: 0 };
      
      const score1 = calculateEngagementScore(post1);
      const score2 = calculateEngagementScore(post2);
      
      // Score should not increase linearly (10x likes != 10x score)
      expect(score2).toBeLessThan(score1 * 2);
    });

    it('should handle missing engagement fields gracefully', () => {
      const post = { likesCount: 5 };
      expect(() => calculateEngagementScore(post)).not.toThrow();
    });
  });

  describe('calculateRecencyScore', () => {
    const now = Date.now();

    it('should return 100 for posts less than 1 hour old', () => {
      const post = { createdAt: new Date(now - 30 * 60 * 1000) }; // 30 minutes ago
      expect(calculateRecencyScore(post)).toBe(100);
    });

    it('should return 90 for posts 1-6 hours old', () => {
      const post = { createdAt: new Date(now - 3 * 60 * 60 * 1000) }; // 3 hours ago
      expect(calculateRecencyScore(post)).toBe(90);
    });

    it('should return 70 for posts 6-24 hours old', () => {
      const post = { createdAt: new Date(now - 12 * 60 * 60 * 1000) }; // 12 hours ago
      expect(calculateRecencyScore(post)).toBe(70);
    });

    it('should return 50 for posts 1-2 days old', () => {
      const post = { createdAt: new Date(now - 36 * 60 * 60 * 1000) }; // 1.5 days ago
      expect(calculateRecencyScore(post)).toBe(50);
    });

    it('should return 30 for posts 2-3 days old', () => {
      const post = { createdAt: new Date(now - 60 * 60 * 60 * 1000) }; // 2.5 days ago
      expect(calculateRecencyScore(post)).toBe(30);
    });

    it('should return 10 for posts 3-7 days old', () => {
      const post = { createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000) }; // 5 days ago
      expect(calculateRecencyScore(post)).toBe(10);
    });

    it('should return 0 for posts older than 7 days', () => {
      const post = { createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000) }; // 10 days ago
      expect(calculateRecencyScore(post)).toBe(0);
    });

    it('should handle edge case at exactly 1 hour', () => {
      const post = { createdAt: new Date(now - 60 * 60 * 1000) }; // Exactly 1 hour
      expect(calculateRecencyScore(post)).toBe(90);
    });

    it('should handle edge case at exactly 24 hours', () => {
      const post = { createdAt: new Date(now - 24 * 60 * 60 * 1000) }; // Exactly 24 hours
      expect(calculateRecencyScore(post)).toBe(50);
    });
  });

  describe('calculateSourceScore', () => {
    const userId = 'user123';

    it('should return 100 for post from followed user in joined community', () => {
      const post = {
        author: 'author123',
        community: 'community123'
      };
      const userConnections = {
        followedUsers: ['author123'],
        joinedCommunities: ['community123']
      };
      
      const score = calculateSourceScore(post, userId, userConnections);
      expect(score).toBe(100);
    });

    it('should return 80 for post from followed user only', () => {
      const post = {
        author: 'author123',
        community: null
      };
      const userConnections = {
        followedUsers: ['author123'],
        joinedCommunities: []
      };
      
      const score = calculateSourceScore(post, userId, userConnections);
      expect(score).toBe(80);
    });

    it('should return 60 for post from joined community only', () => {
      const post = {
        author: 'author456',
        community: 'community123'
      };
      const userConnections = {
        followedUsers: [],
        joinedCommunities: ['community123']
      };
      
      const score = calculateSourceScore(post, userId, userConnections);
      expect(score).toBe(60);
    });

    it('should return 0 for post from neither followed user nor joined community', () => {
      const post = {
        author: 'author456',
        community: null
      };
      const userConnections = {
        followedUsers: ['author123'],
        joinedCommunities: []
      };
      
      const score = calculateSourceScore(post, userId, userConnections);
      expect(score).toBe(0);
    });

    it('should handle author as ObjectId', () => {
      const post = {
        author: { _id: 'author123' },
        community: null
      };
      const userConnections = {
        followedUsers: ['author123'],
        joinedCommunities: []
      };
      
      const score = calculateSourceScore(post, userId, userConnections);
      expect(score).toBe(80);
    });

    it('should handle community as ObjectId', () => {
      const post = {
        author: 'author456',
        community: { _id: 'community123' }
      };
      const userConnections = {
        followedUsers: [],
        joinedCommunities: ['community123']
      };
      
      const score = calculateSourceScore(post, userId, userConnections);
      expect(score).toBe(60);
    });
  });

  describe('calculateFeedScore - Home Feed', () => {
    const now = Date.now();
    const userId = 'user123';

    it('should calculate combined score correctly for home feed', () => {
      const post = {
        likesCount: 10,
        commentsCount: 5,
        repostsCount: 2,
        createdAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
        author: 'author123'
      };
      const userConnections = {
        followedUsers: ['author123'],
        joinedCommunities: []
      };

      // Engagement ~36.93, Recency = 90, Source = 80
      // Score = (36.93 * 0.5) + (90 * 0.3) + (80 * 0.2) = 18.47 + 27 + 16 = 61.47
      const score = calculateFeedScore(post, userId, userConnections, 'home');
      expect(score).toBeCloseTo(61.47, 0);
    });

    it('should prioritize recent posts in home feed', () => {
      const oldPost = {
        likesCount: 100,
        commentsCount: 10,
        repostsCount: 5,
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        author: 'author123'
      };
      const newPost = {
        likesCount: 10,
        commentsCount: 5,
        repostsCount: 2,
        createdAt: new Date(now - 1 * 60 * 60 * 1000), // 1 hour ago
        author: 'author123'
      };
      const userConnections = {
        followedUsers: ['author123'],
        joinedCommunities: []
      };

      const oldScore = calculateFeedScore(oldPost, userId, userConnections, 'home');
      const newScore = calculateFeedScore(newPost, userId, userConnections, 'home');

      // Recent post should score higher despite lower engagement
      expect(newScore).toBeGreaterThan(oldScore);
    });
  });

  describe('calculateFeedScore - Trending Feed', () => {
    const now = Date.now();

    it('should calculate combined score correctly for trending feed', () => {
      const post = {
        likesCount: 50,
        commentsCount: 20,
        repostsCount: 10,
        createdAt: new Date(now - 5 * 60 * 60 * 1000) // 5 hours ago
      };

      // Engagement: (50*1) + (20*3) + (10*2) = 50 + 60 + 20 = 130
      // log10(131) = 2.117, score = 2.117 * 25 = 52.93
      // Recency = 90
      // Score = (52.93 * 0.6) + (90 * 0.4) = 31.76 + 36 = 67.76
      const score = calculateFeedScore(post, null, null, 'trending');
      expect(score).toBeCloseTo(67.76, 0);
    });

    it('should weight engagement higher in trending feed', () => {
      const highEngagement = {
        likesCount: 200,
        commentsCount: 50,
        repostsCount: 30,
        createdAt: new Date(now - 20 * 60 * 60 * 1000) // 20 hours ago
      };
      const lowEngagement = {
        likesCount: 10,
        commentsCount: 5,
        repostsCount: 2,
        createdAt: new Date(now - 1 * 60 * 60 * 1000) // 1 hour ago
      };

      const highScore = calculateFeedScore(highEngagement, null, null, 'trending');
      const lowScore = calculateFeedScore(lowEngagement, null, null, 'trending');

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should not use source score for trending feed', () => {
      const post = {
        likesCount: 50,
        commentsCount: 20,
        repostsCount: 10,
        createdAt: new Date(now - 5 * 60 * 60 * 1000),
        author: 'author123'
      };

      const scoreWithUser = calculateFeedScore(post, 'user123', { followedUsers: ['author123'] }, 'trending');
      const scoreWithoutUser = calculateFeedScore(post, null, null, 'trending');

      // Should be same regardless of user connections
      expect(scoreWithUser).toBe(scoreWithoutUser);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      const post = {
        createdAt: new Date(),
        author: 'author123'
      };
      
      expect(() => calculateEngagementScore(post)).not.toThrow();
      expect(() => calculateRecencyScore(post)).not.toThrow();
      expect(() => calculateFeedScore(post, null, null, 'home')).not.toThrow();
    });

    it('should return valid scores for minimal post data', () => {
      const post = {
        createdAt: new Date(),
        author: 'author123'
      };
      
      const engagement = calculateEngagementScore(post);
      const recency = calculateRecencyScore(post);
      const score = calculateFeedScore(post, null, null, 'trending');
      
      expect(engagement).toBeGreaterThanOrEqual(0);
      expect(recency).toBeGreaterThanOrEqual(0);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should default to home feed type if not specified', () => {
      const post = {
        likesCount: 10,
        commentsCount: 5,
        repostsCount: 2,
        createdAt: new Date(),
        author: 'author123'
      };
      
      const scoreWithType = calculateFeedScore(post, null, null, 'home');
      const scoreWithoutType = calculateFeedScore(post, null, null);
      
      expect(scoreWithType).toBe(scoreWithoutType);
    });
  });
});
