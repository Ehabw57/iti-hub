const Connection = require("../models/Connection");

async function seedConnections(users) {
  console.log("🌱 Seeding connections...");

  // Clear existing connections
  await Connection.deleteMany();

  if (!users || users.length < 2) {
    console.log("⚠️ Not enough users to create connections");
    return [];
  }

  const connections = [];
  const totalUsers = users.length;

  // Create follow connections - each user follows 5-15 random users
  for (let i = 0; i < totalUsers; i++) {
    const follower = users[i];
    const followCount = Math.floor(Math.random() * 11) + 5; // 5-15 follows
    const potentialFollowing = users.filter(u => u._id.toString() !== follower._id.toString());
    
    // Shuffle and take random users to follow
    const shuffled = potentialFollowing.sort(() => 0.5 - Math.random());
    const toFollow = shuffled.slice(0, Math.min(followCount, potentialFollowing.length));

    for (const following of toFollow) {
      try {
        const connection = await Connection.createFollow(follower._id, following._id);
        connections.push(connection);
      } catch (error) {
        console.error(`Error creating follow: ${follower.username} -> ${following.username}`, error.message);
      }
    }
  }

  console.log(`✅ Follow connections seeded: ${connections.length}`);

  // Create some block relationships (5-10 random blocks)
  const blockCount = Math.min(10, Math.floor(totalUsers / 5));
  const blockedConnections = [];

  for (let i = 0; i < blockCount; i++) {
    const blocker = users[Math.floor(Math.random() * totalUsers)];
    const blocked = users[Math.floor(Math.random() * totalUsers)];

    // Ensure not blocking self
    if (blocker._id.toString() !== blocked._id.toString()) {
      try {
        const blockConnection = await Connection.createBlock(blocker._id, blocked._id);
        blockedConnections.push(blockConnection);
      } catch (error) {
        console.error(`Error creating block: ${blocker.username} -> ${blocked.username}`, error.message);
      }
    }
  }

  console.log(`✅ Block connections seeded: ${blockedConnections.length}`);
  console.log(`✅ Total connections seeded: ${connections.length + blockedConnections.length}`);

  return [...connections, ...blockedConnections];
}

module.exports = seedConnections;
