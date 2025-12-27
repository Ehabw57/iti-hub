const PostLike = require("../models/PostLike");
const Post = require("../models/Post");

async function seedPostLikes(posts, users) {
  console.log("❤️ Seeding post likes...");

  await PostLike.deleteMany();

  const likes = [];

  for (const post of posts) {
    const likesCount = Math.floor(Math.random() * 21);

    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, likesCount);

    for (const user of selectedUsers) {
      likes.push({
        user: user._id,
        post: post._id,
      });
    }

    // ✅ هنا المكان الصح
    await Post.findByIdAndUpdate(post._id, {
      likesCount: selectedUsers.length,
    });
  }

  if (likes.length) {
    await PostLike.insertMany(likes, { ordered: false });
  }

  console.log(`✅ Post likes seeded: ${likes.length}`);
}

module.exports = seedPostLikes;
