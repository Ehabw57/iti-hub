const mongoose = require("mongoose");
const Comment = require("../models/Comment");

async function getCommentsByPost(req, res) {
  try {
    const postId = req.params.postId;
    console.log(postId);

    const comments = await Comment.find({ post_id: postId });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ messages: err.message });
  }
}

async function createComment(req, res) {
  try {
    const post_id = req.params.postId;
    const { author_id, content, parent_comment_id, image_url } = req.body;

    const newComment = new Comment({
      post_id,
      author_id,
      content,
      parent_comment_id,
      image_url,
    });
    console.log(newComment);
    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteComment(req, res) {
  try {
    const commentId = req.params.id;

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (deletedComment)
      return res.status(202).json({ message: "object susceefully delted" });
    res.status(404).json({ message: "comment not found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getCommentsByPost, createComment, deleteComment };
