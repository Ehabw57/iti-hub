const mongoose = require("mongoose");

/**
 * GroupPost - a post inside a CommunityGroup feed
 */
const groupPostSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityGroup",
      required: [true, "Post must belong to a group"],
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: 5000,
    },
    attachments: [{
      type: String,
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

groupPostSchema.index({ groupId: 1, createdAt: -1 });

const GroupPost = mongoose.model("GroupPost", groupPostSchema);

module.exports = GroupPost;