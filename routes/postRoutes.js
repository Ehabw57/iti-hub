const express = require("express");
const { authenticate, authorize } = require("../middlewares/checkAuth");

const {
  getAllPosts,
  getPostById,
  updatePost,
  createPost,
  deletePost,
  toggleLikePost,
  getPostLikes,
} = require("../controllers/postController");

const postRoutes = express.Router();

postRoutes.get("/posts", getAllPosts);
postRoutes.get("/posts/:id", getPostById);
postRoutes.put("/posts/:id", authenticate, updatePost);
postRoutes.post("/posts", authenticate, createPost);
postRoutes.delete("/posts/:id", authenticate, deletePost);

postRoutes.post("/posts/:id/like", authenticate, toggleLikePost);
postRoutes.get("/posts/:id/likes", getPostLikes);

module.exports = postRoutes;
