const catchAsync = require('../../utils/catchAsync');
const CommunityMember = require('../../models/CommunityMember');
const Community = require('../../models/Community');
const { sendSuccess } = require('../../utils/responseHelpers');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

/**
 * Get community members with pagination
 * @route GET /api/communities/:id/members
 * @access Public (optional auth for role info)
 */
const getCommunityMembers = catchAsync(async (req, res) => {
  const { id: communityId } = req.params;
  const userId = req.user?._id;
  const { 
    page = 1, 
    limit = 20, 
    role, // Filter by role: 'owner', 'moderator', 'member'
    search // Search by name or username
  } = req.query;

  // Check if community exists
  const community = await Community.findById(communityId);
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Build query
  const query = { community: communityId };
  if (role) {
    query.role = role;
  }

  // Get total count for pagination
  const total = await CommunityMember.countDocuments(query);

  // Build aggregation pipeline
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    { $unwind: '$userDetails' },
    {
      $project: {
        _id: 1,
        role: 1,
        joinedAt: '$createdAt',
        user: {
          _id: '$userDetails._id',
          username: '$userDetails.username',
          fullName: '$userDetails.fullName',
          profilePicture: '$userDetails.profilePicture',
          email: '$userDetails.email'
        }
      }
    }
  ];

  // Add search filter if provided
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'user.fullName': { $regex: search, $options: 'i' } },
          { 'user.username': { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  // Add sorting and pagination
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) }
  );

  // Execute aggregation
  const members = await CommunityMember.aggregate(pipeline);

  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  sendSuccess(res, {
    members: members.map(m => ({
      _id: m.user._id,
      username: m.user.username,
      fullName: m.user.fullName,
      profilePicture: m.user.profilePicture,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
});

module.exports = getCommunityMembers;
