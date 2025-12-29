const CommunityMember = require("../../models/CommunityMember");
const { sendSuccess } = require("../../utils/responseHelpers");
const { InternalError } = require("../../utils/errors");

/**
 * Controller to get communities the authenticated user has joined.
 * Expects req.user to be populated (e.g. by authentication middleware).
 */
module.exports = async function getUserCommunities(req, res, next) {
  try {
    // Simple pagination
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit || "50", 10))
    );
    const skip = (page - 1) * limit;

    const [memberships, total] = await Promise.all([
      CommunityMember.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("community"),
      CommunityMember.countDocuments({ user: req.user._id }),
    ]);

    const communities = memberships.map((m) => ({
      community: m.community,
      role: m.role,
      joinedAt: m.createdAt,
    }));


    const totalPages = Math.ceil(total / limit);
    return sendSuccess(res, {
      communities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    // Wrap unexpected errors as InternalError so global handler formats them consistently
    if (err && err.isOperational) {
      return next(err);
    }
    const internal = new InternalError("Failed to fetch user communities");
    internal.details = err && err.message ? err.message : undefined;
    return next(internal);
  }
};
