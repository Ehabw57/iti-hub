/**
 * Seed Posts - Creates realistic posts with proper timestamps and content
 * Posts are distributed across users with realistic engagement patterns
 */

const Post = require("../models/Post");
const User = require("../models/User");
const { SEED_POSTS } = require("./data/seedData");
const {
  getRandomItem,
  getRandomItems,
  getRandomInt,
  getRandomBoolean,
  getRandomDateInLastDays,
  getRandomPostImages,
  selectRandomUsers,
  shuffleArray
} = require("./utils/seedHelpers");

/**
 * Seed posts with realistic distribution
 * - Power users (first 5): 5-8 posts each
 * - Regular users (5-20): 2-4 posts each
 * - Casual users (20+): 0-2 posts each
 * - Some posts are in communities
 */
async function seedPosts(users, communities = []) {
  console.log("📝 Seeding posts...");
  
  await Post.deleteMany({});
  
  const posts = [];
  const postsData = shuffleArray([...SEED_POSTS]);
  let postIndex = 0;
  
  // Helper to get next post content (cycle if needed)
  const getNextPostContent = () => {
    const post = postsData[postIndex % postsData.length];
    postIndex++;
    return post;
  };
  
  // Track posts per user for counting
  const userPostCounts = new Map();
  
  // 1. Assign posts to power users (index 0-5, excluding admin at 0)
  console.log("   📊 Creating posts for power users...");
  for (let i = 1; i <= 5 && i < users.length; i++) {
    const user = users[i];
    const postCount = getRandomInt(5, 8);
    
    for (let j = 0; j < postCount; j++) {
      const postData = getNextPostContent();
      const createdAt = getRandomDateInLastDays(28, true);
      
      // 30% chance of posting to a community
      const community = communities.length > 0 && getRandomBoolean(0.3) 
        ? getRandomItem(communities)._id 
        : undefined;
      
      const post = await Post.create({
        author: user._id,
        content: postData.content,
        tags: postData.tags,
        images: getRandomPostImages(),
        community,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        savesCount: 0,
        createdAt,
        updatedAt: createdAt
      });
      
      posts.push(post);
    }
    
    userPostCounts.set(user._id.toString(), postCount);
  }
  
  // 2. Assign posts to regular users (index 6-20)
  console.log("   📊 Creating posts for regular users...");
  for (let i = 6; i <= 20 && i < users.length; i++) {
    const user = users[i];
    const postCount = getRandomInt(2, 4);
    
    for (let j = 0; j < postCount; j++) {
      const postData = getNextPostContent();
      const createdAt = getRandomDateInLastDays(21, true);
      
      const community = communities.length > 0 && getRandomBoolean(0.25) 
        ? getRandomItem(communities)._id 
        : undefined;
      
      const post = await Post.create({
        author: user._id,
        content: postData.content,
        tags: postData.tags,
        images: getRandomPostImages(),
        community,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        savesCount: 0,
        createdAt,
        updatedAt: createdAt
      });
      
      posts.push(post);
    }
    
    userPostCounts.set(user._id.toString(), postCount);
  }
  
  // 3. Assign posts to casual users (index 21+)
  console.log("   📊 Creating posts for casual users...");
  for (let i = 21; i < users.length; i++) {
    const user = users[i];
    const postCount = getRandomInt(0, 2);
    
    for (let j = 0; j < postCount; j++) {
      const postData = getNextPostContent();
      const createdAt = getRandomDateInLastDays(14, true);
      
      const community = communities.length > 0 && getRandomBoolean(0.2) 
        ? getRandomItem(communities)._id 
        : undefined;
      
      const post = await Post.create({
        author: user._id,
        content: postData.content,
        tags: postData.tags,
        images: getRandomPostImages(),
        community,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        savesCount: 0,
        createdAt,
        updatedAt: createdAt
      });
      
      posts.push(post);
    }
    
    if (postCount > 0) {
      userPostCounts.set(user._id.toString(), postCount);
    }
  }
  
  // 4. Create some reposts (10% of posts)
  console.log("   🔄 Creating reposts...");
  const repostCount = Math.ceil(posts.length * 0.1);
  const originalPosts = getRandomItems(posts, repostCount);
  
  for (const originalPost of originalPosts) {
    // Select a random user who isn't the author
    const reposters = selectRandomUsers(users, 1, [originalPost.author.toString()]);
    if (reposters.length === 0) continue;
    
    const reposter = reposters[0];
    const createdAt = getRandomDateInLastDays(7, true);
    
    const repost = await Post.create({
      author: reposter._id,
      originalPost: originalPost._id,
      repostComment: getRandomBoolean(0.6) ? `Great insight! ${getRandomItem(['🔥', '👏', '💯', '✨', ''])}` : undefined,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      savesCount: 0,
      createdAt,
      updatedAt: createdAt
    });
    
    // Update original post repost count
    await Post.findByIdAndUpdate(originalPost._id, { $inc: { repostsCount: 1 } });
    
    posts.push(repost);
  }
  
  // 5. Update user post counts
  console.log("   📈 Updating user post counts...");
  for (const [userId, count] of userPostCounts) {
    await User.findByIdAndUpdate(userId, { postsCount: count });
  }
  
  console.log(`✅ Posts seeded: ${posts.length} total (including ${repostCount} reposts)`);
  
  return posts;
}

module.exports = seedPosts;
