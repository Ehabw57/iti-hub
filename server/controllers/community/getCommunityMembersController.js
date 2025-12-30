const mongoose = require('mongoose');
const CommunityMember = require('../../models/CommunityMember');
const Community = require('../../models/Community');
const { sendSuccess } = require('../../utils/responseHelpers');
const { NotFoundError } = require('../../utils/errors');

/**
 * Get community members with pagination
 * @route GET /api/communities/:id/members
 * @access Public (optional auth for role info)
 */
const getCommunityMembers = async (req, res) => {
  const { id: communityId } = req.params;
  const { 
    page = 1, 
    limit = 20, 
    role, // Filter by role: 'owner', 'moderator', 'member'
    search // Search by name or username
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  // Check if community exists
  const community = await Community.findById(communityId);
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Build base query
  const baseQuery = { community: new mongoose.Types.ObjectId(communityId) };
  if (role) {
    baseQuery.role = role;
  }

  // Simple approach: Use populate with search
  let membersQuery = CommunityMember.find(baseQuery)
    .populate({
      path: 'user',
      select: 'username fullName profilePicture email'
    })
    .sort({ createdAt: -1 });

  // Get all members first (for search filtering)
  let allMembers = await membersQuery.lean();

  // Filter by search if provided
  if (search) {
    const searchLower = search.toLowerCase();
    allMembers = allMembers.filter(member => {
      const user = member.user;
      if (!user) return false;
      const fullName = (user.fullName || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      return fullName.includes(searchLower) || username.includes(searchLower);
    });
  }

  // Calculate total after search filter
  const total = allMembers.length;
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  // Apply pagination
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedMembers = allMembers.slice(startIndex, startIndex + limitNum);

  // Format response
  const members = paginatedMembers.map(m => ({
    _id: m.user?._id,
    username: m.user?.username,
    fullName: m.user?.fullName,
    profilePicture: m.user?.profilePicture,
    email: m.user?.email,
    role: m.role,
    joinedAt: m.createdAt
  })).filter(m => m._id); // Filter out members with deleted users

  sendSuccess(res, {
    members,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
};

module.exports = getCommunityMembers;
