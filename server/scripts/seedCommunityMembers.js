// server/scripts/seedCommunityMembers.js
const CommunityMember = require("../models/CommunityMember");

/**
 * Seed community members: owners, moderators, and random members
 * Ensures each user joins at least 9 communities
 * @param {Array} users - Array of user documents
 * @param {Array} communities - Array of community documents (with owners, moderators, memberCount)
 * @returns {Promise<Array>} - Array of created CommunityMember docs
 */
module.exports = async function seedCommunityMembers(users = [], communities = []) {
  try {
    console.log("🔹 Seeding community members...");
    await CommunityMember.deleteMany();
    
    if (!Array.isArray(users) || !Array.isArray(communities)) return [];
    if (users.length === 0 || communities.length === 0) return [];

    const enrollments = [];
    const userCommunityCount = new Map(); // Track how many communities each user joined

    // Initialize user community count
    users.forEach(user => {
      userCommunityCount.set(user._id.toString(), 0);
    });

    // Step 1: Add owners and moderators
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
          const userIdStr = ownerId.toString();
          userCommunityCount.set(userIdStr, (userCommunityCount.get(userIdStr) || 0) + 1);
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
            const userIdStr = modId.toString();
            userCommunityCount.set(userIdStr, (userCommunityCount.get(userIdStr) || 0) + 1);
          }
        }
      }
    }

    // Step 2: Ensure each user joins at least 9 communities
    const minCommunitiesPerUser = 9;
    
    for (const user of users) {
      const userIdStr = user._id.toString();
      const currentCount = userCommunityCount.get(userIdStr) || 0;
      
      if (currentCount < minCommunitiesPerUser) {
        // Find communities this user hasn't joined yet
        const joinedCommunities = new Set(
          enrollments
            .filter(e => e.user.toString() === userIdStr)
            .map(e => e.community.toString())
        );
        
        const availableCommunities = communities.filter(
          c => !joinedCommunities.has(c._id.toString())
        );
        
        // Randomly select communities to join
        const needed = minCommunitiesPerUser - currentCount;
        const shuffled = availableCommunities.sort(() => 0.5 - Math.random());
        const toJoin = shuffled.slice(0, Math.min(needed, shuffled.length));
        
        for (const community of toJoin) {
          enrollments.push({
            user: user._id,
            community: community._id,
            role: "member"
          });
          userCommunityCount.set(userIdStr, (userCommunityCount.get(userIdStr) || 0) + 1);
        }
      }
    }

    // Step 3: Fill up communities to their memberCount
    for (const community of communities) {
      const communityId = community._id;
      const communityIdStr = communityId.toString();
      
      // Count current members in this community
      const currentMembers = enrollments.filter(
        e => e.community.toString() === communityIdStr
      ).length;
      
      const needed = Math.max(0, (community.memberCount || 0) - currentMembers);
      
      if (needed > 0 && users.length > 0) {
        // Find users not yet in this community
        const joinedUserIds = new Set(
          enrollments
            .filter(e => e.community.toString() === communityIdStr)
            .map(e => e.user.toString())
        );
        
        const pool = users
          .filter(u => !joinedUserIds.has(u._id.toString()))
          .map(u => u._id);
        
        // Randomly select users to fill the community
        const shuffled = pool.sort(() => 0.5 - Math.random());
        const toAdd = shuffled.slice(0, Math.min(needed, shuffled.length));
        
        for (const userId of toAdd) {
          enrollments.push({
            user: userId,
            community: communityId,
            role: "member"
          });
          const userIdStr = userId.toString();
          userCommunityCount.set(userIdStr, (userCommunityCount.get(userIdStr) || 0) + 1);
        }
      }
    }

    const created = await CommunityMember.insertMany(enrollments);
    
    // Log statistics
    console.log(`✅ Seeded ${created.length} community members`);
    console.log(`📊 User community statistics:`);
    userCommunityCount.forEach((count, userId) => {
      if (count < minCommunitiesPerUser) {
        console.log(`   ⚠️  User ${userId} joined ${count} communities (less than ${minCommunitiesPerUser})`);
      }
    });
    
    return created;
  } catch (err) {
    console.error("❌ Error seeding community members:", err);
    return [];
  }
};
