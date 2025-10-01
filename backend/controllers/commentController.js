const mongoose = require("mongoose");
const Comment = require("../models/Comment");

async function getCommentsByPost(req, res) {
  try {
    const postId = req.params.postId;

    const comments = await Comment.find({ post_id: postId }).lean();

    function buildTree(parentId = null) {
      return comments
        .filter((c) => String(c.parent_comment_id) === String(parentId))
        .map((c) => ({
          ...c,
          replies: buildTree(c._id),
        }));
    }

    const nestedComments = buildTree(null);

    res.status(200).json(nestedComments);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      return res.status(200).json({ message: "object deleted", id: commentId });
    res.status(404).json({ message: "comment not found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateComment(req, res) {
  try {
    const targetID = req.params.id;

    const updatedComment = await Comment.findByIdAndUpdate(
      targetID,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (updatedComment) return res.status(200).json(updatedComment);
    res.status(404).json({ message: "comment not found" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
};
