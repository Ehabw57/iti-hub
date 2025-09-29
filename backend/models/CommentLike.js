
const mongoose = require("mongoose");

const commentLikeSchema = new mongoose.Schema(
  {
    comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comments",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commentLikeSchema.index({ comment_id: 1, user_id: 1 }, { unique: true });

const CommentLike = mongoose.model("Comment_like", commentLikeSchema);

module.exports = CommentLike;