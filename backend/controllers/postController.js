const mongoose = require("mongoose");
const post = require("../models/Post");

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await post.find().skip(skip).limit(limit);
    const total = await post.countDocuments();

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      data: posts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "this post not found" });
  }
};

const getPostById = async (req, res) => {
  try {
    const posts = await post.findById(req.params.id);
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
    const newPost = await post.create(req.body);
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: "Invalid Data", error: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const updatesPost = await post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatesPost) {
      res.status(404).json({ success: false, message: "this post not found" });
    }
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
      const deletedPost = await Post.findByIdAndDelete(req.params.id);
      if (!deletedPost) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Delete Failed", error: error.message });
    }
  };

module.exports = {
  getAllPosts,
  getPostById,
  updatePost,
  createPost,
  deletePost
};
