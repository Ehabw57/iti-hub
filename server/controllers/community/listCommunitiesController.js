const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');

/**
 * List communities with pagination, search, and filtering
 * GET /communities
 * @route GET /communities
 * @access Public (optional auth for isJoined status)
 */
async function listCommunities(req, res) {
  try {
    const { page = 1, limit = 10, search, tags } = req.query;
    const userId = req.user?._id;

    // Parse and validate pagination parameters
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    
    const pageNum = (parsedPage && parsedPage > 0) ? parsedPage : 1;
    const limitNum = (parsedLimit && parsedLimit > 0) ? Math.min(100, parsedLimit) : 10; // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Search by name (case-insensitive)
    if (search && typeof search === 'string' && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by tags
    if (tags) {
      let tagArray = [];
      
      if (Array.isArray(tags)) {
        tagArray = tags;
      } else if (typeof tags === 'string') {
        // Handle comma-separated string
        tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }

      if (tagArray.length > 0) {
        query.tags = { $in: tagArray };
      }
    }

    // Execute query with pagination
    const [communities, total] = await Promise.all([
      Community.find(query)
        .sort({ memberCount: -1 }) // Sort by popularity (member count descending)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Community.countDocuments(query)
    ]);

    // Get user's joined communities if authenticated
    let joinedCommunityIds = new Set();
    if (userId) {
      const memberships = await CommunityMember.find({ user: userId })
        .select('community')
        .lean();
      joinedCommunityIds = new Set(memberships.map(m => m.community.toString()));
    }

    // Format response with isJoined flag
    const formattedCommunities = communities.map(community => ({
      _id: community._id.toString(),
      name: community.name,
      description: community.description,
      profilePicture: community.profilePicture || null,
      coverImage: community.coverImage || null,
      tags: community.tags,
      memberCount: community.memberCount,
      postCount: community.postCount,
      createdAt: community.createdAt,
      isJoined: joinedCommunityIds.has(community._id.toString())
    }));

    return res.status(200).json({
      success: true,
      data: {
        communities: formattedCommunities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error listing communities:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while listing communities'
    });
  }
}

module.exports = listCommunities;
