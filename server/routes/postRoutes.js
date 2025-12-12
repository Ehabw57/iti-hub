const express = require("express");
const { checkAuth, authorize } = require("../middlewares/checkAuth");

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
postRoutes.put("/posts/:id", checkAuth, updatePost);
postRoutes.post("/posts", checkAuth, createPost);
postRoutes.delete("/posts/:id", checkAuth, deletePost);

postRoutes.post("/posts/:id/like", checkAuth, toggleLikePost);
postRoutes.get("/posts/:id/likes", getPostLikes);

module.exports = postRoutes;
