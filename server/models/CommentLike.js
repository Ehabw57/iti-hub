const mongoose = require("mongoose");

const commentLikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Unique compound index to ensure a user can only like a comment once
commentLikeSchema.index({ user: 1, comment: 1 }, { unique: true });

// Query indexes for efficient lookups
commentLikeSchema.index({ user: 1, createdAt: -1 });
commentLikeSchema.index({ comment: 1, createdAt: -1 });

const CommentLike = mongoose.model("CommentLike", commentLikeSchema);

module.exports = CommentLike;