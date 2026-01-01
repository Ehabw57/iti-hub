const Connection = require("../models/Connection");
const User = require("../models/User");
const { weightedRandom } = require("./utils/seedHelpers");

/**
 * Seed realistic follow relationships with power-law distribution
 * Popular users get more followers, active users follow more people
 * @param {Array} users - Array of user documents
 * @returns {Promise<Array>} - Created connections
 */
async function seedConnections(users) {
  console.log("🔗 Seeding connections...");

  await Connection.deleteMany();

  if (!users || users.length < 2) {
    console.log("⚠️  Not enough users to create connections");
    return [];
  }

  const connections = [];
  const userFollowerCounts = new Map(); // Track followers per user
  const userFollowingCounts = new Map(); // Track following per user

  // Initialize counts
  users.forEach(u => {
    userFollowerCounts.set(u._id.toString(), 0);
    userFollowingCounts.set(u._id.toString(), 0);
  });

  // Power users (first 5) should have more followers
  // Regular active users (6-20) have moderate following
  // Less active users (21+) follow fewer people

  const totalUsers = users.length;
  const powerUsers = users.slice(0, Math.min(5, totalUsers));
  const activeUsers = users.slice(0, Math.min(20, totalUsers));

  console.log("   📊 Creating follow relationships...");

  for (let i = 0; i < totalUsers; i++) {
    const follower = users[i];
    const followerIdx = i;

    // Determine how many people this user follows based on their "activity level"
    let followCount;
    if (followerIdx < 5) {
      // Power users follow 15-30 people
      followCount = weightedRandom([
        { value: 15, weight: 0.2 },
        { value: 20, weight: 0.3 },
        { value: 25, weight: 0.3 },
        { value: 30, weight: 0.2 },
      ]);
    } else if (followerIdx < 20) {
      // Active users follow 10-20 people
      followCount = weightedRandom([
        { value: 10, weight: 0.25 },
        { value: 15, weight: 0.35 },
        { value: 18, weight: 0.25 },
        { value: 20, weight: 0.15 },
      ]);
    } else {
      // Regular users follow 3-12 people
      followCount = weightedRandom([
        { value: 3, weight: 0.2 },
        { value: 5, weight: 0.3 },
        { value: 8, weight: 0.3 },
        { value: 12, weight: 0.2 },
      ]);
    }

    // Build a weighted pool - power users have higher chance of being followed
    const followPool = [];
    for (let j = 0; j < totalUsers; j++) {
      if (j === i) continue; // Can't follow self
      
      const potential = users[j];
      let weight;
      if (j < 5) {
        weight = 5; // Power users - 5x more likely
      } else if (j < 20) {
        weight = 2; // Active users - 2x more likely
      } else {
        weight = 1; // Regular users - base chance
      }
      
      for (let w = 0; w < weight; w++) {
        followPool.push(potential);
      }
    }

    // Shuffle and pick unique users to follow
    const shuffled = followPool.sort(() => 0.5 - Math.random());
    const followed = new Set();
    const toFollow = [];

    for (const user of shuffled) {
      if (followed.has(user._id.toString())) continue;
      followed.add(user._id.toString());
      toFollow.push(user);
      if (toFollow.length >= followCount) break;
    }

    // Create follow connections
    for (const following of toFollow) {
      try {
        const connection = await Connection.createFollow(follower._id, following._id);
        connections.push(connection);
        
        // Update counts for stats
        const followingId = following._id.toString();
        userFollowerCounts.set(followingId, (userFollowerCounts.get(followingId) || 0) + 1);
        
        const followerId = follower._id.toString();
        userFollowingCounts.set(followerId, (userFollowingCounts.get(followerId) || 0) + 1);
      } catch (error) {
        // Skip duplicates
        if (!error.message.includes('duplicate')) {
          console.error(`   ⚠️  Error: ${follower.username} -> ${following.username}`);
        }
      }
    }
  }

  console.log(`✅ Follow connections seeded: ${connections.length}`);

  // Create minimal block relationships (2-5 random blocks for realism)
  const blockCount = Math.min(5, Math.max(2, Math.floor(totalUsers / 10)));
  const blockedConnections = [];

  console.log("   🚫 Creating block relationships...");

  for (let i = 0; i < blockCount; i++) {
    // Less active users more likely to block (less engaged with community)
    const blockerIdx = Math.floor(Math.random() * totalUsers * 0.7) + Math.floor(totalUsers * 0.3);
    const blockedIdx = Math.floor(Math.random() * totalUsers);

    if (blockerIdx === blockedIdx || blockerIdx >= totalUsers) continue;

    const blocker = users[Math.min(blockerIdx, totalUsers - 1)];
    const blocked = users[blockedIdx];

    try {
      const blockConnection = await Connection.createBlock(blocker._id, blocked._id);
      blockedConnections.push(blockConnection);
    } catch (error) {
      // Skip errors
    }
  }

  console.log(`✅ Block connections seeded: ${blockedConnections.length}`);

  // Update user follower/following counts
  console.log("   📈 Updating user follow counts...");
  const bulkOps = [];
  
  users.forEach(user => {
    const userId = user._id.toString();
    bulkOps.push({
      updateOne: {
        filter: { _id: user._id },
        update: {
          followersCount: userFollowerCounts.get(userId) || 0,
          followingCount: userFollowingCounts.get(userId) || 0,
        },
      },
    });
  });

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps);
  }

  console.log(`✅ Total connections seeded: ${connections.length + blockedConnections.length}`);

  return [...connections, ...blockedConnections];
}

module.exports = seedConnections;
