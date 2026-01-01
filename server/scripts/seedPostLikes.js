const PostLike = require("../models/PostLike");
const Post = require("../models/Post");
const { weightedRandom, getRandomDateAfter } = require("./utils/seedHelpers");

/**
 * Seed post likes with realistic distribution
 * Popular posts get more likes, newer posts get fewer
 * @param {Array} posts - Array of post documents
 * @param {Array} users - Array of user documents
 * @returns {Promise<Array>} - Created likes
 */
async function seedPostLikes(posts, users) {
  console.log("❤️  Seeding post likes...");

  await PostLike.deleteMany();

  const likes = [];
  const postBulkOps = [];

  // Sort posts by creation date (older posts tend to have more engagement)
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Power users (first 10) are more likely to like posts
  const powerUsers = users.slice(0, Math.min(10, users.length));
  const activeUsers = users.slice(0, Math.min(25, users.length));

  for (const post of sortedPosts) {
    // Skip reposts - they typically get fewer direct likes
    const isRepost = !!post.originalPost;
    
    // Calculate post age in days
    const postAge = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60 * 24);
    
    // Base like count based on post type and content quality simulation
    let baseLikes;
    if (isRepost) {
      baseLikes = weightedRandom([
        { value: 0, weight: 0.4 },
        { value: 1, weight: 0.3 },
        { value: 2, weight: 0.2 },
        { value: 3, weight: 0.1 },
      ]);
    } else {
      // Regular posts have varied engagement
      baseLikes = weightedRandom([
        { value: 0, weight: 0.1 },      // 10% - no likes
        { value: 1, weight: 0.15 },     // 15% - 1 like
        { value: 2, weight: 0.15 },     // 15% - 2 likes
        { value: 3, weight: 0.15 },     // 15% - 3 likes
        { value: 5, weight: 0.15 },     // 15% - 5 likes
        { value: 8, weight: 0.12 },     // 12% - 8 likes
        { value: 12, weight: 0.08 },    // 8%  - 12 likes (popular)
        { value: 18, weight: 0.05 },    // 5%  - 18 likes (very popular)
        { value: 25, weight: 0.03 },    // 3%  - 25 likes (viral)
        { value: 35, weight: 0.02 },    // 2%  - 35 likes (highly viral)
      ]);
    }

    // Older posts have had more time to accumulate likes
    const ageMultiplier = Math.min(1 + (postAge / 30), 2); // Up to 2x for 30+ day old posts
    
    // Author's popularity affects engagement (first 10 authors are "influencers")
    const authorIdx = users.findIndex(u => u._id.toString() === post.author.toString());
    const authorMultiplier = authorIdx < 5 ? 1.5 : (authorIdx < 15 ? 1.2 : 1);

    const targetLikes = Math.min(
      Math.floor(baseLikes * ageMultiplier * authorMultiplier),
      users.length - 1 // Can't have more likes than users
    );

    if (targetLikes === 0) {
      postBulkOps.push({
        updateOne: {
          filter: { _id: post._id },
          update: { likesCount: 0 },
        },
      });
      continue;
    }

    // Build weighted user pool - power users like more content
    const userPool = [];
    for (let i = 0; i < users.length; i++) {
      // Skip if user is the post author
      if (users[i]._id.toString() === post.author.toString()) continue;
      
      let weight;
      if (i < 5) {
        weight = 4; // Power users - 4x more likely to like
      } else if (i < 15) {
        weight = 2; // Active users - 2x more likely
      } else {
        weight = 1; // Regular users
      }
      
      for (let w = 0; w < weight; w++) {
        userPool.push(users[i]);
      }
    }

    // Select unique users to like this post
    const shuffled = userPool.sort(() => 0.5 - Math.random());
    const likedUsers = new Set();
    const postLikes = [];

    for (const user of shuffled) {
      if (likedUsers.has(user._id.toString())) continue;
      likedUsers.add(user._id.toString());
      
      // Like timestamp is after post creation
      const likeTime = getRandomDateAfter(new Date(post.createdAt), 0.5, 72);
      
      postLikes.push({
        user: user._id,
        post: post._id,
        createdAt: likeTime,
        updatedAt: likeTime,
      });
      
      if (postLikes.length >= targetLikes) break;
    }

    likes.push(...postLikes);

    // Update post's like count
    postBulkOps.push({
      updateOne: {
        filter: { _id: post._id },
        update: { likesCount: postLikes.length },
      },
    });
  }

  // Bulk insert likes
  if (likes.length > 0) {
    await PostLike.insertMany(likes, { ordered: false });
  }

  // Bulk update posts
  if (postBulkOps.length > 0) {
    await Post.bulkWrite(postBulkOps);
  }

  console.log(`✅ Post likes seeded: ${likes.length}`);
  return likes;
}

module.exports = seedPostLikes;
