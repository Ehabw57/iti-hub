const CommentLike = require("../models/CommentLike");
const Comment = require("../models/Comment");
const User = require("../models/User");

async function seedCommentLikes(users, comments) {
  console.log("❤️ Seeding comment likes...");

  // نمسح اللايكات القديمة
  await CommentLike.deleteMany();

  const likes = [];

  for (const comment of comments) {
    // عدد لايكات عشوائي لكل كومنت (0 → 10)
    const likesCount = Math.floor(Math.random() * 11);

    // نختار users عشوائيين
    const shuffledUsers = users.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, likesCount);

    for (const user of selectedUsers) {
      likes.push({
        user: user._id,
        comment: comment._id,
      });
    }

    // نحدّث likesCount الحقيقي على الكومنت
    await Comment.findByIdAndUpdate(comment._id, {
      likesCount: selectedUsers.length,
    });
  }

  if (likes.length > 0) {
    await CommentLike.insertMany(likes, { ordered: false });
  }

  console.log(`✅ Comment likes seeded: ${likes.length}`);
}

module.exports = seedCommentLikes;
