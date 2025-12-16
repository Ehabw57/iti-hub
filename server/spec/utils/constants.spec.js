const {
  COMMUNITY_TAGS,
  MIN_COMMUNITY_TAGS,
  MAX_COMMUNITY_TAGS,
  COMMUNITY_PROFILE_PICTURE_SIZE,
  COMMUNITY_COVER_IMAGE_SIZE,
  CLOUDINARY_FOLDER_COMMUNITY_PROFILE,
  CLOUDINARY_FOLDER_COMMUNITY_COVER,
  MAX_SEARCH_RESULTS,
  DEFAULT_SEARCH_LIMIT,
  MIN_SEARCH_QUERY_LENGTH
} = require('../../utils/constants');

describe('Community Constants', () => {
  describe('COMMUNITY_TAGS', () => {
    it('should be an array of predefined tag categories', () => {
      expect(Array.isArray(COMMUNITY_TAGS)).toBe(true);
    });

    it('should contain exactly 20 tag categories', () => {
      expect(COMMUNITY_TAGS.length).toBe(20);
    });

    it('should contain expected categories', () => {
      const expectedTags = [
        'Technology',
        'Education',
        'Science',
        'Arts',
        'Sports',
        'Gaming',
        'Music',
        'Movies',
        'Books',
        'Food',
        'Travel',
        'Health',
        'Fitness',
        'Business',
        'Career',
        'Fashion',
        'Photography',
        'Nature',
        'Politics',
        'Hobbies'
      ];
      
      expect(COMMUNITY_TAGS).toEqual(expectedTags);
    });

    it('should have all unique tags', () => {
      const uniqueTags = new Set(COMMUNITY_TAGS);
      expect(uniqueTags.size).toBe(COMMUNITY_TAGS.length);
    });
  });

  describe('Tag Validation Constants', () => {
    it('should define minimum number of tags as 1', () => {
      expect(MIN_COMMUNITY_TAGS).toBe(1);
    });

    it('should define maximum number of tags as 3', () => {
      expect(MAX_COMMUNITY_TAGS).toBe(3);
    });
  });

  describe('Community Image Size Constants', () => {
    it('should define profile picture size configuration', () => {
      expect(COMMUNITY_PROFILE_PICTURE_SIZE).toBeDefined();
      expect(COMMUNITY_PROFILE_PICTURE_SIZE.width).toBe(500);
      expect(COMMUNITY_PROFILE_PICTURE_SIZE.height).toBe(500);
      expect(COMMUNITY_PROFILE_PICTURE_SIZE.max_size_mb).toBe(5);
      expect(COMMUNITY_PROFILE_PICTURE_SIZE.quality).toBe(85);
    });

    it('should define cover image size configuration', () => {
      expect(COMMUNITY_COVER_IMAGE_SIZE).toBeDefined();
      expect(COMMUNITY_COVER_IMAGE_SIZE.width).toBe(1500);
      expect(COMMUNITY_COVER_IMAGE_SIZE.height).toBe(500);
      expect(COMMUNITY_COVER_IMAGE_SIZE.max_size_mb).toBe(10);
      expect(COMMUNITY_COVER_IMAGE_SIZE.quality).toBe(85);
      expect(COMMUNITY_COVER_IMAGE_SIZE.fit).toBe('cover');
    });
  });

  describe('Cloudinary Folder Constants', () => {
    it('should define community profile picture folder', () => {
      expect(CLOUDINARY_FOLDER_COMMUNITY_PROFILE).toBe('community-profile-pictures');
    });

    it('should define community cover image folder', () => {
      expect(CLOUDINARY_FOLDER_COMMUNITY_COVER).toBe('community-cover-images');
    });
  });

  describe('Search Configuration Constants', () => {
    it('should export MAX_SEARCH_RESULTS constant', () => {
      expect(MAX_SEARCH_RESULTS).toBeDefined();
      expect(typeof MAX_SEARCH_RESULTS).toBe('number');
    });

    it('should export DEFAULT_SEARCH_LIMIT constant', () => {
      expect(DEFAULT_SEARCH_LIMIT).toBeDefined();
      expect(typeof DEFAULT_SEARCH_LIMIT).toBe('number');
    });

    it('should export MIN_SEARCH_QUERY_LENGTH constant', () => {
      expect(MIN_SEARCH_QUERY_LENGTH).toBeDefined();
      expect(typeof MIN_SEARCH_QUERY_LENGTH).toBe('number');
    });

    it('MAX_SEARCH_RESULTS should be greater than DEFAULT_SEARCH_LIMIT', () => {
      expect(MAX_SEARCH_RESULTS).toBeGreaterThan(DEFAULT_SEARCH_LIMIT);
    });

    it('MIN_SEARCH_QUERY_LENGTH should be at least 2', () => {
      expect(MIN_SEARCH_QUERY_LENGTH).toBeGreaterThanOrEqual(2);
    });

    it('DEFAULT_SEARCH_LIMIT should be reasonable (between 10 and 50)', () => {
      expect(DEFAULT_SEARCH_LIMIT).toBeGreaterThanOrEqual(10);
      expect(DEFAULT_SEARCH_LIMIT).toBeLessThanOrEqual(50);
    });

    it('MAX_SEARCH_RESULTS should be reasonable (not more than 100)', () => {
      expect(MAX_SEARCH_RESULTS).toBeLessThanOrEqual(100);
    });
  });
});
