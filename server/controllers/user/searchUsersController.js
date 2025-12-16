const User = require('../../models/User');
const Connection = require('../../models/Connection');
const { validateSearchQuery, parseSearchPagination } = require('../../utils/searchHelpers');
const { SENSITIVE_USER_FIELDS } = require('../../utils/constants');

/**
 * Search Users
 * GET /search/users?q=query&specialization=value&page=1&limit=20
 * 
 * Search for users by username, full name, or bio
 * Optional authentication provides additional metadata (isFollowing)
 * Blocked users are excluded from results when authenticated
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function searchUsers(req, res) {
  try {
    const { q, specialization, page, limit } = req.query;
    const currentUserId = req.user?._id;

    // Validate search query
    let searchQuery;
    try {
      searchQuery = validateSearchQuery(q);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Parse pagination
    const { page: currentPage, limit: pageLimit, skip } = parseSearchPagination(page, limit);

    // Build search filter
    const filter = {
      $text: { $search: searchQuery }
    };

    // Add specialization filter if provided
    if (specialization && typeof specialization === 'string' && specialization.trim()) {
      filter.specialization = specialization.trim();
    }

    // Get blocked user IDs if authenticated
    let blockedUserIds = [];
    if (currentUserId) {
      const blockConnections = await Connection.find({
        $or: [
          { follower: currentUserId, type: 'block' },
          { following: currentUserId, type: 'block' }
        ]
      }).select('follower following');

      blockedUserIds = blockConnections.map(conn => {
        // Get the other user's ID (not the current user)
        return conn.follower.toString() === currentUserId.toString()
          ? conn.following.toString()
          : conn.follower.toString();
      });

      // Exclude blocked users from search results
      if (blockedUserIds.length > 0) {
        filter._id = { $nin: blockedUserIds };
      }
    }

    // Select fields (exclude sensitive data)
    const selectFields = [
      '_id',
      'username',
      'fullName',
      'profilePicture',
      'bio',
      'specialization',
      'followersCount',
      'followingCount'
    ].join(' ');

    // Search users with text search
    const users = await User.find(filter)
      .select(selectFields)
      .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
      .sort({ username: 1 }) // Alphabetical order
      .skip(skip)
      .limit(pageLimit);

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Add isFollowing field if authenticated
    let resultsWithMetadata = users;
    if (currentUserId) {
      resultsWithMetadata = await Promise.all(
        users.map(async (user) => {
          const userObj = user.toObject();
          
          // Check if current user follows this user
          const followConnection = await Connection.findOne({
            follower: currentUserId,
            following: user._id,
            type: 'follow'
          });

          userObj.isFollowing = !!followConnection;
          return userObj;
        })
      );
    }

    // Calculate pagination metadata
    const pages = Math.ceil(total / pageLimit);

    return res.status(200).json({
      success: true,
      users: resultsWithMetadata,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = searchUsers;
