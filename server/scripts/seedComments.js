const Comment = require("../models/Comment");
const Post = require("../models/Post");

const sampleComments = [
  "Great post 👏",
  "Very helpful, thanks!",
  "I totally agree with you",
  "Nice explanation 🔥",
  "This is interesting",
  "Good point!",
  "Well said 💯",
];

const seedComments = async (posts, users) => {
  console.log("💬 Seeding comments...");

  await Comment.deleteMany();

  const allComments = [];
  let totalComments = 0;

  for (const post of posts) {
    const commentsCount = Math.floor(Math.random() * 5) + 2;
    let postTotalComments = 0;

    const postComments = [];

    // 💬 comments
    for (let i = 0; i < commentsCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];

      const comment = await Comment.create({
        author: user._id,
        post: post._id,
        content:
          sampleComments[Math.floor(Math.random() * sampleComments.length)],
      });

      postComments.push(comment);
      allComments.push(comment);
      postTotalComments++;
      totalComments++;
    }

    // 🔁 replies (level واحد بس – مطابق للاسكيما)
    for (const parentComment of postComments) {
      if (Math.random() > 0.5) {
        const repliesCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < repliesCount; i++) {
          const user = users[Math.floor(Math.random() * users.length)];

          const reply = await Comment.create({
            author: user._id,
            post: post._id,
            content: "Reply 👍",
            parentComment: parentComment._id,
          });

          parentComment.repliesCount += 1;
          allComments.push(reply);
          postTotalComments++;
          totalComments++;
        }

        await parentComment.save();
      }
    }

    // ✅ تحديث عدد الكومنتات الحقيقي على البوست
    await Post.findByIdAndUpdate(post._id, {
      commentsCount: postTotalComments,
    });
  }

  console.log(`✅ Comments seeded: ${totalComments}`);
  return allComments; 
};

module.exports = seedComments;
