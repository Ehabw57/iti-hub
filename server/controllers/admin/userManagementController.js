/**
 * Admin User Management Controller
 * Provides user listing, blocking, deleting, and role management for admins
 */
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const Connection = require('../../models/Connection');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * GET /admin/users
 * List all users with search, filtering, and pagination
 */
const listUsers = async (req, res, next) => {
  try {
    const {
      search,
      role,
      isBlocked,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100);

    // Execute query
    const [users, totalItems] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(maxLimit),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / maxLimit);

    return sendSuccess(res, {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: maxLimit,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/users/:userId
 * Get detailed user information
 */
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/users/:userId/block
 * Block a user
 */
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent blocking self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BLOCK_SELF',
          message: 'You cannot block yourself'
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isBlocked: true,
      },
      { new: true, select: '-password -resetPasswordToken -resetPasswordExpires' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    return sendSuccess(res, user, 'User blocked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/users/:userId/unblock
 * Unblock a user
 */
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isBlocked: false,
        blockReason: null
      },
      { new: true, select: '-password -resetPasswordToken -resetPasswordExpires' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    return sendSuccess(res, user, 'User unblocked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/users/:userId
 * Delete a user and all associated content
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'You cannot delete your own account'
        }
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Delete associated content
    const [deletedPosts, deletedComments, deletedCommunities, deletedMemberships, deletedConnections] = await Promise.all([
      Post.deleteMany({ author: userId }),
      Comment.deleteMany({ author: userId }),
      Community.deleteMany({ owners: userId, 'owners.1': { $exists: false } }), // Only if sole owner
      CommunityMember.deleteMany({ user: userId }),
      Connection.deleteMany({ $or: [{ follower: userId }, { following: userId }] })
    ]);

    // Delete user
    await user.deleteOne();

    return sendSuccess(res, {
      deletedUser: userId,
      deletedPosts: deletedPosts.deletedCount,
      deletedComments: deletedComments.deletedCount,
      deletedCommunities: deletedCommunities.deletedCount,
      deletedMemberships: deletedMemberships.deletedCount,
      deletedConnections: deletedConnections.deletedCount
    }, 'User and all associated content deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/users/:userId/role
 * Change user role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be either "user" or "admin"'
        }
      });
    }

    // Prevent changing own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CHANGE_OWN_ROLE',
          message: 'You cannot change your own role'
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password -resetPasswordToken -resetPasswordExpires' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    return sendSuccess(res, user, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
  updateUserRole
};
