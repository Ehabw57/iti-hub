const Community = require("../models/Community");
const { COMMUNITY_TAGS, MIN_COMMUNITY_TAGS, MAX_COMMUNITY_TAGS } = require("../utils/constants");

// Generate profile picture using picsum.photos (similar to seedPosts.js)
function makeProfilePicture(communityId, index) {
  return `https://picsum.photos/seed/community-profile-${communityId}-${index}/400/400`;
}

// Generate cover image using picsum.photos
function makeCoverImage(communityId, index) {
  return `https://picsum.photos/seed/community-cover-${communityId}-${index}/1200/400`;
}

function pickTags() {
  const count = Math.min(
    Math.max(MIN_COMMUNITY_TAGS, Math.floor(Math.random() * (MAX_COMMUNITY_TAGS + 1))),
    MAX_COMMUNITY_TAGS
  );
  const shuffled = COMMUNITY_TAGS.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function pickRandomUserIds(users, count, excludeIds = new Set()) {
  const pool = users
    .map(u => u._id)
    .filter(id => !excludeIds.has(String(id)));
  const picked = new Set();
  while (picked.size < Math.min(count, pool.length)) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    picked.add(String(candidate));
  }
  return Array.from(picked).map(idStr => users.find(u => String(u._id) === idStr)._id);
}

module.exports = async function seedCommunities(users = []) {
  try {
    console.log("🔹 Seeding communities...");

    await Community.deleteMany();

    if (!Array.isArray(users)) users = [];

    const total = 24;
    const topics = COMMUNITY_TAGS.length ? COMMUNITY_TAGS.slice() : [
      "general","engineering","design","devops","backend","frontend","mobile","ai","data","security"
    ];

    const communities = [];

    for (let i = 0; i < total; i++) {
      const topic = topics[i % topics.length];
      const name = `${topic.charAt(0).toUpperCase() + topic.slice(1)} Community ${i + 1}`;
      const description = `A community about ${topic} — community number ${i + 1}.`;

      const ownersCount = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
      const owners = users.length ? pickRandomUserIds(users, ownersCount) : [];

      const moderatorsCount = users.length ? Math.floor(Math.random() * 5) : 0;
      const exclude = new Set(owners.map(o => String(o)));
      const moderators = users.length ? pickRandomUserIds(users, moderatorsCount, exclude) : [];

      let memberCount = 0;
      if (users.length) {
        const minMembers = Math.max(owners.length + moderators.length, 1);
        const maxMembers = Math.min(users.length, Math.floor(Math.random() * 20) + minMembers);
        memberCount = Math.max(minMembers, maxMembers);
      } else {
        memberCount = Math.floor(Math.random() * 50) + 1;
      }

      const postCount = Math.floor(Math.random() * 100);
      const tags = pickTags();

      const community = {
        name,
        description,
        profilePicture: makeProfilePicture(i, Math.floor(Math.random() * 1000)),
        coverImage: makeCoverImage(i, Math.floor(Math.random() * 1000)),
        tags,
        memberCount,
        postCount,
        owners: owners.length ? owners : (users[0] ? [users[0]._id] : []),
        moderators
      };

      if (!community.owners || community.owners.length === 0) {
        if (users[0]) community.owners = [users[0]._id];
        else community.owners = [];
      }

      communities.push(community);
    }

    const created = await Community.insertMany(communities);
    console.log(`✅ Seeded ${created.length} communities`);
    return created;
  } catch (err) {
    console.error("❌ Error seeding communities:", err);
    return [];
  }
};