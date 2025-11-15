const Post = require("../../models/Post");
const PostLike = require("../../models/PostLike");
const mongoose = require("mongoose");

/**
 * Creates a test post with default or custom data
 */
async function createTestPost(author_id, postData = {}) {
  const defaultPostData = {
    author_id,
    content: "This is a test post content",
    likes_count: 0,
    comments_count: 0,
    ...postData,
  };

  const post = await Post.create(defaultPostData);
  return post;
}

/**
 * Creates multiple test posts for a user
 */
async function createMultipleTestPosts(author_id, count = 3) {
  const posts = [];
  for (let i = 0; i < count; i++) {
    const post = await createTestPost(author_id, {
      content: `Test post content ${i + 1}`,
    });
    posts.push(post);
  }
  return posts;
}

/**
 * Creates a post like between user and post
 */
async function createPostLike(post_id, user_id) {
  const like = await PostLike.create({ post_id, user_id });
  
  // Update the post's like count
  await Post.findByIdAndUpdate(post_id, { $inc: { likes_count: 1 } });
  
  return like;
}

/**
 * Creates multiple likes for a post from different users
 */
async function createMultiplePostLikes(post_id, user_ids) {
  const likes = [];
  for (const user_id of user_ids) {
    const like = await createPostLike(post_id, user_id);
    likes.push(like);
  }
  return likes;
}

/**
 * Generates a valid ObjectId string for testing
 */
function generateObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Generates an invalid ObjectId string for testing
 */
function generateInvalidObjectId() {
  return "invalid-object-id";
}

/**
 * Generates a valid but non-existent ObjectId for testing
 */
function generateNonExistentObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Creates post test data with media
 */
async function createTestPostWithMedia(author_id) {
  const postData = {
    content: "Post with media content",
    media: [
      {
        url: "https://example.com/image1.jpg",
        type: "photo",
      },
      {
        url: "https://example.com/video1.mp4", 
        type: "video",
      },
    ],
  };
  
  return await createTestPost(author_id, postData);
}

module.exports = {
  createTestPost,
  createMultipleTestPosts,
  createPostLike,
  createMultiplePostLikes,
  createTestPostWithMedia,
  generateObjectId,
  generateInvalidObjectId,
  generateNonExistentObjectId,
};