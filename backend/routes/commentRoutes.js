const express = require("express");
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
commentRoute.post("/comments/:postId", createComment);
commentRoute.delete("/comments/:id", deleteComment);
commentRoute.patch("/comments/:id", updateComment);

commentRoute.post("/comments/:id/like", toggleLikeComment);
commentRoute.get("/comments/:id/likes", getCommentLikes);


module.exports = commentRoute;
