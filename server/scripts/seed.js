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

// add import for communities seeder
const seedCommunities = require("./seedCommunities");
const seedCommunityMembers = require("./seedCommunityMembers");

async function seed() {
  try {
    console.log("🚀 Starting database seeding...");

    // 1️⃣ connect to DB
    await mongoose.connect(process.env.DB_URI || "mongodb://localhost:27017/iti-hub");
    console.log("✅ MongoDB connected");

    // 2️⃣ seed users
    const users = await seedUsers();

    // 3️⃣ seed connections (follows and blocks)
    await seedConnections(users);

    // 3.1️⃣ seed communities (profiles & covers similar to post images)
    const communities = await seedCommunities(users);

    // 3.2️⃣ seed community members (ensure each user joins at least 9 communities)
    await seedCommunityMembers(users, communities);

    // ⏭️ الخطوات الجاية (هنفعلها واحدة واحدة)
    const posts = await seedPosts(users);
    const comments = await seedComments(posts, users); 
    await seedCommentLikes(users, comments);
    await seedPostLikes(posts, users);
    await seedNotifications(users, posts, comments);

    console.log("🎉 Database seeding completed successfully");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    // 3️⃣ close connection
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    process.exit();
  }
}

seed();
