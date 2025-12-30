// server/scripts/seedCommunityMembers.js
const CommunityMember = require("../models/CommunityMember");

/**
 * Seed community members: owners, moderators, and random members
 * @param {Array} users - Array of user documents
 * @param {Array} communities - Array of community documents (with owners, moderators, memberCount)
 * @returns {Promise<Array>} - Array of created CommunityMember docs
 */
module.exports = async function seedCommunityMembers(users = [], communities = []) {
  try {
    console.log("🔹 Seeding community members...");
    await CommunityMember.deleteMany();
    if (!Array.isArray(users) || !Array.isArray(communities)) return [];
    const enrollments = [];
    for (const community of communities) {
      const communityId = community._id;
      // Owners
      if (Array.isArray(community.owners)) {
        for (const ownerId of community.owners) {
          enrollments.push({
            user: ownerId,
            community: communityId,
            role: "owner"
          });
        }
      }
      // Moderators
      if (Array.isArray(community.moderators)) {
        for (const modId of community.moderators) {
          // Avoid duplicate owner/moderator
          if (!community.owners || !community.owners.find(o => String(o) === String(modId))) {
            enrollments.push({
              user: modId,
              community: communityId,
              role: "moderator"
            });
          }
        }
      }
      // Members (fill up to memberCount)
      const already = new Set([
        ...(community.owners || []).map(String),
        ...(community.moderators || []).map(String)
      ]);
      const needed = Math.max(0, (community.memberCount || 0) - already.size);
      if (needed > 0 && users.length > 0) {
        // Pick random users not already owner/moderator
        const pool = users.map(u => u._id).filter(id => !already.has(String(id)));
        for (let i = 0; i < Math.min(needed, pool.length); i++) {
          enrollments.push({
            user: pool[i],
            community: communityId,
            role: "member"
          });
        }
      }
    }
    const created = await CommunityMember.insertMany(enrollments);
    console.log(`✅ Seeded ${created.length} community members`);
    return created;
  } catch (err) {
    console.error("❌ Error seeding community members:", err);
    return [];
  }
};
