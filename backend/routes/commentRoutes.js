const express = require("express");
const {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
} = require("../controllers/commentController");

const commentRoute = express.Router();

commentRoute.get("/posts/:postId/comments", getCommentsByPost);
commentRoute.post("/posts/:postId/comments", createComment);
commentRoute.delete("/comments/:id", deleteComment);
commentRoute.patch("/comments/:id", updateComment);

module.exports = commentRoute;
