const express = require("express");
const {authenticate, authorize} = require("../middlewares/checkAuth");
const {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
  toggleLikeComment,
  getCommentLikes,
} = require("../controllers/commentController");

const commentRoute = express.Router();

commentRoute.get("/posts/:postId/comments", getCommentsByPost);
commentRoute.post("/comments/:postId", authenticate, createComment);
commentRoute.delete("/comments/:id", authenticate, deleteComment);
commentRoute.patch("/comments/:id", authenticate, updateComment);

commentRoute.post("/comments/:id/like", authenticate, toggleLikeComment);
commentRoute.get("/comments/:id/likes", authenticate, getCommentLikes);

module.exports = commentRoute;
