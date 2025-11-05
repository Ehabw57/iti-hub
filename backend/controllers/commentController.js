const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const CommentLike = require("../models/CommentLike");

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

const findCommentOrError = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid comment ID");
  }

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new Error("Comment not found");
  }

  return comment;
};

const toggleLikeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await findCommentOrError(id);

    const userId = req.body.user_id || (req.user && req.user.id);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, error: "Valid user_id is required" });
    }

    const existing = await CommentLike.findOne({
      comment_id: id,
      user_id: userId,
    });

    if (existing) {
      await CommentLike.deleteOne({ _id: existing._id });
      const likesCount = await CommentLike.countDocuments({ comment_id: id });
      return res.status(200).json({
        success: true,
        message: "Comment unliked",
        likesCount,
      });
    } else {
      await CommentLike.create({ comment_id: id, user_id: userId });
      const likesCount = await CommentLike.countDocuments({ comment_id: id });
      return res.status(200).json({
        success: true,
        message: "Comment liked",
        likesCount,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getCommentLikes = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await findCommentOrError(id);

    const likes = await CommentLike.find({ comment_id: id });

    const users = likes.map((l) => {
      const u = l.user_id;

      return { userId: u._id };
    });

    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
  toggleLikeComment,
  getCommentLikes,
};
