const Notification = require("../models/Notification");
const { NOTIFICATION_TYPES } = require("../utils/constants");

/**
 * Seed notifications with proper grouping logic
 * Creates realistic notification scenarios including:
 * - Likes on posts (grouped by post)
 * - Comments on posts (grouped by post)
 * - Replies to comments (grouped by post)
 * - Likes on comments (grouped by comment)
 * - Reposts (individual)
 * - Follows (individual)
 */
async function seedNotifications(users, posts = [], comments = []) {
  console.log("🔔 Seeding notifications...");

  // Clear existing notifications
  await Notification.deleteMany();
  console.log("   🗑️  Cleared old notifications");

  const notifications = [];
  let notificationCount = 0;

  // Helper function to get random item from array
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Helper function to get random users (different from excluded)
  const getRandomUsers = (count, excludeId) => {
    const filtered = users.filter(u => !u._id.equals(excludeId));
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, filtered.length));
  };

  console.log("   📝 Creating notification scenarios...");

  // ===================================
  // 1️⃣ POST LIKES (Groupable by post)
  // ===================================
  console.log("   💗 Seeding post likes...");
  const postsToLike = posts.slice(0, Math.min(30, posts.length)); // Like first 30 posts

  for (const post of postsToLike) {
    const likersCount = Math.floor(Math.random() * 5) + 1; // 1-5 likers
    const likers = getRandomUsers(likersCount, post.author);

    for (let i = 0; i < likers.length; i++) {
      const liker = likers[i];
      
      // Simulate time progression (earlier likers have older timestamps)
      const createdAt = new Date(Date.now() - (likersCount - i) * 3600000); // 1 hour apart
      const updatedAt = i === 0 ? new Date() : createdAt; // Latest like has current time

      notifications.push({
        recipient: post.author,
        actor: liker._id,
        actorCount: i + 1, // Accumulate count
        type: NOTIFICATION_TYPES.LIKE,
        target: post._id,
        targetModel: 'Post',
        groupingKey: post._id, // Group by post
        isRead: Math.random() > 0.7, // 30% read
        createdAt: i === 0 ? createdAt : notifications[notifications.length - 1]?.createdAt || createdAt,
        updatedAt: updatedAt
      });
      
      notificationCount++;
      
      // Only keep the last notification (simulating grouping)
      if (i < likers.length - 1) {
        notifications.pop();
        notificationCount--;
      }
    }
  }

  // ===================================
  // 2️⃣ POST COMMENTS (Groupable by post)
  // ===================================
  console.log("   💬 Seeding post comments...");
  
  // Get top-level comments only (no replies)
  const topLevelComments = comments.filter(c => !c.parentComment);
  const postsWithComments = {};
  
  // Group comments by post
  topLevelComments.forEach(comment => {
    const postId = comment.post.toString();
    if (!postsWithComments[postId]) {
      postsWithComments[postId] = [];
    }
    postsWithComments[postId].push(comment);
  });

  // Create grouped comment notifications
  for (const [postId, postComments] of Object.entries(postsWithComments)) {
    const post = posts.find(p => p._id.toString() === postId);
    if (!post) continue;

    // Take up to 5 comments for this post
    const selectedComments = postComments.slice(0, Math.min(5, postComments.length));
    
    for (let i = 0; i < selectedComments.length; i++) {
      const comment = selectedComments[i];
      
      // Skip if commenter is the post author
      if (comment.author.equals(post.author)) continue;

      const createdAt = new Date(Date.now() - (selectedComments.length - i) * 7200000); // 2 hours apart
      const updatedAt = i === 0 ? new Date() : createdAt;

      notifications.push({
        recipient: post.author,
        actor: comment.author,
        actorCount: i + 1,
        type: NOTIFICATION_TYPES.COMMENT,
        target: comment._id, // Navigate to the comment
        targetModel: 'Comment',
        groupingKey: post._id, // Group by post
        isRead: Math.random() > 0.6,
        createdAt: i === 0 ? createdAt : notifications[notifications.length - 1]?.createdAt || createdAt,
        updatedAt: updatedAt
      });
      
      notificationCount++;
      
      // Only keep the last notification (simulating grouping)
      if (i < selectedComments.length - 1) {
        notifications.pop();
        notificationCount--;
      }
    }
  }

  // ===================================
  // 3️⃣ REPLIES (Groupable by post)
  // ===================================
  console.log("   🔁 Seeding replies...");
  
  const replies = comments.filter(c => c.parentComment);
  const repliesByPost = {};
  
  // Group replies by post
  replies.forEach(reply => {
    const postId = reply.post.toString();
    if (!repliesByPost[postId]) {
      repliesByPost[postId] = [];
    }
    repliesByPost[postId].push(reply);
  });

  // Create grouped reply notifications
  for (const [postId, postReplies] of Object.entries(repliesByPost)) {
    const post = posts.find(p => p._id.toString() === postId);
    if (!post) continue;

    const selectedReplies = postReplies.slice(0, Math.min(4, postReplies.length));
    
    for (let i = 0; i < selectedReplies.length; i++) {
      const reply = selectedReplies[i];
      const parentComment = comments.find(c => c._id.equals(reply.parentComment));
      if (!parentComment) continue;

      // Skip if replier is the parent comment author
      if (reply.author.equals(parentComment.author)) continue;

      const createdAt = new Date(Date.now() - (selectedReplies.length - i) * 5400000); // 1.5 hours apart
      const updatedAt = i === 0 ? new Date() : createdAt;

      notifications.push({
        recipient: parentComment.author,
        actor: reply.author,
        actorCount: i + 1,
        type: NOTIFICATION_TYPES.REPLY,
        target: parentComment._id, // Navigate to parent comment
        targetModel: 'Comment',
        groupingKey: post._id, // Group by post
        isRead: Math.random() > 0.5,
        createdAt: i === 0 ? createdAt : notifications[notifications.length - 1]?.createdAt || createdAt,
        updatedAt: updatedAt
      });
      
      notificationCount++;
      
      // Only keep the last notification (simulating grouping)
      if (i < selectedReplies.length - 1) {
        notifications.pop();
        notificationCount--;
      }
    }
  }

  // ===================================
  // 4️⃣ COMMENT LIKES (Groupable by comment)
  // ===================================
  console.log("   ❤️  Seeding comment likes...");
  
  const commentsToLike = topLevelComments.slice(0, Math.min(20, topLevelComments.length));
  
  for (const comment of commentsToLike) {
    const likersCount = Math.floor(Math.random() * 4) + 1; // 1-4 likers
    const likers = getRandomUsers(likersCount, comment.author);

    for (let i = 0; i < likers.length; i++) {
      const liker = likers[i];
      
      const createdAt = new Date(Date.now() - (likersCount - i) * 3600000);
      const updatedAt = i === 0 ? new Date() : createdAt;

      notifications.push({
        recipient: comment.author,
        actor: liker._id,
        actorCount: i + 1,
        type: NOTIFICATION_TYPES.COMMENT_LIKE,
        target: comment._id,
        targetModel: 'Comment',
        groupingKey: comment._id, // Group by comment (not post)
        isRead: Math.random() > 0.6,
        createdAt: i === 0 ? createdAt : notifications[notifications.length - 1]?.createdAt || createdAt,
        updatedAt: updatedAt
      });
      
      notificationCount++;
      
      // Only keep the last notification (simulating grouping)
      if (i < likers.length - 1) {
        notifications.pop();
        notificationCount--;
      }
    }
  }

  // ===================================
  // 5️⃣ REPOSTS (Individual - not grouped)
  // ===================================
  console.log("   🔄 Seeding reposts...");
  
  const postsToRepost = posts.slice(0, Math.min(15, posts.length));
  
  for (const post of postsToRepost) {
    const reposter = getRandom(users.filter(u => !u._id.equals(post.author)));
    
    // For reposts, target would be the repost itself, but we don't have repost IDs
    // So we'll use the original post as target
    notifications.push({
      recipient: post.author,
      actor: reposter._id,
      actorCount: 1, // Individual notification
      type: NOTIFICATION_TYPES.REPOST,
      target: post._id,
      targetModel: 'Post',
      groupingKey: post._id, // Each repost is individual
      isRead: Math.random() > 0.7,
    });
    
    notificationCount++;
  }

  // ===================================
  // 6️⃣ FOLLOWS (Individual - not grouped)
  // ===================================
  console.log("   👥 Seeding follows...");
  
  // Each user gets followed by 2-5 random users
  for (const user of users.slice(0, Math.min(20, users.length))) {
    const followersCount = Math.floor(Math.random() * 4) + 2; // 2-5 followers
    const followers = getRandomUsers(followersCount, user._id);

    for (const follower of followers) {
      notifications.push({
        recipient: user._id,
        actor: follower._id,
        actorCount: 1, // Individual notification
        type: NOTIFICATION_TYPES.FOLLOW,
        target: null, // No target for follow
        targetModel: undefined,
        groupingKey: null, // No grouping for follows
        isRead: Math.random() > 0.6,
      });
      
      notificationCount++;
    }
  }

  // ===================================
  // 💾 Insert all notifications
  // ===================================
  console.log("   💾 Inserting notifications into database...");
  
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // ===================================
  // 📊 Statistics
  // ===================================
  console.log("\n   📊 Notification Statistics:");
  const stats = {
    [NOTIFICATION_TYPES.LIKE]: notifications.filter(n => n.type === NOTIFICATION_TYPES.LIKE).length,
    [NOTIFICATION_TYPES.COMMENT]: notifications.filter(n => n.type === NOTIFICATION_TYPES.COMMENT).length,
    [NOTIFICATION_TYPES.REPLY]: notifications.filter(n => n.type === NOTIFICATION_TYPES.REPLY).length,
    [NOTIFICATION_TYPES.COMMENT_LIKE]: notifications.filter(n => n.type === NOTIFICATION_TYPES.COMMENT_LIKE).length,
    [NOTIFICATION_TYPES.REPOST]: notifications.filter(n => n.type === NOTIFICATION_TYPES.REPOST).length,
    [NOTIFICATION_TYPES.FOLLOW]: notifications.filter(n => n.type === NOTIFICATION_TYPES.FOLLOW).length,
  };

  console.log(`      - Likes: ${stats[NOTIFICATION_TYPES.LIKE]}`);
  console.log(`      - Comments: ${stats[NOTIFICATION_TYPES.COMMENT]}`);
  console.log(`      - Replies: ${stats[NOTIFICATION_TYPES.REPLY]}`);
  console.log(`      - Comment Likes: ${stats[NOTIFICATION_TYPES.COMMENT_LIKE]}`);
  console.log(`      - Reposts: ${stats[NOTIFICATION_TYPES.REPOST]}`);
  console.log(`      - Follows: ${stats[NOTIFICATION_TYPES.FOLLOW]}`);
  console.log(`      - Total: ${notifications.length}`);
  console.log(`      - Unread: ${notifications.filter(n => !n.isRead).length}`);

  console.log(`✅ Notifications seeded successfully!`);
  
  return notifications;
}

module.exports = seedNotifications;
