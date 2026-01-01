/**
 * Seed Users - Creates realistic users with indexed pattern
 * user001, user002, ... with real names and proper profiles
 */

const User = require("../models/User");
const { SEED_USERS } = require("./data/seedData");
const { 
  formatUserNumber, 
  getRandomProfilePicture, 
  getRandomCoverImage,
  getRandomBoolean,
  getRandomDateInLastDays
} = require("./utils/seedHelpers");

const DEFAULT_PASSWORD = "User123!";

async function seedUsers() {
  console.log("🌱 Seeding users...");
  
  // Clear existing users
  await User.deleteMany({});
  
  const users = [];
  
  // 1. Create admin user
  const admin = await User.create({
    username: "admin",
    email: "admin@itihub.com",
    password: DEFAULT_PASSWORD,
    fullName: "System Administrator",
    role: "admin",
    bio: "Platform administrator. Keeping ITI Hub running smoothly.",
    profilePicture: getRandomProfilePicture(),
    coverImage: getRandomCoverImage(),
    specialization: "Platform Management",
    location: "Cairo, Egypt",
    isEmailVerified: true,
    isOnline: false,
    lastSeen: new Date(),
    createdAt: getRandomDateInLastDays(30, false),
    updatedAt: new Date()
  });
  users.push(admin);
  console.log("   ✅ Admin user created");
  
  // 2. Create regular users from seed data
  for (let i = 0; i < SEED_USERS.length; i++) {
    const userData = SEED_USERS[i];
    const userNumber = formatUserNumber(i + 1);
    const username = `user${userNumber}`;
    
    // Determine user activity level based on position
    // First 5: power users, next 15: regular, rest: casual
    const isPowerUser = i < 5;
    const isRegularUser = i >= 5 && i < 20;
    
    // Power users have older accounts
    const accountAge = isPowerUser ? 30 : isRegularUser ? 20 : 14;
    const createdAt = getRandomDateInLastDays(accountAge, false);
    
    const user = await User.create({
      username,
      email: `user${userNumber}@test.com`,
      password: DEFAULT_PASSWORD,
      fullName: `${userData.firstName} ${userData.lastName}`,
      bio: userData.bio,
      profilePicture: getRandomProfilePicture(),
      coverImage: getRandomBoolean(0.6) ? getRandomCoverImage() : null,
      specialization: userData.specialization,
      location: userData.location,
      role: "user",
      isEmailVerified: true,
      isOnline: false,
      lastSeen: getRandomDateInLastDays(3),
      // Initial counts will be updated by other seeders
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt,
      updatedAt: new Date()
    });
    
    users.push(user);
    
    if ((i + 1) % 10 === 0) {
      console.log(`   📝 Created ${i + 1}/${SEED_USERS.length} users`);
    }
  }
  
  console.log(`✅ Users seeded: ${users.length} total (1 admin + ${users.length - 1} users)`);
  console.log(`   🔐 Default password for all users: ${DEFAULT_PASSWORD}`);
  
  return users;
}

module.exports = seedUsers;
