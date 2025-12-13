const mongoose = require("mongoose");

const postLikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Unique compound index to ensure a user can only like a post once
postLikeSchema.index({ user: 1, post: 1 }, { unique: true });

// Query indexes for efficient lookups
postLikeSchema.index({ user: 1, createdAt: -1 });
postLikeSchema.index({ post: 1, createdAt: -1 });

const PostLike = mongoose.model("PostLike", postLikeSchema);

module.exports = PostLike;
