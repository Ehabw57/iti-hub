const express = require('express');
const { checkAuth, optionalAuth } = require('../middlewares/checkAuth');
const getHomeFeed = require('../controllers/feed/getHomeFeedController');
const getFollowingFeed = require('../controllers/feed/getFollowingFeedController');
const getTrendingFeed = require('../controllers/feed/getTrendingFeedController');

const feedRoutes = express.Router();

/**
 * @route   GET /api/feed/home
 * @desc    Get home feed (algorithmic for authenticated users, featured tags for guests)
 * @access  Public (optional auth)
 */
feedRoutes.get('/home', optionalAuth, getHomeFeed);

/**
 * @route   GET /api/feed/following
 * @desc    Get following feed (chronological posts from followed users and communities)
 * @access  Private (requires auth)
 */
feedRoutes.get('/following', checkAuth, getFollowingFeed);

/**
 * @route   GET /api/feed/trending
 * @desc    Get trending feed (global algorithmic feed)
 * @access  Public (optional auth)
 */
feedRoutes.get('/trending', optionalAuth, getTrendingFeed);

module.exports = feedRoutes;
