const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');

/**
 * Check if a user is a member of a community
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} communityId - Community ID
 * @returns {Promise<boolean>} True if user is a member
 */
async function isMember(userId, communityId) {
  return await CommunityMember.isEnrolled(userId, communityId);
}

/**
 * Check if a user can moderate a community (owner or moderator)
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} communityId - Community ID
 * @returns {Promise<boolean>} True if user can moderate
 */
async function canModerate(userId, communityId) {
  const community = await Community.findById(communityId);
  if (!community) {
    return false;
  }
  
  return community.isModerator(userId);
}

/**
 * Check if a user can post to a community (must be a member)
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} communityId - Community ID
 * @returns {Promise<boolean>} True if user can post
 */
async function canPostToCommunity(userId, communityId) {
  return await isMember(userId, communityId);
}

/**
 * Update community member count
 * @param {string|ObjectId} communityId - Community ID
 * @param {number} delta - Amount to change (positive or negative)
 * @returns {Promise<void>}
 */
async function updateMemberCount(communityId, delta) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new Error('Community not found');
  }

  const newCount = Math.max(0, community.memberCount + delta);
  community.memberCount = newCount;
  await community.save();
}

/**
 * Update community post count
 * @param {string|ObjectId} communityId - Community ID
 * @param {number} delta - Amount to change (positive or negative)
 * @returns {Promise<void>}
 */
async function updatePostCount(communityId, delta) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new Error('Community not found');
  }

  const newCount = Math.max(0, community.postCount + delta);
  community.postCount = newCount;
  await community.save();
}

/**
 * Add or remove a user from the community moderators list
 * @param {string|ObjectId} communityId - Community ID
 * @param {string|ObjectId} userId - User ID
 * @param {string} action - 'add' or 'remove'
 * @returns {Promise<void>}
 */
async function updateModeratorList(communityId, userId, action) {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new Error('Community not found');
  }

  const userIdString = userId.toString();
  
  // Check if user is an owner - owners cannot be removed from moderators
  const isOwner = community.isOwner(userId);
  
  if (action === 'add') {
    // Add to moderators array if not already present
    if (!community.moderators.some(id => id.toString() === userIdString)) {
      community.moderators.push(userId);
      await community.save();
    }
    
    // Update CommunityMember role
    await CommunityMember.findOneAndUpdate(
      { user: userId, community: communityId },
      { role: 'moderator' }
    );
  } else if (action === 'remove') {
    // Don't remove owners from moderators
    if (isOwner) {
      return;
    }
    
    // Remove from moderators array
    community.moderators = community.moderators.filter(
      id => id.toString() !== userIdString
    );
    await community.save();
    
    // Update CommunityMember role back to member
    await CommunityMember.findOneAndUpdate(
      { user: userId, community: communityId },
      { role: 'member' }
    );
  }
}

module.exports = {
  isMember,
  canModerate,
  canPostToCommunity,
  updateMemberCount,
  updatePostCount,
  updateModeratorList
};
