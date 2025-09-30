const express = require("express");
const {
  getCommentsByPost,
  createComment,
  deleteComment,
} = require("../controllers/commentController");

const commentRoute = express.Router();

commentRoute.get("/posts/:postId/comments", getCommentsByPost);
commentRoute.post("/posts/:postId/comments", createComment);
commentRoute.delete("/comments/:id", deleteComment);

module.exports = commentRoute;
