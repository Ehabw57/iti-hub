const mongoose = require('mongoose');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Community = require('../../models/Community');

describe('Search Indexes', () => {
  describe('User Model Text Index', () => {
    it('should have text index on username, fullName, bio', () => {
      const indexes = User.schema.indexes();
      const textIndex = indexes.find(index => {
        const keys = index[0];
        return keys.username === 'text' || keys.fullName === 'text' || keys.bio === 'text';
      });
      
      expect(textIndex).toBeDefined();
    });

    it('text index should have correct weights', () => {
      const indexes = User.schema.indexes();
      const textIndex = indexes.find(index => {
        const keys = index[0];
        return keys.username === 'text' || keys.fullName === 'text' || keys.bio === 'text';
      });
      
      if (textIndex) {
        const options = textIndex[1];
        expect(options.weights).toBeDefined();
        expect(options.weights.username).toBe(10);
        expect(options.weights.fullName).toBe(5);
        expect(options.weights.bio).toBe(1);
      }
    });

    it('text index should be named user_search_index', () => {
      const indexes = User.schema.indexes();
      const textIndex = indexes.find(index => {
        const options = index[1];
        return options.name === 'user_search_index';
      });
      
      expect(textIndex).toBeDefined();
    });
  });

  describe('Post Model Text Index', () => {
    it('should have text index on content (tags removed as they are ObjectIds)', () => {
      const indexes = Post.schema.indexes();
      const textIndex = indexes.find(index => {
        const keys = index[0];
        return keys.content === 'text';
      });
      
      expect(textIndex).toBeDefined();
    });

    it('text index should have correct weights', () => {
      const indexes = Post.schema.indexes();
      const textIndex = indexes.find(index => {
        const keys = index[0];
        return keys.content === 'text';
      });
      
      if (textIndex) {
        const options = textIndex[1];
        expect(options.weights).toBeDefined();
        expect(options.weights.content).toBe(1);
      }
    });

    it('text index should be named post_search_index', () => {
      const indexes = Post.schema.indexes();
      const textIndex = indexes.find(index => {
        const options = index[1];
        return options.name === 'post_search_index';
      });
      
      expect(textIndex).toBeDefined();
    });
  });

  describe('Community Model Text Index', () => {
    it('should have text index on name, description, tags', () => {
      const indexes = Community.schema.indexes();
      const textIndex = indexes.find(index => {
        const keys = index[0];
        return keys.name === 'text' || keys.description === 'text' || keys.tags === 'text';
      });
      
      expect(textIndex).toBeDefined();
    });

    it('text index should have correct weights', () => {
      const indexes = Community.schema.indexes();
      const textIndex = indexes.find(index => {
        const keys = index[0];
        return keys.name === 'text' || keys.description === 'text' || keys.tags === 'text';
      });
      
      if (textIndex) {
        const options = textIndex[1];
        expect(options.weights).toBeDefined();
        expect(options.weights.name).toBe(10);
        expect(options.weights.tags).toBe(5);
        expect(options.weights.description).toBe(1);
      }
    });

    it('text index should be named community_search_index', () => {
      const indexes = Community.schema.indexes();
      const textIndex = indexes.find(index => {
        const options = index[1];
        return options.name === 'community_search_index';
      });
      
      expect(textIndex).toBeDefined();
    });
  });
});
