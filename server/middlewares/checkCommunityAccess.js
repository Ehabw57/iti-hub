const CommunityMember = require('../models/CommunityMember');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

/**
 * Middleware to check if user is a moderator or owner of a community
 * Requires checkAuth middleware to be run first
 */
const checkModeratorAccess = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const communityId = req.params.id || req.params.communityId;

    if (!communityId) {
      throw new NotFoundError('Community ID is required');
    }

    // Check user's role in the community
    const membership = await CommunityMember.findOne({
      user: userId,
      community: communityId
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this community');
    }

    // Check if user is moderator or owner
    if (membership.role !== 'moderator' && membership.role !== 'owner') {
      throw new ForbiddenError('You do not have moderator permissions for this community');
    }

    // Attach role to request for use in controllers
    req.communityRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is an owner of a community
 * Requires checkAuth middleware to be run first
 */
const checkOwnerAccess = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const communityId = req.params.id || req.params.communityId;

    if (!communityId) {
      throw new NotFoundError('Community ID is required');
    }

    // Check user's role in the community
    const membership = await CommunityMember.findOne({
      user: userId,
      community: communityId
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this community');
    }

    // Check if user is owner
    if (membership.role !== 'owner') {
      throw new ForbiddenError('You do not have owner permissions for this community');
    }

    // Attach role to request for use in controllers
    req.communityRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkModeratorAccess,
  checkOwnerAccess
};
