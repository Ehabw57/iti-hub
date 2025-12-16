/**
 * Search Routes
 * Epic 9: Search - T107
 * Handles all search-related endpoints
 */
const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middlewares/checkAuth");
const { searchUsers } = require("../controllers/user");
const { searchPosts } = require("../controllers/post");
const { searchCommunities } = require("../controllers/community");

/**
 * @route   GET /api/v1/search/users
 * @desc    Search for users by username, fullName, or bio
 * @query   q - search query (required, min 2 chars)
 * @query   specialization - filter by specialization (optional)
 * @query   page - page number (optional, default 1)
 * @query   limit - results per page (optional, default 20, max 50)
 * @access  Public (optional authentication for isFollowing metadata)
 */
router.get("/users", optionalAuth, searchUsers);

/**
 * @route   GET /api/v1/search/posts
 * @desc    Search for posts by content
 * @query   q - search query (required, min 2 chars)
 * @query   type - filter by type: 'original' or 'repost' (optional)
 * @query   communityId - filter by community (optional)
 * @query   page - page number (optional, default 1)
 * @query   limit - results per page (optional, default 20, max 50)
 * @access  Public (optional authentication for hasLiked/hasSaved metadata)
 * @note    Tags filter removed (tags are ObjectIds, not searchable strings)
 */
router.get("/posts", optionalAuth, searchPosts);

/**
 * @route   GET /api/v1/search/communities
 * @desc    Search for communities by name, description, or tags
 * @query   q - search query (required, min 2 chars)
 * @query   tags - comma-separated tags filter (optional)
 * @query   page - page number (optional, default 1)
 * @query   limit - results per page (optional, default 20, max 50)
 * @access  Public (optional authentication for isMember metadata)
 */
router.get("/communities", optionalAuth, searchCommunities);

module.exports = router;
