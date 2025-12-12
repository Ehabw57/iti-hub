const express = require("express");
const { checkAuth } = require("../middlewares/checkAuth");
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
commentRoute.post("/comments/:postId", checkAuth, createComment);
commentRoute.delete("/comments/:id", checkAuth, deleteComment);
commentRoute.patch("/comments/:id", checkAuth, updateComment);

commentRoute.post("/comments/:id/like", checkAuth, toggleLikeComment);
commentRoute.get("/comments/:id/likes", checkAuth, getCommentLikes);

module.exports = commentRoute;
