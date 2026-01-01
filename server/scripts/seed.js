const mongoose = require("mongoose");
require("dotenv").config();

// seed functions
const seedUsers = require("./seedUsers");
const seedConnections = require("./seedConnections");
const seedPosts = require("./seedPosts");
const seedPostLikes = require("./seedPostLikes");
const seedComments = require("./seedComments");
const seedCommentLikes = require("./seedCommentLike");
const seedNotifications = require("./seedNotifications");
const seedCommunities = require("./seedCommunities");
const seedCommunityMembers = require("./seedCommunityMembers");
const seedMessages = require("./seedMessages");

async function seed() {
  try {
    console.log("🚀 Starting database seeding...\n");
    const startTime = Date.now();

    // 1️⃣ Connect to DB
    await mongoose.connect(process.env.DB_URI || "mongodb://localhost:27017/iti-hub");
    console.log("✅ MongoDB connected\n");

    // 2️⃣ Seed users
    const users = await seedUsers();
    console.log("");

    // 3️⃣ Seed connections (follows and blocks)
    const connections = await seedConnections(users);
    console.log("");

    // 4️⃣ Seed communities
    const communities = await seedCommunities(users);
    console.log("");

    // 5️⃣ Seed community members
    await seedCommunityMembers(users, communities);
    console.log("");

    // 6️⃣ Seed posts (pass communities so posts can be assigned to them)
    const posts = await seedPosts(users, communities);
    console.log("");

    // 7️⃣ Seed comments
    const comments = await seedComments(posts, users);
    console.log("");

    // 8️⃣ Seed likes
    const postLikes = await seedPostLikes(posts, users);
    console.log("");

    const commentLikes = await seedCommentLikes(users, comments);
    console.log("");

    // 9️⃣ Seed messages (between connected users)
    await seedMessages(users, connections);
    console.log("");

    // 🔟 Seed notifications (based on actual data)
    await seedNotifications(users, posts, comments, postLikes, commentLikes, connections);
    console.log("");

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("═".repeat(50));
    console.log(`🎉 Database seeding completed in ${duration}s`);
    console.log("═".repeat(50));
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    process.exit();
  }
}

seed();
