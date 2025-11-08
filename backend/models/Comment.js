const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    parent_comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    image_url: {
      type: String,
      default: null,
    },
    likes_count: {
      type: Number,
      default: 0,
    },
    reply_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

CommentSchema.index({ post_id: 1, parent_comment_id: 1 });

module.exports = mongoose.model("Comment", CommentSchema);
