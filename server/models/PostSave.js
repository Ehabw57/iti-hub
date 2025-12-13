const mongoose = require("mongoose");

const postSaveSchema = new mongoose.Schema(
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

// Unique compound index to ensure a user can only save a post once
postSaveSchema.index({ user: 1, post: 1 }, { unique: true });

// Query indexes for efficient lookups
postSaveSchema.index({ user: 1, createdAt: -1 });
postSaveSchema.index({ post: 1, createdAt: -1 });

const PostSave = mongoose.model("PostSave", postSaveSchema);

module.exports = PostSave;
