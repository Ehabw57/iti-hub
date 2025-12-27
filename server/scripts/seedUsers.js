const User = require("../models/User");

async function seedUsers() {
  console.log("🌱 Seeding users...");

  // اختياري: امسحي كل اليوزرز
  await User.deleteMany();

  // 👑 Admin ثابت
  const admin = await User.create({
    username: "admin",
    email: "admin@iti-hub.com",
    password: "Admin123!",
    fullName: "System Admin",
    role: "admin",
  });

  const users = [admin];

  // 👤 49 users عاديين
  for (let i = 1; i <= 49; i++) {
    const user = await User.create({
      username: `user${i}`,
      email: `user${i}@test.com`,
      password: "User123!",
      fullName: `Test User ${i}`,
      bio: "I am a test user",
    });

    users.push(user);
  }

  console.log("✅ Users seeded:", users.length);
  return users;
}

module.exports = seedUsers;
