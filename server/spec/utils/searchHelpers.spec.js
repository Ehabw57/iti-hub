const {
  validateSearchQuery,
  sanitizeSearchQuery,
  buildSearchFilter,
  parseSearchPagination
} = require('../../utils/searchHelpers');
const { MIN_SEARCH_QUERY_LENGTH, MAX_SEARCH_RESULTS, DEFAULT_SEARCH_LIMIT } = require('../../utils/constants');

describe('Search Helpers', () => {
  describe('validateSearchQuery', () => {
    it('should validate minimum query length', () => {
      const validQuery = 'ab';
      expect(() => validateSearchQuery(validQuery)).not.toThrow();
    });

    it('should throw error for empty query', () => {
      expect(() => validateSearchQuery('')).toThrow();
      expect(() => validateSearchQuery('  ')).toThrow();
    });

    it('should throw error for query too short', () => {
      expect(() => validateSearchQuery('a')).toThrow();
    });

    it('should accept valid query', () => {
      const result = validateSearchQuery('test search');
      expect(result).toBe('test search');
    });

    it('should trim whitespace from query', () => {
      const result = validateSearchQuery('  test  ');
      expect(result).toBe('test');
    });

    it('should handle null/undefined query', () => {
      expect(() => validateSearchQuery(null)).toThrow();
      expect(() => validateSearchQuery(undefined)).toThrow();
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove special regex characters', () => {
      const result = sanitizeSearchQuery('test$query');
      expect(result).not.toContain('$');
    });

    it('should trim whitespace', () => {
      const result = sanitizeSearchQuery('  test  ');
      expect(result).toBe('test');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeSearchQuery(null)).toBe('');
      expect(sanitizeSearchQuery(undefined)).toBe('');
    });

    it('should handle special characters', () => {
      const result = sanitizeSearchQuery('test.query*');
      expect(result).not.toContain('.');
      expect(result).not.toContain('*');
    });

    it('should preserve valid characters', () => {
      const result = sanitizeSearchQuery('test query 123');
      expect(result).toBe('test query 123');
    });
  });

  describe('buildSearchFilter', () => {
    it('should build text search filter', () => {
      const filter = buildSearchFilter('test query');
      expect(filter.$text).toBeDefined();
      expect(filter.$text.$search).toBe('test query');
    });

    it('should combine with additional filters', () => {
      const additionalFilters = { status: 'active' };
      const filter = buildSearchFilter('test', additionalFilters);
      expect(filter.$text).toBeDefined();
      expect(filter.status).toBe('active');
    });

    it('should handle empty additional filters', () => {
      const filter = buildSearchFilter('test', {});
      expect(filter.$text).toBeDefined();
      expect(Object.keys(filter).length).toBe(1);
    });

    it('should handle undefined additional filters', () => {
      const filter = buildSearchFilter('test');
      expect(filter.$text).toBeDefined();
    });

    it('should build filter with array values', () => {
      const additionalFilters = { tags: ['web', 'dev'] };
      const filter = buildSearchFilter('test', additionalFilters);
      expect(filter.tags).toEqual(['web', 'dev']);
    });
  });

  describe('parseSearchPagination', () => {
    it('should parse valid pagination', () => {
      const result = parseSearchPagination(2, 20);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(20);
    });

    it('should enforce max limit', () => {
      const result = parseSearchPagination(1, 200);
      expect(result.limit).toBe(MAX_SEARCH_RESULTS);
    });

    it('should default to page 1', () => {
      const result = parseSearchPagination(0, 20);
      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('should default to page 1 for negative page', () => {
      const result = parseSearchPagination(-1, 20);
      expect(result.page).toBe(1);
    });

    it('should calculate skip correctly', () => {
      const result = parseSearchPagination(3, 20);
      expect(result.skip).toBe(40);
    });

    it('should handle string inputs', () => {
      const result = parseSearchPagination('2', '20');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should use default limit when not provided', () => {
      const result = parseSearchPagination(1);
      expect(result.limit).toBe(DEFAULT_SEARCH_LIMIT);
    });

    it('should handle invalid limit', () => {
      const result = parseSearchPagination(1, 0);
      expect(result.limit).toBeGreaterThan(0);
    });
  });
});
