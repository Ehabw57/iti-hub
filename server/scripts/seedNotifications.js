const Notification = require("../models/Notification");
const { NOTIFICATION_TYPES } = require("../utils/constants");
const { weightedRandom, getRandomDateAfter } = require("./utils/seedHelpers");

/**
 * Seed notifications based on actual seeded data
 * Creates realistic notifications from likes, comments, follows, etc.
 * @param {Array} users - User documents
 * @param {Array} posts - Post documents
 * @param {Array} comments - Comment documents  
 * @param {Array} postLikes - PostLike documents (optional)
 * @param {Array} commentLikes - CommentLike documents (optional)
 * @param {Array} connections - Connection documents (optional)
 */
async function seedNotifications(users, posts = [], comments = [], postLikes = [], commentLikes = [], connections = []) {
  console.log("🔔 Seeding notifications...");

  await Notification.deleteMany();
  console.log("   🗑️  Cleared old notifications");

  const notifications = [];
  const now = new Date();

  // Helper to get random item
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Helper to get random users excluding one
  const getRandomUsers = (count, excludeId) => {
    const filtered = users.filter(u => !u._id.equals(excludeId));
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, filtered.length));
  };

  console.log("   📝 Creating notification scenarios...");

  // ===================================
  // 1️⃣ POST LIKES - From actual likes or simulated
  // ===================================
  console.log("   💗 Post like notifications...");
  
  // Group post likes by post and create grouped notifications
  const likesByPost = new Map();
  
  if (postLikes.length > 0) {
    // Use actual like data
    postLikes.forEach(like => {
      const postId = like.post.toString();
      if (!likesByPost.has(postId)) likesByPost.set(postId, []);
      likesByPost.get(postId).push(like);
    });
  } else {
    // Simulate some post likes for notifications
    const postsToLike = posts.slice(0, Math.min(30, posts.length));
    for (const post of postsToLike) {
      const likers = getRandomUsers(Math.floor(Math.random() * 5) + 1, post.author);
      likesByPost.set(post._id.toString(), likers.map(u => ({ user: u._id, post: post._id })));
    }
  }

  for (const [postId, likes] of likesByPost) {
    const post = posts.find(p => p._id.toString() === postId);
    if (!post || likes.length === 0) continue;

    // Create ONE grouped notification with actorCount
    const latestLike = likes[likes.length - 1];
    const firstLiker = users.find(u => u._id.toString() === (latestLike.user?.toString() || latestLike._id?.toString()));
    
    if (firstLiker && !firstLiker._id.equals(post.author)) {
      notifications.push({
        recipient: post.author,
        actor: firstLiker._id,
        actorCount: likes.length,
        type: NOTIFICATION_TYPES.LIKE,
        target: post._id,
        targetModel: 'Post',
        groupingKey: post._id,
        isRead: Math.random() > 0.6,
        createdAt: latestLike.createdAt || getRandomDateAfter(new Date(post.createdAt), 1, 48),
        updatedAt: now,
      });
    }
  }

  // ===================================
  // 2️⃣ COMMENTS - Group by post
  // ===================================
  console.log("   💬 Comment notifications...");
  
  const topLevelComments = comments.filter(c => !c.parentComment);
  const commentsByPost = new Map();
  
  topLevelComments.forEach(comment => {
    const postId = comment.post.toString();
    if (!commentsByPost.has(postId)) commentsByPost.set(postId, []);
    commentsByPost.get(postId).push(comment);
  });

  for (const [postId, postComments] of commentsByPost) {
    const post = posts.find(p => p._id.toString() === postId);
    if (!post || postComments.length === 0) continue;

    // Filter out comments by the post author
    const otherComments = postComments.filter(c => 
      c.author.toString() !== post.author.toString()
    );
    
    if (otherComments.length === 0) continue;

    const latestComment = otherComments[otherComments.length - 1];
    
    notifications.push({
      recipient: post.author,
      actor: latestComment.author,
      actorCount: otherComments.length,
      type: NOTIFICATION_TYPES.COMMENT,
      target: latestComment._id,
      targetModel: 'Comment',
      groupingKey: post._id,
      isRead: Math.random() > 0.5,
      createdAt: latestComment.createdAt || getRandomDateAfter(new Date(post.createdAt), 2, 72),
      updatedAt: now,
    });
  }

  // ===================================
  // 3️⃣ REPLIES - Group by parent comment
  // ===================================
  console.log("   🔁 Reply notifications...");
  
  const replies = comments.filter(c => c.parentComment);
  const repliesByParent = new Map();
  
  replies.forEach(reply => {
    const parentId = reply.parentComment.toString();
    if (!repliesByParent.has(parentId)) repliesByParent.set(parentId, []);
    repliesByParent.get(parentId).push(reply);
  });

  for (const [parentId, parentReplies] of repliesByParent) {
    const parentComment = comments.find(c => c._id.toString() === parentId);
    if (!parentComment || parentReplies.length === 0) continue;

    // Filter out self-replies
    const otherReplies = parentReplies.filter(r => 
      r.author.toString() !== parentComment.author.toString()
    );
    
    if (otherReplies.length === 0) continue;

    const latestReply = otherReplies[otherReplies.length - 1];
    const post = posts.find(p => p._id.toString() === parentComment.post.toString());
    
    notifications.push({
      recipient: parentComment.author,
      actor: latestReply.author,
      actorCount: otherReplies.length,
      type: NOTIFICATION_TYPES.REPLY,
      target: parentComment._id,
      targetModel: 'Comment',
      groupingKey: post?._id || parentComment._id,
      isRead: Math.random() > 0.5,
      createdAt: latestReply.createdAt || getRandomDateAfter(new Date(parentComment.createdAt), 0.5, 24),
      updatedAt: now,
    });
  }

  // ===================================
  // 4️⃣ COMMENT LIKES - Group by comment
  // ===================================
  console.log("   💜 Comment like notifications...");
  
  const likesByComment = new Map();
  
  if (commentLikes.length > 0) {
    commentLikes.forEach(like => {
      const commentId = like.comment.toString();
      if (!likesByComment.has(commentId)) likesByComment.set(commentId, []);
      likesByComment.get(commentId).push(like);
    });
  } else {
    // Simulate some comment likes
    const commentsToLike = topLevelComments.slice(0, Math.min(20, topLevelComments.length));
    for (const comment of commentsToLike) {
      const likers = getRandomUsers(Math.floor(Math.random() * 4) + 1, comment.author);
      likesByComment.set(comment._id.toString(), likers.map(u => ({ user: u._id, comment: comment._id })));
    }
  }

  for (const [commentId, likes] of likesByComment) {
    const comment = comments.find(c => c._id.toString() === commentId);
    if (!comment || likes.length === 0) continue;

    const latestLike = likes[likes.length - 1];
    const firstLiker = users.find(u => u._id.toString() === (latestLike.user?.toString()));
    
    if (firstLiker && !firstLiker._id.equals(comment.author)) {
      notifications.push({
        recipient: comment.author,
        actor: firstLiker._id,
        actorCount: likes.length,
        type: NOTIFICATION_TYPES.COMMENT_LIKE,
        target: comment._id,
        targetModel: 'Comment',
        groupingKey: comment._id,
        isRead: Math.random() > 0.6,
        createdAt: latestLike.createdAt || getRandomDateAfter(new Date(comment.createdAt), 0.5, 24),
        updatedAt: now,
      });
    }
  }

  // ===================================
  // 5️⃣ REPOSTS - Individual notifications
  // ===================================
  console.log("   🔄 Repost notifications...");
  
  const reposts = posts.filter(p => p.originalPost);
  
  for (const repost of reposts.slice(0, 30)) {
    const originalPost = posts.find(p => p._id.toString() === repost.originalPost?.toString());
    if (!originalPost) continue;
    
    // Don't notify if user reposted their own content
    if (repost.author.toString() === originalPost.author.toString()) continue;

    notifications.push({
      recipient: originalPost.author,
      actor: repost.author,
      actorCount: 1,
      type: NOTIFICATION_TYPES.REPOST,
      target: originalPost._id,
      targetModel: 'Post',
      groupingKey: originalPost._id,
      isRead: Math.random() > 0.7,
      createdAt: repost.createdAt || now,
      updatedAt: now,
    });
  }

  // ===================================
  // 6️⃣ FOLLOWS - From actual connections
  // ===================================
  console.log("   👥 Follow notifications...");
  
  if (connections.length > 0) {
    // Use actual follow connections
    const follows = connections.filter(c => c.status === 'following').slice(0, 50);
    
    for (const follow of follows) {
      notifications.push({
        recipient: follow.following,
        actor: follow.follower,
        actorCount: 1,
        type: NOTIFICATION_TYPES.FOLLOW,
        target: null,
        targetModel: undefined,
        groupingKey: null,
        isRead: Math.random() > 0.5,
        createdAt: follow.createdAt || getRandomDateAfter(now, -30 * 24, 0), // Past 30 days
        updatedAt: now,
      });
    }
  } else {
    // Simulate some follow notifications
    for (const user of users.slice(0, Math.min(20, users.length))) {
      const followers = getRandomUsers(Math.floor(Math.random() * 3) + 2, user._id);
      
      for (const follower of followers) {
        notifications.push({
          recipient: user._id,
          actor: follower._id,
          actorCount: 1,
          type: NOTIFICATION_TYPES.FOLLOW,
          target: null,
          targetModel: undefined,
          groupingKey: null,
          isRead: Math.random() > 0.5,
          createdAt: getRandomDateAfter(now, -14 * 24, 0),
          updatedAt: now,
        });
      }
    }
  }

  // ===================================
  // 💾 Insert all notifications
  // ===================================
  console.log("   💾 Inserting notifications...");
  
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // ===================================
  // 📊 Statistics
  // ===================================
  const stats = {
    [NOTIFICATION_TYPES.LIKE]: notifications.filter(n => n.type === NOTIFICATION_TYPES.LIKE).length,
    [NOTIFICATION_TYPES.COMMENT]: notifications.filter(n => n.type === NOTIFICATION_TYPES.COMMENT).length,
    [NOTIFICATION_TYPES.REPLY]: notifications.filter(n => n.type === NOTIFICATION_TYPES.REPLY).length,
    [NOTIFICATION_TYPES.COMMENT_LIKE]: notifications.filter(n => n.type === NOTIFICATION_TYPES.COMMENT_LIKE).length,
    [NOTIFICATION_TYPES.REPOST]: notifications.filter(n => n.type === NOTIFICATION_TYPES.REPOST).length,
    [NOTIFICATION_TYPES.FOLLOW]: notifications.filter(n => n.type === NOTIFICATION_TYPES.FOLLOW).length,
  };

  console.log(`   📊 Statistics:`);
  console.log(`      Likes: ${stats[NOTIFICATION_TYPES.LIKE]}`);
  console.log(`      Comments: ${stats[NOTIFICATION_TYPES.COMMENT]}`);
  console.log(`      Replies: ${stats[NOTIFICATION_TYPES.REPLY]}`);
  console.log(`      Comment Likes: ${stats[NOTIFICATION_TYPES.COMMENT_LIKE]}`);
  console.log(`      Reposts: ${stats[NOTIFICATION_TYPES.REPOST]}`);
  console.log(`      Follows: ${stats[NOTIFICATION_TYPES.FOLLOW]}`);
  
  console.log(`✅ Notifications seeded: ${notifications.length} (${notifications.filter(n => !n.isRead).length} unread)`);
  
  return notifications;
}

module.exports = seedNotifications;
