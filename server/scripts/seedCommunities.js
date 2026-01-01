const Community = require("../models/Community");
const { SEED_COMMUNITIES } = require("./data/seedData");
const { getRandomDate, weightedRandom, getRandomCommunityImage } = require("./utils/seedHelpers");

/**
 * Seed realistic communities with proper images and varied membership
 * @param {Array} users - Array of user documents
 * @returns {Promise<Array>} - Created communities
 */
module.exports = async function seedCommunities(users = []) {
  try {
    console.log("🏘️  Seeding communities...");

    await Community.deleteMany();

    if (!Array.isArray(users) || users.length === 0) {
      console.log("⚠️  No users provided, creating minimal communities");
    }

    const communities = [];
    const now = new Date();

    for (let i = 0; i < SEED_COMMUNITIES.length; i++) {
      const communityData = SEED_COMMUNITIES[i];
      
      // Community creation time (older communities = more established)
      const createdAt = getRandomDate(90, 365); // 3-12 months ago
      
      // Select owners (1-2 from first 10 users - more active users)
      const ownerPool = users.slice(0, Math.min(10, users.length));
      const ownersCount = weightedRandom([
        { value: 1, weight: 0.7 },
        { value: 2, weight: 0.3 },
      ]);
      const ownerIndices = new Set();
      while (ownerIndices.size < Math.min(ownersCount, ownerPool.length)) {
        ownerIndices.add(Math.floor(Math.random() * ownerPool.length));
      }
      const owners = Array.from(ownerIndices).map(idx => ownerPool[idx]._id);

      // Select moderators (0-3 from users, excluding owners)
      const modCandidates = users.filter(u => !owners.some(o => o.equals(u._id)));
      const modsCount = weightedRandom([
        { value: 0, weight: 0.3 },
        { value: 1, weight: 0.35 },
        { value: 2, weight: 0.25 },
        { value: 3, weight: 0.1 },
      ]);
      const modIndices = new Set();
      while (modIndices.size < Math.min(modsCount, modCandidates.length)) {
        modIndices.add(Math.floor(Math.random() * modCandidates.length));
      }
      const moderators = Array.from(modIndices).map(idx => modCandidates[idx]._id);

      // Member count based on community "age" and popularity
      const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const baseMemberCount = Math.floor(ageInDays / 5) + 10; // Older = more members
      const popularityMultiplier = weightedRandom([
        { value: 0.5, weight: 0.2 },   // 20% - low engagement
        { value: 1, weight: 0.4 },      // 40% - average
        { value: 1.5, weight: 0.25 },   // 25% - popular
        { value: 2, weight: 0.15 },     // 15% - very popular
      ]);
      const memberCount = Math.min(
        Math.floor(baseMemberCount * popularityMultiplier),
        users.length
      );

      // Post count will be updated by seedPosts after posts are created
      const postCount = 0;

      const community = {
        name: communityData.name,
        description: communityData.description,
        profilePicture: getRandomCommunityImage(),
        coverImage: getRandomCommunityImage(), // Different image for cover
        tags: communityData.tags,
        memberCount: Math.max(owners.length + moderators.length, memberCount),
        postCount,
        owners,
        moderators,
        createdAt,
        updatedAt: createdAt,
      };

      communities.push(community);
    }

    const created = await Community.insertMany(communities);
    console.log(`✅ Communities seeded: ${created.length}`);
    return created;
  } catch (err) {
    console.error("❌ Error seeding communities:", err);
    return [];
  }
};