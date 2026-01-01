/**
 * Admin Routes
 * All routes require authentication and admin role
 */
const express = require('express');
const { checkAuth, authorize } = require('../middlewares/checkAuth');
const {
  // Statistics
  getOverviewStats,
  getRegistrationStats,
  getGrowthStats,
  getTagStats,
  getActiveUsers,
  getActiveCommunities,
  getOnlineUsers,
  // User Management
  listUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
  updateUserRole,
  // Post Management
  listPosts,
  deletePost,
  // Comment Management
  listComments,
  deleteComment,
  // Community Management
  listCommunities,
  deleteCommunity
} = require('../controllers/admin');

const adminRouter = express.Router();

// Apply auth middleware to all admin routes
adminRouter.use(checkAuth, authorize('admin'));

// =============================================================================
// STATISTICS ROUTES
// =============================================================================

/**
 * @route   GET /admin/statistics/overview
 * @desc    Get platform overview statistics
 * @access  Admin only
 */
adminRouter.get('/statistics/overview', getOverviewStats);

/**
 * @route   GET /admin/statistics/registrations
 * @desc    Get user registration statistics over time
 * @access  Admin only
 * @query   startDate, endDate, granularity (daily|weekly|monthly)
 */
adminRouter.get('/statistics/registrations', getRegistrationStats);

/**
 * @route   GET /admin/statistics/growth
 * @desc    Get overall platform growth statistics
 * @access  Admin only
 * @query   startDate, endDate
 */
adminRouter.get('/statistics/growth', getGrowthStats);

/**
 * @route   GET /admin/statistics/tags
 * @desc    Get top tags by usage
 * @access  Admin only
 * @query   limit
 */
adminRouter.get('/statistics/tags', getTagStats);

/**
 * @route   GET /admin/statistics/active-users
 * @desc    Get most active users by post count
 * @access  Admin only
 * @query   limit, startDate, endDate
 */
adminRouter.get('/statistics/active-users', getActiveUsers);

/**
 * @route   GET /admin/statistics/active-communities
 * @desc    Get most active communities by member/post count
 * @access  Admin only
 * @query   limit
 */
adminRouter.get('/statistics/active-communities', getActiveCommunities);

/**
 * @route   GET /admin/statistics/online-users
 * @desc    Get currently online users
 * @access  Admin only
 * @query   limit
 */
adminRouter.get('/statistics/online-users', getOnlineUsers);

// =============================================================================
// USER MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   GET /admin/users
 * @desc    List all users with search, filtering, and pagination
 * @access  Admin only
 * @query   search, role, isBlocked, startDate, endDate, page, limit
 */
adminRouter.get('/users', listUsers);

/**
 * @route   GET /admin/users/:userId
 * @desc    Get a single user's details
 * @access  Admin only
 */
adminRouter.get('/users/:userId', getUserById);

/**
 * @route   PATCH /admin/users/:userId/block
 * @desc    Block a user
 * @access  Admin only
 */
adminRouter.patch('/users/:userId/block', blockUser);

/**
 * @route   PATCH /admin/users/:userId/unblock
 * @desc    Unblock a user
 * @access  Admin only
 */
adminRouter.patch('/users/:userId/unblock', unblockUser);

/**
 * @route   DELETE /admin/users/:userId
 * @desc    Delete a user and all their content
 * @access  Admin only
 */
adminRouter.delete('/users/:userId', deleteUser);

/**
 * @route   PATCH /admin/users/:userId/role
 * @desc    Update a user's role
 * @access  Admin only
 * @body    role
 */
adminRouter.patch('/users/:userId/role', updateUserRole);

// =============================================================================
// POST MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   GET /admin/posts
 * @desc    List all posts with search, filtering, and pagination
 * @access  Admin only
 * @query   search, author, community, startDate, endDate, page, limit
 */
adminRouter.get('/posts', listPosts);

/**
 * @route   DELETE /admin/posts/:postId
 * @desc    Delete a post and its comments
 * @access  Admin only
 */
adminRouter.delete('/posts/:postId', deletePost);

// =============================================================================
// COMMENT MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   GET /admin/comments
 * @desc    List all comments with search, filtering, and pagination
 * @access  Admin only
 * @query   search, author, post, startDate, endDate, page, limit
 */
adminRouter.get('/comments', listComments);

/**
 * @route   DELETE /admin/comments/:commentId
 * @desc    Delete a comment and its replies
 * @access  Admin only
 */
adminRouter.delete('/comments/:commentId', deleteComment);

// =============================================================================
// COMMUNITY MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   GET /admin/communities
 * @desc    List all communities with search, filtering, and pagination
 * @access  Admin only
 * @query   search, owner, startDate, endDate, page, limit
 */
adminRouter.get('/communities', listCommunities);

/**
 * @route   DELETE /admin/communities/:communityId
 * @desc    Delete a community and all its content
 * @access  Admin only
 */
adminRouter.delete('/communities/:communityId', deleteCommunity);

module.exports = adminRouter;
