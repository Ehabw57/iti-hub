const mongoose = require("mongoose");

const commentLikesSchema = new mongoose.Schema(
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
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

commentLikesSchema.index({ comment_id: 1, user_id: 1 }, { unique: true });

const CommentLike = mongoose.model("comment_likes", commentLikesSchema);

module.exports = CommentLike;