const PostModel = require("../models/Post");
const PostLikesModel = require("../models/PostLike");

const getAllPosts = async (req, res) => {
  try {
    const posts = await PostModel.find();

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const posts = await PostModel.findById(req.params.id);
    if (!posts) {
      return res
        .status(404)
        .json({ success: false, message: "this post not found" });
    }
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "this post not found",
      error: err.message,
    });
  }
};

const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    req.body.author_id = userId;
    const newPost = await PostModel.create(req.body);
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: "Invalid Data", error: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: postId } = req.params;

    const existingPost = await PostModel.findById(postId);
    if (!existingPost) {
      return res
        .status(404)
        .json({ success: false, message: "this post not found" });
    }

    if (existingPost.author_id.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to update this post" });
    }

    const updatesPost = await PostModel.findByIdAndUpdate(postId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatesPost });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "this post not found",
      error: err.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: postId } = req.params;

    const existingPost = await PostModel.findById(postId);
    if (!existingPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (existingPost.author_id.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this post" });
    }

    await PostModel.findByIdAndDelete(postId);

    return res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Delete Failed", error: error.message });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    const postItem = await PostModel.findById(postId);
    if (!postItem) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    const like = await PostLikesModel.findOne({
      post_id: postId,
      user_id: userId,
    });

    if (like) {
      await PostLikesModel.deleteOne({ _id: like._id });
      postItem.likes_count = Math.max(0, postItem.likes_count - 1);
      await postItem.save();
      return res.status(200).json({
        success: true,
        message: "Post unliked successfully",
        likes_count: postItem.likes_count,
      });
    }

    await PostLikesModel.create({ post_id: postId, user_id: userId });
    postItem.likes_count += 1;
    await postItem.save();

    return res.status(200).json({
      success: true,
      message: "Post liked successfully",
      likes_count: postItem.likes_count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPostLikes = async (req, res) => {
  try {
    const { id: postId } = req.params;

    const likes = await PostLikesModel.find({ post_id: postId }).populate(
      "user_id",
      "first_name last_name profilePicture"
    );

    res.status(200).json({ success: true, data: likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  updatePost,
  createPost,
  deletePost,
  toggleLikePost,
  getPostLikes,
};
