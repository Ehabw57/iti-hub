const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { SEED_COMMENTS, SEED_REPLIES } = require("./data/seedData");
const { getRandomDateAfter, weightedRandom, getRandomItems } = require("./utils/seedHelpers");

// Flatten all comment categories into one array
const COMMENT_CONTENTS = Object.values(SEED_COMMENTS).flat();
const REPLY_CONTENTS = SEED_REPLIES;

/**
 * Seed realistic comments with proper timestamps and engagement patterns
 * @param {Array} posts - Array of post documents (with createdAt)
 * @param {Array} users - Array of user documents
 * @returns {Promise<Array>} - Created comments
 */
const seedComments = async (posts, users) => {
  console.log("💬 Seeding comments...");

  await Comment.deleteMany({});

  const allComments = [];
  const commentBulkOps = [];
  let totalComments = 0;

  // Sort posts by date for realistic comment timing
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  for (const post of sortedPosts) {
    // Skip reposts - they don't get direct comments
    if (post.originalPost) continue;

    // Weighted comment count: older posts tend to have more comments
    const postAge = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60 * 24); // days
    const baseCommentCount = weightedRandom([
      { value: 0, weight: 0.1 },      // 10% - no comments
      { value: 1, weight: 0.15 },     // 15% - 1 comment
      { value: 2, weight: 0.2 },      // 20% - 2 comments
      { value: 3, weight: 0.2 },      // 20% - 3 comments
      { value: 4, weight: 0.15 },     // 15% - 4 comments
      { value: 5, weight: 0.1 },      // 10% - 5 comments
      { value: 7, weight: 0.07 },     // 7%  - 7 comments (popular)
      { value: 10, weight: 0.03 },    // 3%  - 10 comments (very popular)
    ]);
    
    // Adjust for post age - older posts have higher chance of more comments
    const commentsCount = Math.min(
      baseCommentCount + Math.floor(postAge / 10),
      15 // max 15 comments per post
    );
    
    if (commentsCount === 0) continue;

    const postComments = [];
    let lastCommentTime = new Date(post.createdAt);

    // Create top-level comments
    for (let i = 0; i < commentsCount; i++) {
      // Select a random user (not the post author for variety)
      const eligibleUsers = users.filter(u => 
        u._id.toString() !== post.author.toString()
      );
      const user = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)] || 
                   users[Math.floor(Math.random() * users.length)];

      // Comment time should be after post creation, spread out
      const minHoursAfter = 0.5 + (i * 2); // Space comments apart
      const maxHoursAfter = minHoursAfter + 48; // Within 2 days of each other
      const commentTime = getRandomDateAfter(lastCommentTime, minHoursAfter, maxHoursAfter);
      lastCommentTime = commentTime;

      // Pick realistic comment content
      const content = COMMENT_CONTENTS[Math.floor(Math.random() * COMMENT_CONTENTS.length)];

      const comment = {
        author: user._id,
        post: post._id,
        content,
        likesCount: 0,
        repliesCount: 0,
        createdAt: commentTime,
        updatedAt: commentTime,
      };

      postComments.push(comment);
      totalComments++;
    }

    // Insert top-level comments
    const createdComments = await Comment.insertMany(postComments);
    allComments.push(...createdComments);

    // Create replies to some comments (50% chance per comment)
    for (const parentComment of createdComments) {
      if (Math.random() > 0.5) continue;

      const repliesCount = weightedRandom([
        { value: 1, weight: 0.5 },    // 50% - 1 reply
        { value: 2, weight: 0.3 },    // 30% - 2 replies
        { value: 3, weight: 0.15 },   // 15% - 3 replies
        { value: 4, weight: 0.05 },   // 5%  - 4 replies
      ]);

      let lastReplyTime = new Date(parentComment.createdAt);
      const replies = [];

      for (let j = 0; j < repliesCount; j++) {
        // Get random user (can include original commenter for back-and-forth)
        const user = users[Math.floor(Math.random() * users.length)];
        
        // Reply time after parent comment
        const replyTime = getRandomDateAfter(lastReplyTime, 0.25, 24);
        lastReplyTime = replyTime;

        // Pick realistic reply content
        const content = REPLY_CONTENTS[Math.floor(Math.random() * REPLY_CONTENTS.length)];

        replies.push({
          author: user._id,
          post: post._id,
          content,
          parentComment: parentComment._id,
          likesCount: 0,
          repliesCount: 0,
          createdAt: replyTime,
          updatedAt: replyTime,
        });

        totalComments++;
      }

      if (replies.length > 0) {
        const createdReplies = await Comment.insertMany(replies);
        allComments.push(...createdReplies);

        // Update parent comment's repliesCount
        await Comment.findByIdAndUpdate(parentComment._id, {
          repliesCount: replies.length,
        });
      }
    }

    // Update post's commentsCount
    const postCommentsTotal = allComments.filter(
      c => c.post.toString() === post._id.toString()
    ).length;
    
    commentBulkOps.push({
      updateOne: {
        filter: { _id: post._id },
        update: { commentsCount: postCommentsTotal },
      },
    });
  }

  // Bulk update post comment counts
  if (commentBulkOps.length > 0) {
    await Post.bulkWrite(commentBulkOps);
  }

  console.log(`✅ Comments seeded: ${totalComments}`);
  return allComments;
};

module.exports = seedComments;
