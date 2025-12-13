const express = require("express");
const { checkAuth } = require("../middlewares/checkAuth");
const updateComment = require("../controllers/comment/updateCommentController");
const deleteComment = require("../controllers/comment/deleteCommentController");
const { likeComment, unlikeComment } = require("../controllers/comment/likeCommentController");

const commentRoute = express.Router();

// Update comment
commentRoute.put("/:id", checkAuth, updateComment);

// Delete comment
commentRoute.delete("/:id", checkAuth, deleteComment);

// Like/Unlike comment
commentRoute.post("/:id/like", checkAuth, likeComment);
commentRoute.delete("/:id/like", checkAuth, unlikeComment);

module.exports = commentRoute;
