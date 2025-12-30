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

    // ⏭️ الخطوات الجاية (هنفعلها واحدة واحدة)
    const posts = await seedPosts(users);
    const comments = await seedComments(posts, users); 
    await seedCommentLikes(users, comments);
    await seedPostLikes(posts, users);
    await seedNotifications(users, posts, comments);
    await seedCommunities(users);

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
