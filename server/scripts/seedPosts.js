const Post = require("../models/Post");
const User = require("../models/User");

const sampleContents = [
  "First post on the platform 🚀",
  "Learning Node.js and MongoDB",
  "This platform looks promising!",
  "Backend seeding is actually fun 😄",
  "Testing posts feature",
  "Hello world from ITI Hub",
  "MongoDB relations working perfectly",
  "Express + Mongoose combo 💪",
];

const seedPosts = async (users) => {
  console.log("📝 Seeding posts...");

  await Post.deleteMany();

  const posts = [];

  for (const user of users) {
    const postsPerUser = Math.floor(Math.random() * 3) + 1; // 1–3 بوستات

    for (let i = 0; i < postsPerUser; i++) {
      posts.push({
        author: user._id, // ✔ real user
        content:
          sampleContents[
            Math.floor(Math.random() * sampleContents.length)
          ],
        images:
          Math.random() > 0.7
            ? [`https://picsum.photos/seed/${user._id}-${i}/600/400`]
            : [],
        tags: [],
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        savesCount: 0,
      });
    }
  }

  const createdPosts = await Post.insertMany(posts);

  // تحديث postsCount لكل يوزر
  const bulkUpdates = users.map((user) => {
    const count = createdPosts.filter(
      (p) => p.author.toString() === user._id.toString()
    ).length;

    return {
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { postsCount: count } },
      },
    };
  });

  await User.bulkWrite(bulkUpdates);

  console.log(`✅ Posts seeded: ${createdPosts.length}`);
  return createdPosts;
};

module.exports = seedPosts;
