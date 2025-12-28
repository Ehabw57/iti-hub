const User = require("../models/User");
const fs = require("fs");
const path = require("path");

async function seedUsers() {
  console.log("🌱 Seeding users...");

  // قراءة الصور من ملف images.txt
  const imagesPath = path.join(__dirname, "profilePictures.txt");
  const imagesContent = fs.readFileSync(imagesPath, "utf-8");
  const images = imagesContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

    for (const image of images) {
      console.log(`📸 Loaded profile picture: ${image}`);
    }

  // دالة لاختيار صورة عشوائية
  const getRandomImage = () => {
    return images[Math.floor(Math.random() * images.length)];
  };

  // اختياري: امسحي كل اليوزرز
  await User.deleteMany();

  // 👑 Admin ثابت
  const admin = await User.create({
    username: "admin",
    email: "admin@iti-hub.com",
    password: "Admin123!",
    fullName: "System Admin",
    role: "admin",
    profilePicture: getRandomImage(),
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
      profilePicture: getRandomImage(),
    });

    users.push(user);
  }

  console.log("✅ Users seeded:", users.length);
  return users;
}

module.exports = seedUsers;
