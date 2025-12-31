const User = require('../../models/User');
const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const Connection = require('../../models/Connection');
const { validateSearchQuery } = require('../../utils/searchHelpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Fast search for users and communities (instant dropdown)
 * GET /api/v1/search/fast?q=query
 * Returns up to 5 users and 5 communities matching the query
 */
const fastSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user?._id;

  // Validate search query
  let searchQuery;
  try {
    searchQuery = validateSearchQuery(q);
  } catch (error) {
    throw new ValidationError(error.message);
  }

  // Users: search by username, then fullName, exclude blocked
  let userFilter = {
    $or: [
      { username: { $regex: searchQuery, $options: 'i' } },
      { fullName: { $regex: searchQuery, $options: 'i' } }
    ]
  };
  let blockedUserIds = [];
  if (currentUserId) {
    const blockConnections = await Connection.find({
      $or: [
        { follower: currentUserId, type: 'block' },
        { following: currentUserId, type: 'block' }
      ]
    }).select('follower following');
    blockedUserIds = blockConnections.map(conn => {
      return conn.follower.toString() === currentUserId.toString()
        ? conn.following.toString()
        : conn.follower.toString();
    });
    if (blockedUserIds.length > 0) {
      userFilter._id = { $nin: blockedUserIds };
    }
  }
  const userFields = ['_id', 'username', 'fullName', 'profilePicture'].join(' ');
  // First, find by username, then by fullName (excluding duplicates)
  const usersByUsername = await User.find({
    username: { $regex: searchQuery, $options: 'i' },
    ...(userFilter._id ? { _id: userFilter._id } : {})
  })
    .select(userFields)
    .collation({ locale: 'en', strength: 2 })
    .sort({ username: 1 })
    .limit(5);
  const usernamesFound = usersByUsername.map(u => u._id.toString());
  const usersByFullName = await User.find({
    fullName: { $regex: searchQuery, $options: 'i' },
    ...(userFilter._id ? { _id: userFilter._id } : {}),
    _id: { $nin: usernamesFound }
  })
    .select(userFields)
    .collation({ locale: 'en', strength: 2 })
    .sort({ username: 1 })
    .limit(5 - usersByUsername.length);
  const users = [...usersByUsername, ...usersByFullName];

  // Communities: search by name, then description
  const communitiesByName = await Community.find({
    name: { $regex: searchQuery, $options: 'i' }
  })
    .select('_id name memberCount profilePicture')
    .sort({ memberCount: -1 })
    .limit(5);
  const communityIdsFound = communitiesByName.map(c => c._id.toString());
  const communitiesByDescription = await Community.find({
    description: { $regex: searchQuery, $options: 'i' },
    _id: { $nin: communityIdsFound }
  })
    .select('_id name memberCount profilePicture')
    .sort({ memberCount: -1 })
    .limit(5 - communitiesByName.length);
  const communities = [...communitiesByName, ...communitiesByDescription];

  // Add isFollowing/isMember metadata if authenticated
  let usersWithMeta = users;
  if (currentUserId) {
    usersWithMeta = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      const followConnection = await Connection.findOne({
        follower: currentUserId,
        following: user._id,
        type: 'follow'
      });
      userObj.isFollowing = !!followConnection;
      return userObj;
    }));
  }
  let communitiesWithMeta = communities;
  if (currentUserId) {
    communitiesWithMeta = await Promise.all(communities.map(async (community) => {
      const communityObj = community.toObject();
      const membership = await CommunityMember.findOne({
        community: community._id,
        user: currentUserId
      });
      communityObj.isMember = !!membership;
      return communityObj;
    }));
  }

  sendSuccess(res, {
    users: usersWithMeta,
    communities: communitiesWithMeta
  });
});

module.exports = { fastSearch };
