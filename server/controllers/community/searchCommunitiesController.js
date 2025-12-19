/**
 * Search Communities Controller
 * Epic 9: Search - T106
 * Handles searching for communities with text search, filtering, and pagination
 */
const Community = require("../../models/Community");
const CommunityMember = require("../../models/CommunityMember");
const {
  validateSearchQuery,
  sanitizeSearchQuery,
  buildSearchFilter,
  parseSearchPagination,
} = require("../../utils/searchHelpers");
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/responseHelpers');

/**
 * Search communities by name, description, or tags
 * @route GET /api/v1/search/communities?q=<query>&tags=<tags>&page=<page>&limit=<limit>
 * @access Public (with optional authentication for isMember metadata)
 */
const searchCommunities = asyncHandler(async (req, res) => {
  const { q, tags, page, limit } = req.query;

  // Validate search query
  const trimmedQuery = q?.trim();
  if (!trimmedQuery) {
    throw new ValidationError('Search query is required');
  }

  try {
    validateSearchQuery(trimmedQuery);
  } catch (error) {
    throw new ValidationError(error.message);
  }

  // Build search filter
  const searchQuery = sanitizeSearchQuery(trimmedQuery);
  const filter = buildSearchFilter(searchQuery);

  // Add tags filter if provided
  if (tags) {
    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    if (tagsArray.length > 0) {
      filter.tags = { $in: tagsArray };
    }
  }

  // Parse pagination
  const { page: currentPage, limit: pageLimit } = parseSearchPagination(
    page,
    limit
  );
  const skip = (currentPage - 1) * pageLimit;

  // Execute search sorted by memberCount (most popular first)
  const communities = await Community.find(filter)
    .select("-__v")
    .sort({ memberCount: -1 }) // Sort by member count descending
    .limit(pageLimit)
    .skip(skip);

  // Get total count for pagination
  const total = await Community.countDocuments(filter);
  const pages = Math.ceil(total / pageLimit);

  // Add isMember metadata for authenticated users
  let communitiesData = communities;
  if (req.user) {
    const communitiesWithMetadata = await Promise.all(
      communities.map(async (community) => {
        const communityObj = community.toObject();

        // Check if user is a member
        const membership = await CommunityMember.findOne({
          community: community._id,
          user: req.user._id,
        });

        return {
          ...communityObj,
          isMember: !!membership,
        };
      })
    );
    communitiesData = communitiesWithMetadata;
  }

  sendSuccess(res, {
    communities: communitiesData,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      pages,
      hasNextPage: currentPage < pages,
      hasPrevPage: currentPage > 1
    }
  });
});

module.exports = searchCommunities;
