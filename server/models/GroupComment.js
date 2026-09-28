const mongoose = require("mongoose");

/**
 * GroupComment - a comment on a GroupPost
 */
const groupCommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupPost",
      required: [true, "Comment must belong to a post"],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

groupCommentSchema.index({ postId: 1, createdAt: 1 });

const GroupComment = mongoose.model("GroupComment", groupCommentSchema);

module.exports = GroupComment;