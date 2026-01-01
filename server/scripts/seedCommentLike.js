const CommentLike = require("../models/CommentLike");
const Comment = require("../models/Comment");
const { weightedRandom, getRandomDateAfter } = require("./utils/seedHelpers");

/**
 * Seed comment likes with realistic distribution
 * Quality comments and top-level comments get more likes
 * @param {Array} users - Array of user documents
 * @param {Array} comments - Array of comment documents
 * @returns {Promise<Array>} - Created likes
 */
async function seedCommentLikes(users, comments) {
  console.log("💜 Seeding comment likes...");

  await CommentLike.deleteMany();

  const likes = [];
  const commentBulkOps = [];

  // Power users are more likely to like comments
  const powerUsers = users.slice(0, Math.min(10, users.length));

  for (const comment of comments) {
    // Top-level comments get more likes than replies
    const isReply = !!comment.parentComment;
    
    // Calculate comment age
    const commentAge = (Date.now() - new Date(comment.createdAt)) / (1000 * 60 * 60 * 24);
    
    // Base like count based on comment type
    let baseLikes;
    if (isReply) {
      // Replies typically get fewer likes
      baseLikes = weightedRandom([
        { value: 0, weight: 0.5 },      // 50% - no likes
        { value: 1, weight: 0.25 },     // 25% - 1 like
        { value: 2, weight: 0.15 },     // 15% - 2 likes
        { value: 3, weight: 0.07 },     // 7%  - 3 likes
        { value: 5, weight: 0.03 },     // 3%  - 5 likes
      ]);
    } else {
      // Top-level comments have more engagement
      baseLikes = weightedRandom([
        { value: 0, weight: 0.25 },     // 25% - no likes
        { value: 1, weight: 0.2 },      // 20% - 1 like
        { value: 2, weight: 0.2 },      // 20% - 2 likes
        { value: 3, weight: 0.15 },     // 15% - 3 likes
        { value: 5, weight: 0.1 },      // 10% - 5 likes
        { value: 8, weight: 0.06 },     // 6%  - 8 likes (good comment)
        { value: 12, weight: 0.03 },    // 3%  - 12 likes (great comment)
        { value: 15, weight: 0.01 },    // 1%  - 15 likes (excellent comment)
      ]);
    }

    // Older comments have had more time to accumulate likes
    const ageMultiplier = Math.min(1 + (commentAge / 20), 1.5);
    
    const targetLikes = Math.min(
      Math.floor(baseLikes * ageMultiplier),
      users.length - 1
    );

    if (targetLikes === 0) {
      commentBulkOps.push({
        updateOne: {
          filter: { _id: comment._id },
          update: { likesCount: 0 },
        },
      });
      continue;
    }

    // Build weighted user pool
    const userPool = [];
    for (let i = 0; i < users.length; i++) {
      // Skip if user is the comment author
      if (users[i]._id.toString() === comment.author.toString()) continue;
      
      let weight;
      if (i < 5) {
        weight = 3; // Power users - 3x more likely
      } else if (i < 15) {
        weight = 2; // Active users - 2x more likely
      } else {
        weight = 1; // Regular users
      }
      
      for (let w = 0; w < weight; w++) {
        userPool.push(users[i]);
      }
    }

    // Select unique users to like this comment
    const shuffled = userPool.sort(() => 0.5 - Math.random());
    const likedUsers = new Set();
    const commentLikes = [];

    for (const user of shuffled) {
      if (likedUsers.has(user._id.toString())) continue;
      likedUsers.add(user._id.toString());
      
      // Like timestamp is after comment creation
      const likeTime = getRandomDateAfter(new Date(comment.createdAt), 0.25, 48);
      
      commentLikes.push({
        user: user._id,
        comment: comment._id,
        createdAt: likeTime,
        updatedAt: likeTime,
      });
      
      if (commentLikes.length >= targetLikes) break;
    }

    likes.push(...commentLikes);

    // Update comment's like count
    commentBulkOps.push({
      updateOne: {
        filter: { _id: comment._id },
        update: { likesCount: commentLikes.length },
      },
    });
  }

  // Bulk insert likes
  if (likes.length > 0) {
    await CommentLike.insertMany(likes, { ordered: false });
  }

  // Bulk update comments
  if (commentBulkOps.length > 0) {
    await Comment.bulkWrite(commentBulkOps);
  }

  console.log(`✅ Comment likes seeded: ${likes.length}`);
  return likes;
}

module.exports = seedCommentLikes;
